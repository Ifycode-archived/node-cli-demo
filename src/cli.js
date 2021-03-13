import arg from 'arg';
import inquirer from 'inquirer';
/*
import { createProject } from './main';
import { initGit } from './main';
*/

function parseArgumentsIntoOptions(rawArgs) {
    const args = arg({
        '--git': Boolean,
        '--yes': Boolean,
        '--install': Boolean,
        '--skip-install': Boolean,
        '-g': '--git',
        '-y': '--yes',
        '-i': '--install',
        '-s': '--skip-install'
    }, 
    {
       argv: rawArgs.slice(2),
    });

    return {
        skipPrompts: args['--yes'] || false,
        git: args['--git'] || false,
        folderName: args._[0],
        template: args._[1],
        runInstall: args['--install'] || true, //set to true as default, so that --skip-install can be used instead.
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
            runInstall: options.runInstall
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
    
    if (!options.template) {
        questions.push({
            type: 'list',
            name: 'template',
            message: 'Please choose which project template to use',
            choices: ['Javascript', 'Typescript'],
            default: defaultTemplate
        });
    }

    if (!options.git) {
        questions.push({
            type: 'confirm',
            name: 'git',
            message: 'Initialize a git repository?',
            default: false
        });
    }

    const answers = await inquirer.prompt(questions);

    return {
        ...options,
        folderName: options.folderName || answers.folderName,
        template: options.template || answers.template,
        git: options.git || answers.git
    }
    
}

export async function cli(args) {
    let options = parseArgumentsIntoOptions(args);
    options = await promptForMissingOptions(options);
    console.log(options);
    /*try {
        await createProject(options);
        //await initGit(options);
    } catch (err) {
        console.log('Error | ', err);
    }*/   
}