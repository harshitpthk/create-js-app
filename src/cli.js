import arg from 'arg';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { createProject, TEMPLATE_CHOICES } from './main';

function parseArgumentsIntoOptions(rawArgs) {
    const args = arg(
        {
            '--git': Boolean,
            '--yes': Boolean,
            '--install': Boolean,
            '--help': Boolean,
            '-g': '--git',
            '-y': '--yes',
            '-i': '--install',
            '-h': '--help',
        },
        {
            argv: rawArgs.slice(2), // removing the first two arguments as they represent the execution environment
        }
    );
    return {
        skipPrompts: args['--yes'] || false,
        git: args['--git'] || false,
        projectName: args._[0],
        template: args._[1],
        runInstall: args['--install'] || false,
        help: args[`--help`] || false,
    };
}

function showHelp(options) {
    console.log(chalk.green.bold('Creating an App'));
    console.log(`1. npx @xarv/create-js-app my-app`);
    console.log(`1. npm init @xarv/js-app my-app`);
    console.log();
    console.log(chalk.green.bold('Options'));
    console.log(`
        1. --git/-g #initialize the package as a git repo \n
        2. --install/-i #install the dependency at the time of project creation \n
        3. --yes/-y #skip prompts with defaults\n
        4. --help/-h #options and usage\n
    `);
}

async function promptForMissingOptions(options) {
    const defaultProjectName = 'test-js-app';
    const defaultTemplate = TEMPLATE_CHOICES.JAVASCRIPT;
    const questions = [];

    if (!options.projectName) {
        questions.push({
            name: 'projectName',
            message: 'Please input project name',
            default: defaultProjectName,
        });
    }

    if (options.skipPrompts) {
        return {
            ...options,
            template: options.template || defaultTemplate,
        };
    }

    if (!options.template) {
        questions.push({
            type: 'list',
            name: 'template',
            message: 'Please choose which project template to use',
            choices: [TEMPLATE_CHOICES.JAVASCRIPT, TEMPLATE_CHOICES.TYPESCRIPT],
            default: defaultTemplate,
        });
    }

    if (!options.git) {
        questions.push({
            type: 'confirm',
            name: 'git',
            message: 'Initialize a git repository?',
            default: false,
        });
    }

    const answers = await inquirer.prompt(questions);
    return {
        ...options,
        projectName: options.projectName || answers.projectName,
        template: options.template || answers.template,
        git: options.git || answers.git,
    };
}

export async function run(args) {
    let options = parseArgumentsIntoOptions(args);
    if (options.help) {
        showHelp(options);
    } else {
        options = await promptForMissingOptions(options);
        await createProject(options);
    }
}
