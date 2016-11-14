import 'source-map-support/register';
import fs from 'fs-promise';
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
    config.urls = config.url;
  }

  return Promise.all(config.urls.map((url => {
    return main2(url).catch(error => {
      // console.error(error);
      console.error('ERROR:', error.stdout || error.message);
    });
  })));
}

async function main2(sourceRepoUrl) {
  const { owner, repo } = await decodeUrl(sourceRepoUrl);
  await fork({ owner, repo, user: config.username });
  const forkedUrl = `git@github.com:${config.username}/${repo}.git`;

  await fs.ensureDir(config.root);

  await clone({
    repo,
    url: forkedUrl,
    cwd: config.root,
    here: config.here,
    rm: config.rm,
  });

  await addRemote({
    cwd: config.here ? config.root : repo,
    name: config.remote,
    url: sourceRepoUrl
  });

  await setUser({
    cwd: config.here ? config.root : repo,
    name: config.username,
    email: config.email
  });

  if (config.command) {
    console.log('Executing custom commands...');
    const [command, ...args] = config.command.split(/[\s]+/g);
    await exec(command, args, {
      cwd: config.here ? config.root : repo,
      env: { repo },
    });
  }
}

main().catch(error => {
  // console.error(error);
  console.error(error.stdout || error.message);
});
