#!/usr/bin/env node

require('source-map-support/register');
const path = require('path');
const fs = require('fs-promise');
const _ = require('lodash');
const config = require('./config');
const git = require('./git');
const github = require('./github');
const { prompt, cp, errors } = require('./utils');

async function login({ silent = false } = {}) {
  if (!config.token) {
    config.username = await prompt.input('Enter your username:', config.username);
    config.password = await prompt.password('Enter your password:');
    config.token = await github.auth.getTokenFromGitHub(config);
  }
  const { user, email } = await github.auth.authenticateWithToken({ token: config.token, silent });
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

const main = exports.main = async () =>  {
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
    const { owner, repo } = await github.url.decodeUrl(remoteSrc);
    github.repo.openPr({ owner, repo, branch });
    return;
  }

  if (config.fetchPr) {
    const { remoteSrc } = await git.readDir({
      cwd: config.root,
      src: config.remote,
    });
    const { owner, repo } = await github.url.decodeUrl(remoteSrc);
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
    if (await prompt.confirm('Login again?', true)) {
      await login();
    } else if (await prompt.confirm('Edit the token-note used to get the token?', true)) {
      await config.editOne('tokenNote');
      await login();
    } else if (await prompt.confirm('Enter token manually?', true)) {
      await config.editOne('token');
      await login();
    } else {
      process.exit(0);
    }
  }

  if (!config.urls.length) {
    if (await prompt.confirm('Fork/Clone an npm package/GitHub URL?', true)) {
      const url = await prompt.input('Please enter the package name/URL to clone:');
      config.urls = [url];
    } else if (!config.editConfig && await prompt.confirm('Edit the config?', true)) {
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
  const { owner, repo, originalRepoName } = await github.url.decodeUrl(input);
  const forkedRepoName = await github.repo.fork({ owner, repo, user: config.username });
  const { forkedUrl, sourceUrl } = await github.url.generateUrl({
    https: config.https,
    token: config.token,
    domain: config.domain,
    user: config.username,
    owner,
    repo,
    forkedRepoName,
  });
  let cwd, gitCloneCwd, repoDir, repoFullDir, rootDirBasename;
  if (config.here) {
    cwd = config.root;
    gitCloneCwd = path.join(cwd, '..');
    repoDir = path.basename(config.root);
    repoFullDir = cwd;
    console.log(`Cloning here: ${repoDir}...`);
  } else if (config.forksDir) {
    cwd = config.forksDir;
    gitCloneCwd = config.forksDir;
    repoDir = originalRepoName || repo;
    repoFullDir = path.join(cwd, repoDir);
    console.log(`Cloning in forksDir: .../${path.basename(cwd)}/${path.basename(repoDir)}...`);
  } else {
    cwd = config.root;
    gitCloneCwd = config.root;
    repoDir = originalRepoName || repo;
    repoFullDir = path.join(cwd, repoDir);
    console.log(`Cloning in: ./${path.basename(repoDir)}...`);
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
      if (await prompt.confirm('Delete everything from it?')) {
        console.log(`Emptying dir: ${repoDir}...`);
        await fs.emptydir(repoFullDir);
      } else if (config.command && await prompt.confirm('Execute forksDir command?')) {
        const forksDirCommand = await prompt.input('Command:', config.command);
        if (config.currentDirCommand && await prompt.confirm('Execute currentDir command?', true)) {
          const currentDirCommand = await prompt.input('Command:', config.currentDirCommand);
          await executeForksDirCommand(forksDirCommand);
          await executeCurrentDirCommand(currentDirCommand);
          return;
        } else {
          await executeForksDirCommand(forksDirCommand);
          return;
        }
      } else if (config.currentDirCommand && await prompt.confirm('Execute currentDir command?', true)) {
        const currentDirCommand = await prompt.input('Command:', config.currentDirCommand);
        await executeCurrentDirCommand(currentDirCommand);
        return;
      } else {
        throw new Error(`Non-empty directory. Please choose an empty dir or use --rm switch to remove all files.\n${repoFullDir}`);
      }
    }
  }

  await clone();
  await executeForksDirCommand(config.command);
  await executeCurrentDirCommand(config.currentDirCommand);

  async function clone() {
    await git.clone({
      url: forkedUrl,
      dir: repoDir,
      cwd: gitCloneCwd,
      args: _.pick(config, ['depth'])
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
  }

  async function executeForksDirCommand(command) {
    if (command) {
      const repoEnv = originalRepoName || repo;
      const commandStr = command.replace(/\$repo|%repo%/g, repoEnv);
      console.log(`Executing command: \`${commandStr}\` in '${path.basename(repoFullDir)}'`);
      await cp.exec(command, {
        cwd: repoFullDir,
        env: { repo: repoEnv },
      });
    }
  }

  async function executeCurrentDirCommand(command) {
    if (command) {
      const repoEnv = originalRepoName || repo;
      const commandStr = command.replace(/\$repo|%repo%/g, repoEnv);
      console.log(`Executing command: \`${commandStr}\` in '${path.basename(config.root)}'`);
      await cp.exec(command, {
        cwd: config.root,
        env: { repo: repoEnv },
      });
    }
  }
}

main().catch(errors.handleErrors);
