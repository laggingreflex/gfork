const os = require('os');
const path = require('path');
const fs = require('fs-promise');
const yargs = require('yargs');
const _ = require('lodash');
const isEmpty = require('is-empty');
const { input } = require('../utils/prompt');
const { hiddenProp } = require('../utils/object');
const { printHelp } = require('../utils/help');
const defaults = require('./defaults');
const utils = require('./utils');

const { argv } = yargs.options(defaults);

if (argv.h || argv.help) {
  printHelp(true);
}

class Config {
  constructor (args) {
    const config = this;
    hiddenProp(config, 'args');
    hiddenProp(config, 'password');
    hiddenProp(config, 'configFile');
    hiddenProp(config, 'configFileContents');
    hiddenProp(config, 'configFileNotExistsFlag');
    hiddenProp(config, 'urls');
    hiddenProp(config, 'root');
    hiddenProp(config, 'here');
    hiddenProp(config, 'rmRf');
    hiddenProp(config, 'nodeModules');
    hiddenProp(config, 'pullRequest');
    hiddenProp(config, 'fetchPr');
    hiddenProp(config, 'check');
    hiddenProp(config, 'editConfig');
    hiddenProp(config, 'noSavedConfig');
    hiddenProp(config, 'loggedIn');
    hiddenProp(config, 'https');

    config.args = args;

    config.configFile = args.configFile || args.f || path.resolve(os.homedir(), '.gfork');
    if (config.configFile) {
      let configFileContents;
      try {
        configFileContents = fs.readFileSync(config.configFile, 'utf8');
        try {
          configFileContents = JSON.parse(configFileContents);
        } catch (error) {
          throw new Error(`Couldn't parse config file's (${config.configFile}) contents as valid JSON. ` + error.message);
        }
        config.configFileContents = configFileContents;
        Object.assign(config, config.configFileContents);
      } catch (error) {
        config.configFileNotExistsFlag = true;

        // throw new Error(`Couldn't read config file: "${config.configFile}" ` + error.message);
        // console.error(`Couldn't read config file: "${config.configFile}"`);
      }
    }

    config.username = args.username || args.u || config.username;
    config.password = args.password || args.p || config.password;

    config.root = process.cwd();

    config.here = args.here || args._.includes('.');
    if (args._.includes('.')) {
      args._ = args._.filter(a => a !== '.');
    }

    config.noSavedConfig = args.noSavedConfig || args.X;

    config.depth = !_.isUndefined(args.depth) ? args.depth : !config.noSavedConfig && config.depth;

    config.forksDir = args.forksDir || args.forkDir || args.fd || args.F || !config.noSavedConfig && config.forksDir;
    if (config.forksDir === true) {
      throw new Error('forksDir path must be a string.');
    }
    if (config.here) {
      delete config.forksDir;
    }
    if (args.nodeModules || args.N) {
      config.forksDir = 'node_modules';
    }
    if (config.forksDir && config.forksDir.charAt(0) === '~') {
      config.forksDir = path.join(os.homedir(), config.forksDir.substr(1));
    }

    config.rmRf = args.rmRf || args.rmrf || args.rm || args.R;

    config.urls = args._;

    if (config.urls.length > 1 && config.here) {
      throw new Error('Can\'t clone multiple repos in the same dir.');
    }
    if (config.urls.length < 1 && config.here) {
      config.urls = [path.basename(config.root)];
    }

    config.token = args.token || args.t || config.token;
    config.tokenNote = args.tokenNote || args.n || !config.noSavedConfig && config.tokenNote || 'Token for gfork';

    config.remote = args.remote || args.r || !config.noSavedConfig && config.remote || 'src';
    config.domain = args.domain || args.d || !config.noSavedConfig && config.domain || 'github.com';
    config.https = args.https;
    config.urlType = args.urlType || !config.noSavedConfig && config.urlType;
    if (config.urlType) {
      if (config.urlType.match(/^https?$/)) {
        config.https = true;
      } else if (config.https) {
        throw new Error(`{urlType: ${config.urlType}} incompatible with {https: ${config.https}}`);
      } else {
        config.https = false;
      }
    }

    config.command = utils.processCommand(args.command || args.cmd || args.c || !config.noSavedConfig && config.command);
    config.currentDirCommand = utils.processCommand(args.currentDirCommand || args.rdc || !config.noSavedConfig && config.currentDirCommand);

    config.confirmCommands = utils.processCommand(args.confirmCommands || !config.noSavedConfig && config.confirmCommands);
    config.confirmCommand = utils.processCommand(args.confirmCommand || config.confirmCommands || !config.noSavedConfig && config.confirmCommand);
    config.confirmCurrentDirCommand = utils.processCommand(args.confirmCurrentDirCommand || config.confirmCommand || config.confirmCommands || !config.noSavedConfig && config.confirmCurrentDirCommand);

    config.pullRequest = args.pullRequest || args.L;
    config.fetchPr = args.fetchPr || args.H;
    if (config.pullRequest && !config.here) {
      throw new Error('pull-request can only be invoked from repo-dir and requires --here flag (or .)');
    }
    if (config.fetchPr && !config.here) {
      throw new Error('fetch-pr can only be invoked from repo-dir and requires --here flag (or .)');
    }

    config.check = args.check;

    config.editConfig = args.editConfig || args.e;
  }

  async saveToFile (silent) {
    const config = this;
    const args = config.args;

    for (const key in config) {
      if (config.propertyIsEnumerable(key) && !(config[key] && config[key].length)) {
        delete config[key];
      }
    }

    try {
      await fs.outputFile(config.configFile, JSON.stringify(config, null, 2));
    } catch (error) {
      throw new Error(`Couldn't save to file "${config.configFile}". ` + error.message);
    }
    silent || console.log(`Config saved successfully to file "${config.configFile}"`);
    return config;
  }

  async editOne (setting, message) {
    const config = this;
    const prev = config[setting];
    message = message || _.capitalize(_.startCase(setting)) + ':';
    const new1 = await input(message, config[setting]);
    config[setting] = new1;
    if (new1 === prev) {
      return false;
    } else if (!new1 || !new1.length) {
      return false;
    } else {
      return false;
    }
  }

  async edit () {
    const config = this;

    if (config.editConfig) {
      const passedArgs = Object.keys(config.args).filter(arg => {
        return !isEmpty(config.args[arg]) && Object.keys(config).includes(arg);
      });
      if (passedArgs.length) {
        for (const arg of passedArgs) {
          await config.editOne(arg); // eslint-disable-line
        }
        await config.saveToFile();
        return;
      }
    }

    if (!config.token && !await this.editOne('tokenNote')) {
      await this.editOne('token');
    }
    if (config.forksDir) {
      await this.editOne('forksDir', 'Directory to put new forks in:');
      await this.editOne('command', 'Command to run in forksDir after cloning:');
    } else {
      await this.editOne('command', 'Command to run after cloning:');
      await this.editOne('forksDir', 'Directory to put new forks in:');
    }
    if (config.command) {
      if (config.forksDir) {
        await this.editOne('currentDirCommand', 'Command to run in current dir after forksDir command:');
      } else {
        await this.editOne('currentDirCommand', 'Command to run in current dir:');
      }
    }

    // await this.editOne('tokenNote', 'Token note:');
    await this.editOne('remote', 'Name for original remote:');
    await this.editOne('domain', 'Domain name:');
    await this.editOne('urlType', 'Github URL type:');

    // await this.editOne('username', 'Your username:');

    await config.saveToFile();
    return config;
  }
}

module.exports = new Config(argv);
