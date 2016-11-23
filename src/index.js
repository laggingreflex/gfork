import 'source-map-support/register';
import { join, basename } from 'path';
import fs from 'fs-promise';
import handleErrors from './utils/errors';
import config from './config';
import {
  getTokenFromGitHub,
  authenticateWithToken,
} from './utils/auth';
import * as git from './utils/git';
import * as github from './utils/github';
import { exec } from './utils/child-process';
import {
  confirm,
  input,
  password,
} from './utils/prompt';

async function login({ silent = false } = {}) {
  if (!config.token) {
    config.username = await input('Enter your username:', config.username);
    config.password = await password('Enter your password:');
    config.token = await getTokenFromGitHub(config);
  }
  const { user, email } = await authenticateWithToken({ token: config.token, silent });
  config.username = user;
  config.email = email;
  silent || console.log(`Welcome, ${user} <${email}>`);
  if (config.configFileNotExistsFlag) {
    await config.saveToFile();
  }
}

async function editConfig() {
  await config.edit();
}

export async function main() {
  if (config.editConfig) {
    await config.edit();
    process.exit(0);
  }

  if (config.check) {
    return console.log(await git.readDir({
      cwd: config.root,
      src: config.remote,
    }));
  }

  if (config.pullRequest) {
    const { remoteOrigin, remoteSrc, branch } = await git.readDir({
      cwd: config.root,
      src: config.remote,
    });
    const { owner, repo } = await github.decodeUrl(remoteSrc);
    github.openPr({ owner, repo, branch });
    return;
  }

  if (config.fetchPr) {
    const { remoteSrc } = await git.readDir({
      cwd: config.root,
      src: config.remote,
    });
    const { owner, repo } = await github.decodeUrl(remoteSrc);
    git.fetchPr({ owner, repo, src: config.remote, pr: config.fetchPr });
    return;
  }

  let loginPromise;
  if (config.token) {
    loginPromise = login({ silent: true }).then(() => config.loggedIn = true);
  } else if (config.configFileNotExistsFlag === true) {
    console.log('Welcome! Please login to your GitHub account');
    await login();
  } else {
    console.log('Couldn\'t find a valid GitHub token in the config file.');
    if (await confirm('Login again?', true)) {
      await login();
    } else if (await confirm('Edit the token-note used to get the token?', true)) {
      await config.editOne('tokenNote');
      await login();
    } else if (await confirm('Enter token manually?', true)) {
      await config.editOne('token');
      await login();
    } else {
      process.exit(0);
    }
  }

  if (!config.urls.length) {
    if (await confirm('Fork/Clone an npm package/GitHub URL?', true)) {
      const url = await input('Please enter the package name/URL to clone: ');
      config.urls = [url];
    } else if (!config.editConfig && await confirm('Edit the config?', true)) {
      await editConfig();
      process.exit(0);
    } else {
      process.exit(0);
    }
  }

  await loginPromise;

  return Promise.all(config.urls.map(url => actual(url).catch(err => {
    err.url = url;
    throw err;
  })));
}

async function actual(input) {
  const { owner, repo, originalRepoName } = await github.decodeUrl(input);
  await github.fork({ owner, repo, user: config.username });
  const { forkedUrl, sourceUrl } = await github.generateUrl({
    https: config.https,
    token: config.token,
    domain: config.domain,
    user: config.username,
    owner,
    repo,
  });
  let cwd, gitCloneCwd, repoDir, repoFullDir, rootDirBasename;
  if (config.here) {
    cwd = config.root;
    gitCloneCwd = join(cwd, '..');
    repoDir = basename(config.root);
    repoFullDir = cwd;
    console.log(`Cloning here: ${repoDir}...`);
  } else if (config.forksDir) {
    cwd = config.forksDir;
    gitCloneCwd = config.forksDir;
    repoDir = originalRepoName || repo;
    repoFullDir = join(cwd, repoDir);
    console.log(`Cloning in forksDir: .../${basename(cwd)}/${basename(repoDir)}...`);
  } else {
    cwd = config.root;
    gitCloneCwd = config.root;
    repoDir = originalRepoName || repo;
    repoFullDir = join(cwd, repoDir);
    console.log(`Cloning in: ./${basename(repoDir)}...`);
  }

  await fs.ensureDir(repoFullDir);
  if (config.rmRf) {
    console.log(`Emptying dir: ${repoDir}...`);
    await fs.emptydir(repoFullDir);
  } else {
    let nonEmpty;
    try { nonEmpty = (await fs.readdir(repoFullDir)).length; } catch (noop) {}
    if (nonEmpty) {
      console.warn('Non-empty directory:', repoFullDir);
      if (await confirm('Delete everything from it?')) {
        console.log(`Emptying dir: ${repoDir}...`);
        await fs.emptydir(repoFullDir);
      } else {
        throw new Error(`Non-empty directory. Please choose an empty dir or use --rm switch to remove all files.\n${repoFullDir}`);
      }
    }
  }

  await git.clone({
    url: forkedUrl,
    dir: repoDir,
    cwd: gitCloneCwd,
  });

  await git.addRemote({
    cwd: repoFullDir,
    name: config.remote,
    url: sourceUrl
  });

  await git.setUser({
    cwd: repoFullDir,
    name: config.username,
    email: config.email
  });

  if (config.command) {
    console.log(`Executing command: \`${config.command}\` in '${basename(repoFullDir)}'`);
    await exec(config.command, {
      cwd: repoFullDir,
      env: { repo },
    });
  }
  if (config.rootDirCommand) {
    console.log(`Executing command: \`${config.rootDirCommand}\` in '${basename(config.root)}'`);
    await exec(config.rootDirCommand, {
      cwd: config.root,
      env: { repo },
    });
  }
}

main().catch(handleErrors);
