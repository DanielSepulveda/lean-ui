#!/usr/bin/env node

require('dotenv').config();
const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const ora = require('ora');
const execa = require('execa');
const globToRegExp = require('glob-to-regexp');

const spinner = ora();

const ALLOWED_RELEASE_BRANCHES = ['main'];

const displayError = (error) => {
  const message = chalk.red(error);

  spinner.fail(message);
};

const getCurrentGitBranch = async () => {
  let currentBranch = '';

  try {
    const output = await execa('git', ['branch', '--show-current']);
    currentBranch = output.stdout.toString();
  } catch (error) {
    throw new Error('Git branch not found');
  }

  return currentBranch;
};

const assertGitBranch = async () => {
  spinner.start(`Asserting current git branch to be an allowed release branch`);

  const currentBranch = await getCurrentGitBranch();
  const isInAllowedBranch = ALLOWED_RELEASE_BRANCHES.some((branch) => {
    const re = globToRegExp(branch);
    return re.test(currentBranch);
  });

  if (isInAllowedBranch) {
    spinner.succeed();
  } else {
    throw new Error(`Switch to a valid release branch`);
  }
};

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
    await assertGitBranch();
    await publishToNpm();
    await tagRelease();
    spinner.succeed('Success\n✨');
  } catch (error) {
    displayError(error.message);
  }
};

run();
