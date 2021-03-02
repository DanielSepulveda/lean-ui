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
      'from-git',
      '--no-verify-access',
      '--yes',
    ];
    await execa('yarn', publishArgs);
  } catch {
    throw new Error('Error running lerna publish');
  }

  spinner.start().succeed('Published to NPM');
};

const versionPackages = async () => {
  const lernaArgs = [
    'lerna',
    'version',
    '--conventional-commits', // version packages by conventional commits
    '--no-changelog', // don`t generate changelog
    '--allow-branch main',
    '--yes', // answer yes to all
  ];

  spinner.info('Versionning changed packages');
  // Lerna version packages
  await execa('yarn', lernaArgs, {
    stdin: process.stdin,
    stdout: process.stdout,
  });

  spinner.start().succeed('Commited version changes');
};

// const OLD_tagRelease = async () => {
//   spinner.start('Generating new release tag');

//   const date = new Date();
//   const day = ('0' + date.getDate()).slice(-2);
//   const month = ('0' + (date.getMonth() + 1)).slice(-2);
//   const year = date.getFullYear();
//   const releaseDate = `${year}-${month}-${day}`;

//   const tagArgs = [
//     'tag',
//     '-a',
//     `r${releaseDate}`,
//     '-m',
//     `${releaseDate} release`,
//   ];
//   await execa('git', tagArgs);

//   spinner.succeed();
//   spinner.start('Pushing generated tag');

//   const pushArgs = ['push', '--follow-tags', 'origin'];
//   await execa('git', pushArgs);

//   spinner.succeed('Pushed tag');
// };

/**
 * Tell lerna to tag the new release but undo the package version
 * commit becasue it was already done by the release script
 */
// const tagRelease = async () => {
//   spinner.start('Generating new release tags');

//   const lernaArgs = [
//     'lerna',
//     'version',
//     '--conventional-commits', // version packages by conventional commits
//     '--no-changelog', // don`t generate changelog
//     '--no-push', // don`t push changes (commit changes and add tags)
//     '--yes', // answer yes to all
//   ];

//   spinner.info();
//   await execa('yarn', lernaArgs, {
//     stdin: process.stdin,
//     stdout: process.stdout,
//   });

//   spinner.start('Pushing generated tags');

//   // Remove lerna package changes. We only want the tags
//   await execa('git', ['reset', '--hard', 'HEAD~1']);

//   const pushArgs = ['push', '--follow-tags', 'origin'];
//   await execa('git', pushArgs);

//   spinner.succeed('Pushed generated tags');
// };

const run = async () => {
  clear();
  // Display intro message banner
  console.log(chalk.blue(figlet.textSync('publish')));
  try {
    await assertGitBranch(ALLOWED_PUBLISH_BRANCHES, spinner);
    await versionPackages();
    await publishToNpm();
    spinner.succeed('Success\n✨');
  } catch (error) {
    displayError(error.message, spinner);
  }
};

run();
