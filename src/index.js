import 'source-map-support/register';
import fs from 'fs-promise';
import { join, basename } from 'path';
import config from './config';
import {
  getTokenFromGitHub,
  authenticateWithToken,
} from './utils/auth';
import {
  decodeUrl,
  fork
} from './utils/github';
import {
  clone,
  addRemote,
  setUser
} from './utils/git';
import { exec } from './utils/child-process';
import {
  confirm,
  input,
  password,
} from './utils/prompt';

async function login() {
  if (!config.token) {
    config.username = await input('Enter your username:', config.username);
    config.password = await password('Enter your password:');
    config.token = await getTokenFromGitHub(config);
  }
  const { user, email } = await authenticateWithToken({ token: config.token });
  config.username = user;
  config.email = email;
  console.log(`Welcome, ${user} <${email}>`);
  if (config.configFileNotExistsFlag) {
    await config.saveToFile();
  }
}

async function editConfig() {
  await config.edit(config);
}

async function main() {
  if (config.token) {
    await login();
  } else if (config.configFileNotExistsFlag === true) {
    console.log('Welcome! Please login to your GitHub account');
    await login();
  } else {
    console.log(`Couldn't find a valid GitHub token stored on this computer.`);
    if (await confirm('Login again?', true)) {
      await login();
    } else if (await confirm('Edit the config?', true)) {
      await editConfig();
      process.exit(0);
    } else {
      process.exit(0);
    }
  }

  if (!config.url) {
    if (await confirm('Clone a GitHub URL?', true)) {
      config.url = prompt(`Please enter the GitHub URL to clone: `);
    } else if (await confirm('Edit the config?', true)) {
      await editConfig();
      process.exit(0);
    } else {
      process.exit(0);
    }
  }

  if (!config.urls) {
    config.urls = [config.url];
  }

  return Promise.all(config.urls.map((url => {
    return main2(url).catch(error => {
      // console.error(error);
      console.error('ERROR:', error.stdout || error.message);
    });
  })));
}

async function main2(input) {
  const { owner, repo } = await decodeUrl(input);
  await fork({ owner, repo, user: config.username });
  const forkedUrl = `git@github.com:${config.username}/${repo}.git`;
  const sourceUrl = `git@github.com:${owner}/${repo}.git`;

  await fs.ensureDir(config.root);

  await clone({
    url: forkedUrl,
    repo: config.here ? basename(config.root) : repo,
    cwd: config.here ? join(config.root, '..') : config.root,
    rm: config.rm,
  });

  await addRemote({
    cwd: join(config.root, config.here ? '.' : repo),
    name: config.remote,
    url: sourceUrl
  });

  await setUser({
    cwd: join(config.root, config.here ? '.' : repo),
    name: config.username,
    email: config.email
  });

  let command;
  if (config.urls > 1 && config.multiCommand) {
    command = config.multiCommand;
  } else {
    command = config.command;
  }
  if (command) {
    console.log('Executing custom command: `' + command + '`...');
    const [cmd, ...args] = command.split(/[\s]+/g);
    await exec(cmd, args, {
      // cwd: config.here ? config.root : repo,
      cwd: join(config.root, config.here ? '.' : repo),
      env: { repo },
    });
  }
}

main().catch(error => {
  // console.error(error);
  console.error(error.stdout || error.message);
});
