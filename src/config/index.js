import os from 'os';
import path from 'path';
import fs from 'fs-promise';
import yargs from 'yargs';
import { input } from '../utils/prompt';
import { hiddenProp } from '../utils/object';
import { printHelp } from '../utils/help';
import defaults from './defaults';

const { argv } = yargs.options(defaults);

if (argv.h || argv.help) {
  printHelp(true);
}

class Config {
  constructor(args) {
    const config = this;
    hiddenProp(config, 'args');
    hiddenProp(config, 'password');
    hiddenProp(config, 'configFile');
    hiddenProp(config, 'configFileContents');
    hiddenProp(config, 'configFileNotExistsFlag');
    hiddenProp(config, 'url');
    hiddenProp(config, 'urls');
    hiddenProp(config, 'root');
    hiddenProp(config, 'here');
    hiddenProp(config, 'rm');

    config.args = args;

    config.configFile = args.configFile || args.f || path.resolve(os.homedir(), '.ghfork');
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

    config.root = args.root || args.cwd || process.cwd();
    if (args.nm) {
      config.root = 'node_modules';
    }

    config.here = args.here || args._[args._.length - 1] === '.';
    if (args._.includes('.')) {
      args._ = args._.filter(a => a !== '.');
    }

    config.rm = args.rm;

    config.url = args.url || args.library || args.u || args.l || args._;
    if (config.url instanceof Array) {
      config.urls = config.url;
      config.url = config.urls[0];
    } else {
      config.urls = [config.url];
    }

    if (config.urls.length > 1 && config.here) {
      throw new Error(`Can't clone multiple repos in the same dir.`);
    }
    if (config.urls.length < 1 && config.here) {
      config.url = path.basename(config.root);
      config.urls = [config.url];
    }

    config.token = args.token || args.t || config.token;
    config.tokenNote = args.tokenNote || args.n || config.tokenNote || 'Token for ghfork';

    config.remote = args.remote || args.r || config.remote || 'src';
    config.domain = args.domain || args.d || config.domain || 'github.com';

    config.command = args.command || args.c || config.command;
    config.multiCommand = args.multiCommand || args.command || args.c || config.multiCommand;
  }

  async saveToFile(silent) {
    const config = this;
    const args = config.args;

    if (!config.command || !config.command.length) { delete config.command; }

    // silent || console.log(`Saving config to file "${config.configFile}" for future use...`);
    try {
      await fs.writeFile(config.configFile, JSON.stringify(config, null, 2));
    } catch (error) {
      throw new Error(`Couldn't save to file "${config.configFile}". ` + error.message);
    }
    silent || console.log(`Config saved succesfully to file "${config.configFile}"`);
    return config;
  }

  async edit() {
    const config = this;
    config.tokenNote = await input('Token note:', config.tokenNote);
    config.remote = await input('Name for original remote:', config.remote);
    config.domain = await input('Domain name:', config.domain);
    config.username = await input('Enter your username:', config.username);
    config.command = await input('Command to run after cloning:', config.command);
    config.saveToFile();
    return config;
  }
}

export default new Config(argv);
