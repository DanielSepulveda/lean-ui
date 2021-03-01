#!/usr/bin/env node

const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const ora = require('ora');
const execa = require('execa');
const globToRegExp = require('glob-to-regexp');
const lernaConfig = require('../../lerna.json');

const spinner = ora();

const ALLOWED_RELEASE_BRANCHES = ['release/*'];

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

  const commitArgs = ['commit', '-m', lernaConfig.version.message];
  await execa('git', commitArgs);

  spinner.succeed();
};

const run = async () => {
  clear();
  // Display intro message banner
  console.log(chalk.blue(figlet.textSync('release')));
  try {
    await assertGitBranch();
    const tag = await versionPackages();
    console.log(tag);
  } catch (error) {
    displayError(error.message);
  }
};

run();

// const program = new Command();
// program.version('0.0.1');
// program.description(
//   'Tag, generate changelog, and publish new versions for vita-ui components'
// );

// program
//   .description("An example CLI for ordering pizza's")
//   .option('-p, --peppers', 'Add peppers')
//   .option('-P, --pineapple', 'Add pineapple')
//   .option('-b, --bbq', 'Add bbq sauce')
//   .option('-c, --cheese <type>', 'Add the specified type of cheese [marble]')
//   .option('-C, --no-cheese', 'You do not want any cheese')
//   .parse(process.argv);

// console.log('you ordered a pizza with:');

// console.log(program.opts());

// if (program.peppers) console.log('  - peppers');
// if (program.pineapple) console.log('  - pineapple');
// if (program.bbq) console.log('  - bbq');
// const cheese = true === program.cheese ? 'marble' : program.cheese || 'no';
// console.log('  - %s cheese', cheese);

// program
//   .version('0.1.0')
//   .arguments('<username> [password]')
//   .description('test command', {
//     username: 'user to login',
//     password: 'password for user, if required',
//   })
//   .action((username, password) => {
//     console.log('username:', username);
//     console.log('environment:', password || 'no password given');
//   });

// program.parse();
