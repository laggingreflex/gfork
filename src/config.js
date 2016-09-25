import { homedir } from 'os';
import { resolve } from 'path';
import yargs from 'yargs';
import prompt from 'prompt-promise';

const config = yargs.options({
  url: {
    alias: ['u', 'library', 'l'],
    type: 'string'
  },
  token: {
    alias: ['t'],
    type: 'string'
  },
  'token-file': {
    alias: ['f', 'tf'],
    type: 'string',
    default: resolve(homedir(), '.gh-token'),
  },
  'username': {
    alias: ['u'],
    type: 'string'
  },
  'password': {
    alias: ['p'],
    type: 'string'
  },
  'token-note': {
    alias: ['n', 'tn'],
    type: 'string'
  },
  'remote': {
    alias: ['r'],
    type: 'string',
    default: 'src'
  },
  'domain': {
    // Todo: Implement this
    alias: ['d'],
    type: 'string',
    default: 'github.com'
  },
}).argv;

if (!config.url && config._[0])
  config.url = config._[0];

export default config;

export async function getCredentials() {
  if (!config.username || !config.password) {
    console.log('First time? Please login');
  }
  if (!config.username) {
    config.username = await prompt('Enter your GitHub username: ');
  }
  if (!config.password) {
    config.password = await prompt.password('Enter your password: ');
  }
  return config;
}

