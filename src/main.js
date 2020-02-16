import chalk from 'chalk';
import fs from 'fs';
import ncp from 'ncp';
import path from 'path';
import { promisify } from 'util';

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

export async function createProject(options) {
    console.log(options);
    options = {
        ...options,
        targetDirectory: process.cwd(),
    };

    const currentFileUrl = import.meta.url;

    // Common Files Directory
    const commonFilesDir = path.resolve(
        new URL(currentFileUrl).pathname,
        '../../templates/common'
    );
    options.commonDirectorty = commonFilesDir;

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

    console.log('Copy project files');
    await copyFiles(options);

    console.log('%s Project ready', chalk.green.bold('DONE'));
    return true;
}
