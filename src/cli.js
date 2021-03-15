import arg from 'arg';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { createProject } from './main';
import { initGit } from './main';

function parseArgumentsIntoOptions(rawArgs) {

    //make -x the alias for --skip-git
    function myHandler(value, argName, previousValue) {
        return previousValue || '--skip-git'; //1.b. do same for alias (see comments 1.a and 1.c. below)
    }

    const args = arg({
        '--git': Boolean,
        '--skip-git': Boolean,
        '--yes': Boolean,
        '--install': Boolean,
        '--skip-install': Boolean,
        '-g': '--git',
        '--skip-git': arg.flag(myHandler),
        '-x': '--skip-git',
        '-y': '--yes',
        '-i': '--install',
        '-s': '--skip-install'
    }, 
    {
       argv: rawArgs.slice(2),
    });

    return {
        skipPrompts: args['--yes'] || false,
        git: args['--git'] || true, //set git to true as default, so that --skip-git can be used instead later
        skipGit: args['--skip-git'], //1.a. check if --skip-git command is passed by user in command line instead (see comments 1.b. above and 1.c below)
        folderName: args._[0],
        template: args._[1],
        runInstall: args['--install'] || true, //set to true as default, so that --skip-install can be used instead later.
        skipInstall: args['--skip-install'] || false
    }
}

async function promptForMissingOptions(options) {
    const [defaultFolderName, defaultTemplate] = ['node-mongo-starter-kit', 'Javascript'];
    
    if (options.skipPrompts) {
        return {
            ...options,
            folderName: options.folderName || defaultFolderName,
            template: options.template || defaultTemplate,
            runInstall: false,
            git: false
        }
    }

    const questions = []; 

    if (!options.folderName) {
        questions.push({
            type: 'input',
            name: 'folderName',
            message: 'Please enter folder name:',
            default: defaultFolderName
        });
    }

    const templateCollection = ['Javascript', 'Typescript'];
    const equalToAtLeastOneTemplate = templateCollection.some(tc => { 
        return tc === options.template
    });

    if (!options.template || equalToAtLeastOneTemplate === false) {
        questions.push({
            type: 'list',
            name: 'template',
            message: 'Please choose which project template to use',
            choices: templateCollection,
            default: defaultTemplate
        });
    }

    if (equalToAtLeastOneTemplate === false && options.template !== undefined) {
        console.log( chalk.cyanBright(`Cli does not have template: "${options.template}" in it's template collection`) );
    }

    /* Remove prompt for git since the commands (--git and) --skip-git are used.

    if (!options.git) {
        questions.push({
            type: 'confirm',
            name: 'git',
            message: 'Initialize a git repository?',
            default: false
        });
    }*/

    const answers = await inquirer.prompt(questions);

    if (equalToAtLeastOneTemplate === false) {
        return {
            ...options,
            folderName: options.folderName || answers.folderName,
            template: answers.template, //otherwise it will return user's entry (options.template) which we don't want in this case
            git: options.git || answers.git
        }
    }

    return {
        ...options,
        folderName: options.folderName || answers.folderName,
        template: options.template || answers.template,
        git: options.git || answers.git
    }
}

export async function cli(args) {

    let options = parseArgumentsIntoOptions(args);

    if (options.skipInstall) {
        options.runInstall = false; //set runInstall to false if skipInstall is true
    }

    if (options.skipGit) {
        options.git = false; //1.c. if skipGit is passed in command line, set git to false (see comment 1.a and 1.b above)
    }

    options = await promptForMissingOptions(options);

    try {
        await createProject(options);
        await initGit(options);
    } catch (err) {
        console.log('Error | ', err);
    }   
}