#!/usr/bin/env node

require('dotenv').config();
const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const ora = require('ora');
const execa = require('execa');

const { assertGitBranch, displayError } = require('./common');

const spinner = ora();

const ALLOWED_PUBLISH_BRANCHES = ['main'];

const publishToNpm = async () => {
  spinner.start('Publishing to NPM');

  try {
    const tokenArgs = [
      'set',
      `//registry.npmjs.org/:_authToken=${process.env.NPM_TOKEN}`,
    ];
    await execa('npm', tokenArgs);
  } catch {
    throw new Error('Error setting NPM auth token');
  }

  try {
    const publishArgs = [
      'lerna',
      'publish',
      'from-package',
      '--no-verify-access',
      '--yes',
    ];
    await execa('yarn', publishArgs);
  } catch {
    throw new Error('Error running lerna publish');
  }

  spinner.start().succeed('Published to NPM');
};

const tagRelease = async () => {
  spinner.start('Generating new release tag');

  const date = new Date();
  const day = ('0' + date.getDate()).slice(-2);
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const year = date.getFullYear();
  const releaseDate = `${year}-${month}-${day}`;

  const tagArgs = [
    'tag',
    '-a',
    `r${releaseDate}`,
    '-m',
    `${releaseDate} release`,
  ];
  await execa('git', tagArgs);

  spinner.succeed();
  spinner.start('Pushing generated tag');

  const pushArgs = ['push', '--follow-tags', 'origin'];
  await execa('git', pushArgs);

  spinner.succeed('Pushed tag');
};

const run = async () => {
  clear();
  // Display intro message banner
  console.log(chalk.blue(figlet.textSync('publish')));
  try {
    await assertGitBranch(ALLOWED_PUBLISH_BRANCHES, spinner);
    await publishToNpm();
    await tagRelease();
    spinner.succeed('Success\n✨');
  } catch (error) {
    displayError(error.message, spinner);
  }
};

run();
