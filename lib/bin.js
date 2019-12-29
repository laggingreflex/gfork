#!/usr/bin/env node

const Gfork = require('.');
const Config = require('./config');
const yargs = require('yargs');
const _ = require('./utils');

main().catch(error => {
  process.exitCode = 1;
  _.logError(error);
});

async function main() {
  let command = 'command not found';
  const { argv } = yargs.scriptName('gfork').options(Config.options).command({
    command: '$0 <library> [directory]',
    description: 'Fork a library',
    handler: () => command = 'gfork',
  }).command({
    command: 'pr [branch=<current>]',
    description: 'Create a pull request on original source using your (current) branch',
    handler: () => command = 'pullRequest',
  }).command({
    command: 'fetch <pull-request>',
    description: `Fetch a PR from source remote. (E.g.: "git fetch src pull/42/head:#42")`,
    handler: () => command = 'fetch',
  }).wrap(null);
  const gfork = new Gfork(argv);
  return gfork[command]();
}
