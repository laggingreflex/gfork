import os from 'os';
import path from 'path';
import fs from 'fs-promise';
import yargs from 'yargs';
import { input } from './utils/prompt';
import { hiddenProp } from './utils/object';
import { printHelp } from './utils/help';

const { argv } = yargs;

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

    config.username = config.username || args.username || args.u;
    config.password = config.password || args.password || args.p;

    config.url = args.url || args.library || args.u || args.l || args._[0];

    config.token = config.token || args.token || args.t;
    config.tokenNote = config.tokenNote || args.tokenNote || args.n || 'Token for ghfork';

    config.remote = config.remote || args.remote || args.r || 'src';
    config.domain = config.domain || args.domain || args.d || 'github.com';

    config.command = config.command || args.command || args.c;
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

export default new Config(yargs.argv);
