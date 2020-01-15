const Path = require('path');
const fs = require('fs-extra');
const open = require('open');
const Config = require('./config');
const GitHub = require('./github');
const Git = require('./git');
const _ = require('./utils');
const { spawn, isEmpty, adjustPath } = require('./utils/node');

module.exports = class Gfork {
  /**
   * @param {object} [config]
   * @param {string} [config.library] Library/URL to fork
   * @param {string} [config.directory] Directory to use for cloning
   * @param {boolean} [config.clean] Remove everything in target dir before cloning
   * @param {boolean} [config.npmLink] Run 'npm link' in <directory> and 'npm link <repo>' in <cwd> respectively
   * @param {array} [config.command] Command to execute after cloning inside the repo dir
   * @param {array} [config.cwdCommand] Command to execute in current-dir (cwd) (after --command exits cleanly)
   * @param {string} [config.token] GitHub token
   * @param {string} [config.tokenNote] Note to use when getting token
   * @param {array} [config.config] File(s) to save config and token for future
   * @param {boolean} [config.fork] Create a fork of the repo under your GitHub account
   * @param {string} [config.username] GitHub username (to fetch token, and to set for cloned git repo)
   * @param {string} [config.password] GitHub password (to fetch token)
   * @param {string} [config.otp] GitHub 2FA OTP (to fetch token)
   * @param {string} [config.email] Email to set for cloned git repo
   * @param {boolean} [config.skipAuth] Skip GitHub authentication (don't prompt)
   * @param {boolean} [config.setUser] Set username/email in forked git repo from GitHub account
   * @param {string} [config.remote] Remote name to use for original library
   * @param {string} [config.domain] In case you use something like 'acc1.github.com' in your SSH config
   * @param {boolean} [config.http] Use web url (https://) (instead of ssh/git)')
   * @param {number} [config.depth] Create shallow clone of that depth (applied to git command)
   * @param {string} [config.branch] Local branch to use
   * @param {number} [config.pullRequest] PR to fetch
   * @param {string} [config.cwd] Current working directory
   * @param {boolean} [config.help] Show help
   * @param {boolean} [config.silent] Don't log unnecessarily
   * @param {boolean} [config.debug] Log debug messages
   * @param {boolean} [config.prompt] Prompt user for missing information
   * @param {boolean} [config.confirm] Confirm decisions
   */
  constructor(config = {}) {
    if (config.config) {
      Config.path = config.config;
    }
    this.config = new Config();
    this.config.$load();
    this.config.$load(config);
    if (this.config.cwd === '<cwd>') {
      this.config.cwd = process.cwd();
    }
    if (this.config.prompt !== false) {
      this.config.prompt = process.stdout.isTTY;
    }

    this.git = new Git({ cwd: this.config.cwd });
    this.repoGit = new Git({ cwd: this.config.directory });
    this.github = new GitHub();
  }

  log = _.logger();

  async gfork({
    library = this.config.library,
    skipAuth = this.config.skipAuth,
    fork = this.config.fork,
    directory: originalDirectory = this.config.directory,
    http = this.config.http,
    domain = this.config.domain,
    token = this.config.token,
  } = {}) {
    if (!library) throw new _.UserError('Need a library');
    if (skipAuth && fork === false) throw new _.UserError(`Incompatible options: can't skipAuth when forking`);

    const src = await GitHub.decodeInput(library, this.config);
    let { owner, repo, url } = src;
    let directory = adjustPath(originalDirectory, { repo });

    if (this.config.confirm) {
      await this.confirm();
    }

    const forked = await this.fork({ library });
    const cloned = await this.clone({ directory, ...src, ...forked });

    if (cloned && this.config.setUser) {
      await this.setUser({ directory });
    }

    if (cloned && forked) {
      await this.setRemote({ directory, ...src });
    }

    const npmRepoName = await this.getNpmRepoName({ directory });
    if (npmRepoName && npmRepoName !== repo) {
      this.log(`Repo name different from npm name. '${repo}' !== '${npmRepoName}'`);
      repo = npmRepoName;
    }

    if (npmRepoName && this.config.npmLink !== false) {
      await this.npmLink({ directory, repo, cloned });
    }
    await this.runCommands({ directory, repo });
  }

  async authenticate() {
    if (this.authenticated) return;
    if (this.config.skipAuth) return;
    this.log('Authenticating...');
    const ask = async () => {
      await this.config.$promptAuth();
      this.authPrompted = true;
      if (this.config.skipAuth) return;
      else return this.authenticate();
    };

    if (!(this.config.token || (this.config.username && this.config.password))) {
      if (this.config.prompt) {
        this.log.warn('Invalid or missing credentials');
        return ask.call(this);
      } else {
        throw new _.UserError(`Couldn't authenticate (Invalid/missing credentials)`);
      }
    }

    try {
      const authenticated = await this.github.authenticate(this.config);
      // const authenticated = { token: 'aaa' };
      if (authenticated && authenticated.token) {
        this.config.token = authenticated.token;
        if (this.authPrompted) {
          await this.config.$$save('username,email,token'.split(','));
        }
      }
      this.authenticated = true;
      return true;
    } catch (error) {
      if (!this.config.prompt) throw error;
      _.logError(new _.MergeError(`Error authenticating to GitHub with provided credentials`, error));
      return ask.call(this);
    }
  }

  async fork({
    library = this.config.library,
    http = this.config.http,
    domain = this.config.domain,
    token = this.config.token,
    owner = null,
    repo = null,
  } = {}) {
    if (!library && !(owner && repo)) throw new _.UserError('Need a library|owner,repo');
    if (!(owner && repo)) {
      [{ owner, repo }] = [await GitHub.decodeUrl(library)];
    }
    const src = { owner, repo };
    const fork = { owner: this.config.username, repo };
    const existingFork = await GitHub.repoExists(fork);
    if (existingFork) {
      fork.repo = existingFork;
      this.log(`Fork '${fork.owner}/${fork.repo}' already exists`);
    } else if (await this.authenticate()) {
      const repo = await this.github.fork(src);
      fork.repo = repo;
    } else {
      return;
    }
    const url = await GitHub.generateUrl({ http, domain, token, ...fork });
    return { ...fork, url };
  }

  async confirm({
    directory = this.config.directory,
    command = this.config.command,
    cwdCommand = this.config.cwdCommand,
  } = {}) {
    this.log('Confirming settings...')
    if (!await isEmpty(directory) && !this.config.clean) {
      await this.config.$prompt('clean', {
        message: `Non-empty directory: '${directory}'. DELETE EVERYTHING?`,
        skipIfExists: false,
      });
    }
    await this.config.$prompt('command', { skipIfExists: false });
    await this.config.$prompt('cwdCommand', { skipIfExists: false });
  }

  async clone({
    library = this.config.library,
    url = null,
    owner = null,
    repo = null,
    directory = this.config.directory,
    depth = this.config.depth,
    clean = this.config.clean,
    http = this.config.http,
    token = this.config.token,
    domain = this.config.domain,
  } = {}) {
    this.log('Cloning...');
    if (!(url || library || (owner && repo))) {
      throw new Error('Need url|library|owner,repo');
    }
    if (!owner || !repo) {
      [{ owner, repo }] = [await GitHub.decodeUrl(library)];
    }
    if (!await isEmpty(directory) && await this.config.$prompt('clean', {
        message: `Non-empty directory: '${directory}'. DELETE EVERYTHING?`,
        skipIfExists: false,
      })) {
      await fs.emptyDir(directory);
      this.log(`Emptied directory '${directory}'`);
    }
    if (!await isEmpty(directory)) {
      this.log.warn('Skipping cloning due to non-empty directory');
      return;
    }
    if (!url) {
      url = await GitHub.generateUrl({ http, token, domain, owner, repo, });
    }
    if (clean) await fs.emptyDir(directory);

    let timeout;
    if (!depth) timeout = setTimeout(() => this.log('Cloning taking too long? Consider setting --depth=1 to create a shallow clone. \n'), 5000);
    try {
      await this.git.clone({ url, directory, depth });
    } catch (error) {
      throw error;
    } finally {
      if (timeout) clearTimeout(timeout);
    }
    return { owner, repo, url };
  }

  async setUser({
    directory = this.config.directory,
    name = this.config.username || this.github.user,
    email = this.config.email || this.github.email,
  }) {
    await this.git.cd(directory).setUser({ name, email })
  }

  async setRemote({
    directory = this.config.directory,
    url,
    remote = this.config.remote,
    depth = this.config.depth,
    branch = null,
    // branch = this.config.branch,
  }) {
    const git = this.git.cd(directory);
    await git.addRemote({ url, remote });
    if (!branch) {
      [{ current: branch }] = [await git.branch()];
    }
    await git.fetchRemote({ remote, branch, depth });
    await git.setRemote({ remote, branch });
  }

  async getNpmRepoName({ directory }) {
    const packageJsonPath = Path.join(directory, 'package.json');
    if (!await fs.pathExists(packageJsonPath)) return;
    const { name } = require(packageJsonPath);
    return name;
  }

  async checkNpmNameMore({ directory: originalDirectory, repo } = {}) {
    const directory = adjustPath(originalDirectory, { repo });
    const packageJsonPath = Path.join(directory, 'package.json');
    if (!await fs.pathExists(packageJsonPath)) {
      this.log.warn(`Not an npm repo, package.json doesn't exist: '${packageJsonPath}'`);
      return;
    }
    const { name } = require(packageJsonPath);
    if (name === repo) {
      return;
    }
    this.log(`Repo name different from npm name. '${repo}' !== '${name}'`);
    const newDirectory = adjustPath(originalDirectory, { repo: name });

    try {
      await fs.rename(directory, newDirectory);
    } catch (rename) {
      try {
        await fs.move(directory, newDirectory);
      } catch (move) {
        throw new _.MergeError(`Couldn't rename/move '${directory}' to '${newDirectory}'`, rename, move);
      }
    }
    // repo = name;
    // directory = newDirectory;
    this.log(`Renamed '${directory}' -> '${newDirectory}'`);
    return { repo: name, directory: newDirectory };
  }

  async runCommands({
    command = this.config.command,
    directory = this.config.directory,
    cwdCommand = this.config.cwdCommand,
    library = this.config.library,
    repo = null,
  } = {}) {
    let decoded;
    if (!repo) {
      decoded = await GitHub.decodeInput(library, this.config);
    }
    const env = { repo, ...decoded };
    directory = adjustPath(directory, env);
    if (command) {
      this.log('Running command...');
      await spawn(command, { cwd: directory });
    }
    if (cwdCommand) {
      this.log('Running cwd-command...');
      await spawn(cwdCommand, { env });
    }
  }

  async npmLink({ directory, repo, cloned }) {
    this.log('Linking...')
    if (cloned) {
      await spawn('npm link --only=production', { cwd: directory });
    } else {
      this.log.warn(`Skipping \`npm link\` in '${directory}' because cloning was also skipped`);
    }
    const cwdPackageJson = Path.join(this.config.cwd, 'package.json');
    if (await fs.pathExists(cwdPackageJson)) {
      await spawn(`npm link ${repo}`);
    } else {
      this.log.warn(`Skipping \`npm link\` in '${this.config.cwd}' because 'package.json' doesn't exist`);
    }
  }

  async pullRequest() {
    const { remotes, branches } = await this.git.readdir();
    const branch = branches.current;
    const remoteSrc = remotes[this.config.remote];
    if (!remoteSrc) throw new _.UserError(`Remote source (${this.config.remote}) not found`);
    const { owner, repo } = await GitHub.decodeUrl(remoteSrc);
    const url = `https://github.com/${owner}/${repo}/compare/${branch}`;
    this.log(`Navigating to: ${url}`);
    open(url);
  }

  async fetchPr() {
    const { remotes } = await this.git.readdir();
    const remoteSrc = remotes[this.config.remote];
    // const { owner, repo } = await GitHub.decodeUrl(remoteSrc);
    await this.git.fetchPr({ src: remoteSrc, pullRequest: this.config.pullRequest });
  }

};
