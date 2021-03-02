#!/usr/bin/env node

require('dotenv').config();
const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const ora = require('ora');
const execa = require('execa');
const globToRegExp = require('glob-to-regexp');
const util = require('util');
const fs = require('fs');
const temp = require('temp').track();
const resolve = require('path').resolve;
const { Changelog } = require('lerna-changelog');
const { fromPath } = require('lerna-changelog/lib/configuration');
const lernaConfig = require('../../lerna.json');

const spinner = ora();

const ALLOWED_RELEASE_BRANCHES = ['release/*'];
const INSERTION_SLUG = '<!-- insert-new-changelog-here -->';

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

const versionPackages = async () => {
  const lernaArgs = [
    'lerna',
    'version',
    '--conventional-commits', // version packaged by conventional commits
    '--no-changelog', // don`t generate changelog
    '--no-push', // don`t push changes
    '--no-git-tag-version', // don`t commit changes and don`t tag the commit
    '--yes', // answer yes to all
  ];

  spinner.start('Commits since current version:');

  const describeArgs = ['describe', '--abbrev=0', '--tags'];
  // Get last release tag
  const prevTag = (await execa('git', describeArgs)).stdout.toString();

  const logArgs = [
    '--no-pager',
    'log',
    `${prevTag}..HEAD`,
    '--no-decorate',
    '--oneline',
  ];
  spinner.info();
  // Print commits since last release tag
  await execa('git', logArgs, { stdout: process.stdout });
  // Lerna version packages
  await execa('yarn', lernaArgs, {
    stdin: process.stdin,
    stdout: process.stdout,
  });

  spinner.start('Commit version changes');

  await execa('git', ['add', '.']);
  const commitArgs = ['commit', '-m', lernaConfig.command.version.message];
  await execa('git', commitArgs);

  spinner.succeed();
};

const generateChangelog = async () => {
  // let retVal;

  spinner.start('Generating changelog');

  const write = util.promisify(fs.write);
  const open = util.promisify(temp.open);
  const { path, fd } = await open({ prefix: 'CHANGELOG', suffix: '.md' });

  const rootPath = await execa('git', ['rev-parse', '--show-toplevel']);
  const changelogConfig = fromPath(rootPath.stdout);
  const markdown = await new Changelog(changelogConfig).createMarkdown();

  await write(fd, markdown);

  const readFile = util.promisify(fs.readFile);
  const changelogPath = resolve(__dirname, '..', '..', 'CHANGELOG.md');
  const data = await readFile(changelogPath, 'utf8');

  if (data.includes(INSERTION_SLUG)) {
    const retVal = await readFile(path, 'utf8');

    const writeFile = util.promisify(fs.writeFile);
    const changes = data.replace(
      INSERTION_SLUG,
      `${INSERTION_SLUG}\n${retVal}`
    );

    await writeFile(changelogPath, changes);
    await execa('git', [
      'commit',
      '-m',
      `chore(changelog): generate changelog`,
      '--no-verify',
      '--quiet',
      changelogPath,
    ]);

    spinner.succeed();
  } else {
    throw new Error(`Missing "${INSERTION_SLUG}" in CHANGELOG.md`);
  }
};

const run = async () => {
  clear();
  // Display intro message banner
  console.log(chalk.blue(figlet.textSync('release')));
  try {
    await assertGitBranch();
    await versionPackages();
    await generateChangelog();
    spinner.succeed(
      'Success\n✨ Push this branch and create a new pull request.'
    );
  } catch (error) {
    displayError(error.message);
  }
};

run();
