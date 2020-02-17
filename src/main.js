import chalk from 'chalk';
import fs from 'fs';
import ncp from 'ncp';
import path from 'path';
import { promisify } from 'util';
import Listr from 'listr';
import execa from 'execa';
import os from 'os';
import { projectInstall } from 'pkg-install';

var URL = require('url').URL;
const access = promisify(fs.access);
const copy = promisify(ncp);

// Copy Files
async function copyFiles(options) {
    await copyCommonFiles(options);
    await copyTemplateFiles(options);
}

async function copyCommonFiles(options) {
    return copy(options.commonDirectorty, options.targetDirectory, {
        clobber: false,
    });
}
async function copyTemplateFiles(options) {
    return copy(options.templateDirectory, options.targetDirectory, {
        clobber: false,
    });
}
// create package.json
async function createPackageJson(options) {
    let packageJson = {
        name: options.projectName,
        version: '0.1.0',
        description:
            'Generated via @xarv/create-js-app [TODO Change this description]',
        scripts: {
            prebuild: 'npm run clean',
            clean: 'rimraf ./dist/**',
            build: 'webpack',
            test: 'echo "Error: no test specified" && exit 1',
        },
        author: '',
        license: 'MIT',
        devDependencies: {
            'html-webpack-plugin': '^3.2.0',
            rimraf: '^3.0.2',
            webpack: '^4.41.5',
            'webpack-cli': '^3.3.10',
        },
    };

    if (options.template === TEMPLATE_CHOICES.JAVASCRIPT) {
        // NO_CHANGE to package.json
    } else if (options.template === TEMPLATE_CHOICES.TYPESCRIPT) {
        // add more dependency to package.json
        packageJson.devDependencies = {
            'html-webpack-plugin': '^3.2.0',
            rimraf: '^3.0.2',
            webpack: '^4.41.5',
            'webpack-cli': '^3.3.10',
            'ts-loader': '^6.2.1',
            typescript: '^3.7.5',
        };
    }

    return new Promise(function(resolve, reject) {
        fs.writeFile(
            path.join(options.targetDirectory, 'package.json'),
            JSON.stringify(packageJson, null, 2) + os.EOL,
            'utf8',
            function(err) {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}

// Git init utility
async function initGit(options) {
    const result = await execa('git', ['init'], {
        cwd: options.targetDirectory,
    });
    if (result.failed) {
        return Promise.reject(new Error('Failed to initialize git'));
    }
    return;
}

export async function createProject(options) {
    let targetDirectory = path.resolve(process.cwd(), options.projectName);
    console.log(
        'Initializing project %s at %s',
        chalk.green.bold(options.projectName),
        chalk.gray(targetDirectory)
    );

    options = {
        ...options,
        targetDirectory,
    };

    const currentFileUrl = import.meta.url;

    // Common Files Directory
    const commonFilesDir = path.resolve(
        new URL(currentFileUrl).pathname,
        '../../templates',
        'common'
    );
    options.commonDirectorty = commonFilesDir;
    try {
        await access(commonFilesDir, fs.constants.R_OK);
    } catch (err) {
        console.error('%s Invalid template name', chalk.red.bold('ERROR'));
        process.exit(1);
    }

    // Template Files Directory
    const templateDir = path.resolve(
        new URL(currentFileUrl).pathname,
        '../../templates',
        options.template.toLowerCase()
    );
    options.templateDirectory = templateDir;

    try {
        await access(templateDir, fs.constants.R_OK);
    } catch (err) {
        console.error('%s Invalid template name', chalk.red.bold('ERROR'));
        process.exit(1);
    }

    const tasks = new Listr([
        {
            title: 'Copy project files',
            task: () => copyFiles(options),
        },
        {
            title: 'Create package.json for project',
            task: () => createPackageJson(options),
        },
        {
            title: 'Initialize git',
            task: () => initGit(options),
            enabled: () => options.git,
        },
        {
            title: 'Install dependencies',
            task: () =>
                projectInstall({
                    cwd: options.targetDirectory,
                }),
            skip: () =>
                !options.runInstall
                    ? 'Pass --install to automatically install dependencies'
                    : undefined,
        },
    ]);

    await tasks.run();

    console.log(
        '%s Project %s is ready',
        chalk.green.bold('DONE'),
        chalk.green.bold(options.projectName)
    );
    return true;
}

export const TEMPLATE_CHOICES = {
    JAVASCRIPT: 'JavaScript',
    TYPESCRIPT: 'TypeScript',
};
