import chalk from 'chalk';
import fs from 'fs';
import ncp from 'ncp';
import path from 'path';
import { promisify } from 'util';
import execa from 'execa';
import Listr from 'listr';
import { projectInstall } from 'pkg-install';

const access = promisify(fs.access);
const copy = promisify(ncp);

async function copyTemplateFiles(options) {
    return copy(options.templateDirectory, options.targetDirectory, {
        clobber: false  
    });
}

export async function initGit(options) {
    if (options.git) { //initialize git only if git returns true
        const result = await execa('git', ['init'], {
            cwd: options.targetDirectory
        });

        if (result.failed) {
            return Promise.reject(new Error('Failed to initialize git'));
        }
    }

    return;
}

export async function createProject(options) {
    
    options = {
        ...options,
        targetDirectory: options.targetDirectory || process.cwd() //root/parent folder at this point
    };

    //create folder with user input here...
    fs.mkdirSync(`./${options.folderName}`, { recursive: true });
    
    //change directory from root/parent folder into user's own folder (so that it becomes cwd)
    process.chdir(`./${options.folderName}`);
    options.targetDirectory = process.cwd();
    
    const currentFileUrl = import.meta.url;

    const templateDir = path.resolve(
        new URL(currentFileUrl).pathname.substring(new URL(currentFileUrl).pathname.indexOf('/') + 1), 
        '../../templates',
        options.template.toLowerCase()
    );

    options.templateDirectory = templateDir;

    try {
        await access(templateDir, fs.constants.R_OK);
    }catch (err) {
        console.error('%s Invalid template name', chalk.red.bold('ERROR'));
        process.exit(1);
    }

    const tasks = new Listr([
        {
            title: 'copy project files',
            task: () => copyTemplateFiles(options)
        },
        {
            title: 'Initialize git',
            task: () => initGit(options),
            skip: () => !options.git ? 'Automatically initialize git by doing nothing. Alternatively, pass --git or -g' : undefined
        },
        {
            title: 'Install dependencies',
            task: () => projectInstall({
                cwd: options.targetDirectory
            }),
            skip: () => !options.runInstall ? 'Automatically install dependencies by doing nothing. Alternatively, pass --install or -i' : undefined
        }
    ]);

    await tasks.run();

    console.log(`%s Project bootstrapped into the folder you specified => ${options.folderName} <=`, chalk.green.bold('DONE'));
    return true;
}

/*
//new note:

Removed the enabled code below since we have no need of prompt 
for git again due to introduction of --skip-git command argument

enabled: () => options.git, 

Therefore used skip instead like in the install case:
 skip: () => !options.git ? 'Automatically initialize git by doing nothing. Alternatively, pass --git or -g' : undefined
*/