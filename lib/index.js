const fs = require('fs-extra');
const open = require('open');
const Config = require('./config');
const GitHub = require('./github');
const Git = require('./git');
const Base = require('./base');
const _ = require('./utils');
const { spawn, isEmpty } = require('./utils/node');

module.exports = class Gfork extends Base {
  /**
   * @param {object} [opts]
   * @param {string} [opts.library] Library to fork/work upon
   * @param {boolean} [opts.clean] Remove everything in target dir before cloning
   * @param {boolean} [opts.link] Run 'npm link' and 'npm link <repo>' in forked and current-dir respectively
   * @param {array} [opts.command] Command to execute after cloning inside the repo dir
   * @param {array} [opts.currentDirCommand] Command to execute in current-dir (cwd) (after --command exits cleanly)
   * @param {boolean} [opts.pullRequest] Create a pull request from current branch. (opens default browser) (requires --here)
   * @param {number} [opts.fetchPr] Fetch a PR from src. (E.g.: "git fetch src pull/42/head:#42") (requires --here)
   * @param {string} [opts.token] Specify GitHub token
   * @param {string} [opts.tokenNote='Token for gfork'] Note to use when getting token
   * @param {array} [opts.configFile=['~/.gfork', '.gfork']] File(s) to save config and token for future
   * @param {string} [opts.username] GitHub username (to fetch token, and to set for cloned git repo)
   * @param {string} [opts.password] GitHub password (to fetch token)
   * @param {string} [opts.email] Email to set for cloned git repo
   * @param {string} [opts.remote='src'] Remote name to use for original library
   * @param {string} [opts.domain='github.com'] In case you use something like 'acc1.github.com' in your SSH config
   * @param {string} [opts.urlType='git'] Github URL type to use when cloning. "git" or "https"
   * @param {number} [opts.depth] Create shallow clone of that depth (applied to git command)
   * @param {boolean} [opts.setUser] Set username/email in forked git repo from GitHub account
   * @param {boolean} [opts.silent] Don't log unnecessarily
   *
   * @param {boolean} [opts.prompts]
   * @param {boolean} [opts.here] [Deprecated - use library] Do stuff directly in current-dir (cwd), like clone etc.. (Equivalent of {library: '.'})
   * @param {boolean} [opts.rmRf] [Deprecated - use clean] Remove everything in target dir before cloning
   * @param {boolean} [opts.http] [Deprecated - use urlType] Shortcut for --url-type=https. Use this if you haven't set up your SSH public key in github: "https://help.github.com/articles/generating-an-ssh-key/"
   * @param {boolean} [opts.noSavedConfig] [Deprecated - use other ways] Don't use any saved config, except token
   * @param {object|Config} [opts.config]
   *
   */
  constructor({ prompts, config, ...configOpts }) {
    // this.prompts = prompts;

    if (!(config instanceof Config)) {
      config = new Config({ config: { ...config, ...configOpts } });
    }

    if (config.rmRf) {
      console.warn('`rmRf` is deprecated, use `clean`');
      config.clean = true;
    }
    if (config.currentDirCommand) {
      console.warn('`currentDirCommand` is deprecated, use `cwdCommand`');
      config.cwdCommand = config.currentDirCommand;
    }
    if (config.noSavedConfig) {
      console.warn('`noSavedConfig` is deprecated, use other ways');
    }
    if (config.here) {
      console.warn('`here` is deprecated, use `clean`');
      if (config.library) throw new _.UserError(`Can't use both {library, here}`);
      config.library = '.';
    }
    super(config);
    this.config = config;
    this.git = new Git(this.config);
  }

  async initGitHub() {
    if (!this.github) {
      this.github = new GitHub;
    }
    if (!this.github.user) {
      if (this.config.token) {
        this.github.token = this.config.token;
      } else if (this.config.username && this.config.password) {
        this.config.token = this.github.token = await this.github.getToken({
          username: this.config.username,
          password: this.config.password,
          note: this.config.tokenNote,
        });
      } else if (this.config.prompt) {
        await this.config.$enquireToken();
        this.$enquiredToken = true;
        return this.initGitHub();
      } else {
        throw new _.UserError('Need a GitHub token or username/password');
      }
      await this.github.authenticate();
      this.log(`Welcome, ${this.github.user} <${this.github.email}>`);
      // await this.config.$savePrompt('token', { message: 'Save token?' });
      if (this.$enquiredToken) {
        this.log(this.config.token);
        await this.config.$savePrompt('token', { message: `Save token?` });
      }
    }
  }

  async fork({
    cwd = this.config.cwd,
    library = this.config.library,
    directory = this.config.directory,
  } = {}) {
    // const branches = await this.git.simple.branch({});
    // console.log(`branches:`, branches);
    // return


    if (!library) throw new _.UserError('Need a library');
    await this.initGitHub();
    this.log(`Forking '${library}'...`);
    const { owner, repo } = await GitHub.decodeUrl(library);
    const forkedRepoName = await this.github.fork({ owner, repo });
    const { forkedUrl, sourceUrl } = await GitHub.generateUrl({
      https: this.config.urlType === 'http',
      token: this.config.token,
      domain: this.config.domain,
      user: this.github.user,
      owner,
      repo,
      forkedRepoName
    });

    let npmRepoName = repo;
    let preferredRepoName = repo;
    if (directory.includes('<repo>')) {
      if (preferredRepoName !== library) {
        if (this.config.keepOriginalRepoName) {
          preferredRepoName = library;
        } else if (this.config.prompt) {
          preferredRepoName = await this.config.$prompt.select({
            message: 'Original repo name is different from the library name specified. Which to keep?',
            choices: [library, preferredRepoName],
          });
        }
      }
      directory = directory.replace('<repo>', preferredRepoName);
    }

    directory = Config.adjustPath(directory);
    const actions = [];

    actions.push(() => fs.ensureDir(directory));

    if (
      this.config.clean || (
        !await isEmpty(directory)
        && this.config.prompt
        && await this.config.$prompt.confirm(`Non-empty directory: '${directory}'. DELETE EVERYTHING?`)
      )
    ) {
      actions.push(async () => {
        console.log(`Emptying dir: '${directory}'...`);
        await fs.emptyDir(directory);
        await _.delay(1000);
      });
    }

    let git;
    actions.push(async () => {
      await this.git.clone({
        url: forkedUrl,
        directory,
        depth: this.config.depth,
      });
      git = new Git({ ...this.config, cwd: directory });
    });

    actions.push(() => {
      try {
        const { name } = require(directory + '/package.json');
        npmRepoName = name;
      } catch (error) {
        this.log(`Couldn't read npm package name`);
      }
    });

    if (this.config.setUser) {
      actions.push(() => git.setUser({ name: this.config.username || this.github.user, email: this.config.email || this.github.email }));
    }

    let currentBranch;

    actions.push(async function setBranch() {
      const branches = await git.simple.branch({});
      currentBranch = branches.current;
    });

    actions.push(() => git.addRemote({ url: sourceUrl, remote: this.config.remote }));
    actions.push(async function fetchRemote() {
      try {
        await git.fetchRemote({ remote: this.config.remote, branch: currentBranch });
      } catch (error) {
        if (!this.config.prompt) throw error;
        console.error(`Couldn't fetch ${this.config.remote}/${currentBranch}`);
        let branch = await this.config.$prompt('Try a different remote branch?', currentBranch);
        if (!branch) throw error;
        currentBranch = branch;
        return fetchRemote.call(this);
      }
    });
    actions.push(() => git.setRemote({ remote: this.config.remote, branch: currentBranch }));
    actions.push(() => git.checkoutLocal({ branch: currentBranch }));

    let command = this.config.command;
    if (command && this.config.prompt) {
      command = await this.config.$prompt(`Execute in '${directory}'?\n`, this.config.command);
    }
    if (command) {
      actions.push(() => spawn(command, { cwd: directory }));
    }

    let cwdCommand = this.config.cwdCommand;
    if (cwdCommand && this.config.prompt) {
      cwdCommand = await this.config.$prompt(`Execute in '${this.config.$cwd}'?\n`, this.config.cwdCommand);
    }
    if (cwdCommand) {
      actions.push(() => spawn(cwdCommand, { cwd: this.config.$cwd, env: { repo: npmRepoName } }));
    }

    if (this.config.link) {
      actions.push(() => spawn('npm link', { cwd: directory }));
      actions.push(() => spawn(`npm link ${npmRepoName}`, { cwd: this.config.$cwd }));
    }

    await run.call(this);

    async function run() {
      for (const action of actions) {
        await action.call(this);
      }
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
