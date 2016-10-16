import './error-handling';
import config from './config';
import * as auth from './auth';
import { decodeGitHubUrl, fork } from './github';
import { clone, addRemote, setUser } from './git';
import { prompt, spawn } from './utils';

async function login() {
  if (!config.token) {
    config.username = prompt(`Enter your username: ${config.username ? `[${config.username}] ` : ''}`, config.username);
    config.password = prompt(`Enter your password: ${config.password ? `[saved password] ` : ''}`, { echo: '*' }, config.password);
    config.token = await auth.getTokenFromGitHub(config);
  }
  const { user, email } = await auth.authenticateWithToken({ token: config.token });
  config.username = user;
  config.email = email;
  console.log(`Welcome, ${user} <${email}>`);
  config.saveToFile(!config.configFileNotExistsFlag);
}

function editConfig() {
  config.edit(config);
  config.saveToFile();
}

async function main() {
  if (!config.token) {
    if (config.configFileNotExistsFlag === true) {
      console.log(`Welcome! Please login to your GitHub account`);
      await login();
    } else {
      console.log(`Couldn't find a valid GitHub token stored on this computer.`);
      if (!prompt(`Login again? [y] `).match(/n/i)) {
        await login();
      } else if (!prompt(`Edit the config? [y] `).match(/n/i)) {
        editConfig();
        process.exit(0);
      } else {
        process.exit(0);
      }
    }
  } else {
    await login();
  }

  let sourceRepoUrl = config.url;
  if (!sourceRepoUrl) {
    if (!prompt(`Clone a GitHub URL? [y] `).match(/n/i)) {
      sourceRepoUrl = config.url = prompt(`Please enter the GitHub URL to clone: `);
    } else if (!prompt(`Edit the config? [y] `).match(/n/i)) {
      editConfig();
      process.exit(0);
    } else {
      process.exit(0);
    }
  }

  const { owner, repo } = decodeGitHubUrl({ url: sourceRepoUrl });
  sourceRepoUrl = `git@github.com:${owner}/${repo}.git`;

  await fork({ url: sourceRepoUrl, user: config.username });
  const forkedUrl = `git@github.com:${config.username}/${repo}.git`;

  await clone({ url: forkedUrl });

  await addRemote({ cwd: repo, name: config.remote, url: sourceRepoUrl });

  await setUser({ cwd: repo, name: config.username, email: config.email });

  if (config.command) {
    console.log('Executing custom commands...');
    const [command, ...args] = config.command.split(/[\s]+/g);
    await spawn(command, args, {
      cwd: repo,
      env: {...process.env, repo },
    });
  }
}

main();
