#!/usr/bin/env node

const Gfork = require('.');
const Config = require('./config');
const yargs = require('yargs');
const _ = require('./utils');

main().catch(log);

async function main() {
  let command = '';

  const options = {
    default: {
      help: { type: 'boolean', alias: ['h'], description: `Show help` },
    },
    common: {
      silent: { type: 'boolean', alias: ['s'], description: `Don't log unnecessarily` },
      prompt: { type: 'boolean', default: '<isTTY>', description: `Prompt user for missing information` },
    },
    fork: {
      library: { type: 'string', required: true, alias: ['l'], description: `Library/URL to fork` },
      directory: { type: 'string', default: '<repo>', description: `Directory to use for cloning'` },
      clean: { type: 'boolean', description: `Remove everything in target dir before cloning` },
      link: { type: 'boolean', description: `Run 'npm link' in <directory> and 'npm link <repo>' in <cwd> respectively` },
      command: { type: 'array', alias: ['c'], description: `Command to execute after cloning inside the repo dir` },
      cwdCommand: { type: 'array', alias: ['cc'], description: `Command to execute in current-dir (cwd) (after --command exits cleanly)` },
      token: { type: 'string', description: `GitHub token` },
      tokenNote: { type: 'string', default: 'Token for gfork', description: `Note to use when getting token` },
      configFile: { type: 'array', default: ['~/.gfork', '.gfork'], description: `File(s) to save config and token for future` },
      username: { type: 'string', description: `GitHub username (to fetch token, and to set for cloned git repo)` },
      password: { type: 'string', description: `GitHub password (to fetch token)` },
      email: { type: 'string', description: `Email to set for cloned git repo` },
      setUser: { type: 'boolean', description: `Set username/email in forked git repo from GitHub account` },
      remote: { type: 'string', alias: ['r'], default: 'src', description: `Remote name to use for original library` },
      domain: { type: 'string', alias: ['d'], default: 'github.com', description: `In case you use something like 'acc1.github.com' in your SSH config` },
      urlType: { type: 'string', default: 'git', description: `Github URL type to use when cloning. "git" or "https" ('git@github.com/...' or 'https://<token>@github.com/...')` },
      depth: { type: 'number', description: `Create shallow clone of that depth (applied to git command)` },
    },
    pr: {
      branch: { type: 'string', alias: ['b'], default: 'master', description: `Local branch to use` },
    },
    fetchPr: {
      pullRequest: { type: 'number', required: true, alias: ['pr'], description: `PR to fetch` },
      remote: { type: 'string', alias: ['r'], default: 'src', description: `Remote name to use for original library` },
    },
    deprecated: {
      forksDir: { alias: ['F'], description: `[Deprecated. Use --directory=".../<repo>"]` },
      nodeModules: { alias: ['N'], description: `[Deprecated. Use --directory="./node_modules/<repo>"]` },
      http: { description: `[Deprecated. Use --url-type="https"]` },
      rmRf: { alias: ['rm', 'R'], description: `[Deprecated. Use --clean]` },
      currentDirCommand: { type: 'array', description: `[Deprecated. Use --cwdCommand]` },
      noSavedConfig: { type: 'boolean', alias: ['X'], description: `[Deprecated. --config-file=false]` },
    },
    unimplemented: {
      check: { type: 'boolean', description: `Unimplemented` },
    },
  };
  const commands = [{
    command: '$0 <library> [directory]',
    description: 'Fork a library',
    builder: yargs => yargs.options({
      ...options.fork,
      ...options.common,
      ...options.deprecated,
    }),
    handler: () => command = 'fork',
  }, {
    command: 'pr [branch=<current>]',
    description: 'Create a pull request on original source using your (current) branch',
    builder: yargs => yargs.options({
      ...options.pr,
      ...options.common,
      // ...options.deprecated,
    }),
    handler: () => command = 'pullRequest',
  }, {
    command: 'fetch <pr>',
    description: `Fetch a PR from source remote. (E.g.: "git fetch src pull/42/head:#42")`,
    builder: yargs => yargs.options({
      ...options.fetchPr,
      ...options.common,
      // ...options.deprecated,
    }),
    handler: () => command = 'fetchPr',
  }];


  yargs.scriptName('gfork');
  yargs.options({ ...options.default });
  for (const command of commands) {
    yargs.command(command);
  }
  yargs.wrap(null);
  const defaults = {};
  const { argv } = yargs;
  loop_key_in_argv: for (const key in argv) {
    for (const context in options) {
      for (const option in options[context]) {
        if (key === option) {
          if (options[context][key].default === argv[key]) {
            defaults[key] = argv[key];
            delete argv[key];
          }
          continue loop_key_in_argv;
        }
      }
    }
    delete argv[key];
  }
  Config.path = argv.configFile || defaults.configFile;
  const config = new Config();
  config.$load(defaults);
  config.$loadSaved();
  config.$load(argv);

  if (config.prompt === '<isTTY>') {
    config.prompt = process.stdout.isTTY;
  }

  const gfork = new Gfork({ config });

  if (typeof gfork[command] !== 'function') {
    throw new _.UserError(`Invalid command: ${command}`);
  } else {
    await gfork[command]();
  }
}

function log(error) {
  process.exitCode = 1;
  try {
    if (error.constructor.name === 'UserError') console.error(error.message);
    else if (error.name === 'HttpError') try {
      // return log(JSON.parse(error.message));
      error = JSON.parse(error.message);
      console.error(error.message);
      return log(error);
    } catch (x) {
      console.error(error.message);
    }
    else if (error.errors) try {
      for (const e of error.errors) {
        log(e);
      }
    } catch (x) {
      console.error(error.message);
    }
    else console.error(error);
  } catch (x) {
    console.error(error);
  }
}
