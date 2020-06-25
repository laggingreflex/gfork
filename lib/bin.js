#!/usr/bin/env node

const Gfork = require('.');
const yargs = require('yargs');
const _ = require('./utils');

main().catch(error => {
  process.exitCode = 1;
  _.logError(error);
});

async function main() {
  let command;

  yargs.scriptName('gfork');
  yargs.wrap(null);

  yargs.option('library', { type: 'string', alias: ['l'], description: `Library/URL to fork` });
  yargs.option('directory', { type: 'string', default: '~/gfork/<repo>', description: `Directory to use for cloning'` });
  yargs.option('clean', { type: 'boolean', description: `Remove everything in target dir before cloning` });
  yargs.option('npmLink', { type: 'boolean', default: '<true if npm-package>', description: `Run 'npm link' in <directory> and 'npm link <repo>' in <cwd> respectively` });
  yargs.option('command', { type: 'string', alias: ['c'], description: `Command to execute after cloning inside the repo dir` });
  yargs.option('cwdCommand', { type: 'string', alias: ['cc'], description: `Command to execute in current-dir (cwd) (after --command exits cleanly)` });
  yargs.option('token', { type: 'string', description: `GitHub token` });
  yargs.option('tokenNote', { type: 'string', default: 'Token for gfork', description: `Note to use when getting token` });
  yargs.option('config', { type: 'array', default: ['~/gfork/config.json', '.gfork'], description: `File(s) to save config and token for future` });
  yargs.option('fork', { type: 'boolean', description: `Create a fork of the repo under your GitHub account` });
  yargs.option('username', { type: 'string', description: `GitHub username (to fetch token, and to set for cloned git repo)` });
  yargs.option('password', { type: 'string', promptType: 'password', save: false, description: `GitHub password (to fetch token)` });
  yargs.option('otp', { type: 'string', description: `GitHub 2FA OTP (to fetch token)` });
  yargs.option('email', { type: 'string', description: `Email to set for cloned git repo` });
  yargs.option('skipAuth', { type: 'boolean', description: `Skip GitHub authentication (don't prompt)` });
  yargs.option('setUser', { type: 'boolean', description: `Set username/email in forked git repo from GitHub account` });
  yargs.option('remote', { type: 'string', alias: ['r'], default: 'src', description: `Remote name to use for original library` });
  yargs.option('domain', { type: 'string', default: 'github.com', description: `In case you use something like 'acc1.github.com' in your SSH config` });
  yargs.option('http', { type: 'boolean', description: `Use web url (https://) (instead of ssh/git)')` });
  yargs.option('depth', { type: 'number', description: `Create shallow clone of that depth (applied to git command)` });
  yargs.option('open', { type: 'boolean', default: true, description: `Open forked dir` });
  yargs.option('branch', { type: 'string', alias: ['b'], default: 'master', description: `Local branch to use` });
  yargs.option('pullRequest', { type: 'number', description: `PR to fetch` });
  yargs.option('cwd', { type: 'string', default: '<cwd>', description: `Current working directory` });
  yargs.option('help', { type: 'boolean', alias: ['h'], description: `Show help` });
  yargs.option('silent', { type: 'boolean', alias: ['s'], description: `Don't log unnecessarily` });
  yargs.option('debug', { type: 'boolean', alias: ['d'], description: `Log debug messages` });
  yargs.option('prompt', { type: 'boolean', default: process.stdout.isTTY, description: `Prompt user for missing information` });
  yargs.option('confirm', { type: 'boolean', description: `Confirm decisions (only works if prompt=true)` });
  // yargs.option('version', { type: 'boolean', alias: ['v'], description: `Show version` });
  // yargs.option('help', { type: 'boolean', description: `Show help` });
  // yargs.version();
  // yargs.help(true);

  // yargs.command('fork <library> [directory]', 'Fork a library', () => command = 'gfork');
  yargs.command({
    command: 'fork <library> [directory]',
    description: 'Fork a library',
    default: true,
    handler: () => command = 'gfork',
  });
  yargs.command({
    command: 'fetch <pull-request>',
    description: 'Fetch a PR from source remote. (E.g.: "git fetch src pull/42/head:#42")',
    handler: () => command = 'fetchPr',
  });
  yargs.command({
    command: 'pr [branch=<current>]',
    description: 'Create a pull request on original source using your (current) branch',
    handler: () => command = 'pullRequest',
  });
  // yargs.command('fetch <pull-request> ', 'Fetch a PR from source remote. (E.g.: "git fetch src pull/42/head:#42")', () => command = 'fetch');
  // yargs.command('pr [branch=<current>]', 'Create a pull request on original source using your (current) branch', () => command = 'pullRequest');

  const argv = yargs.argv;

  for (const key in yargs.parsed.defaulted) {
    delete argv[key];
  }

  if (command) {
    const gfork = new Gfork(argv);
    if (gfork[command]) {
      return gfork[command]();
    } else {
      yargs.showHelp();
      if (command) console.log(`Invalid command: ${command}`);
    }
  } else {
    yargs.showHelp();
  }
}
