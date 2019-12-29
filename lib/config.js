const Configucius = require('configucius/lib/node');
const _ = require('./utils');

module.exports = class Config extends Configucius {
  static defaultPath = '~/gfork/config.json';
  static path = ['~/gfork/config.json', '.gfork'];

  static options = {
    library: { type: 'string', alias: ['l'], description: `Library/URL to fork` },
    directory: { type: 'string', default: '~/gfork/<repo>', description: `Directory to use for cloning'` },
    clean: { type: 'boolean', description: `Remove everything in target dir before cloning` },
    npmLink: { type: 'boolean', default: '<true if npm-package>', description: `Run 'npm link' in <directory> and 'npm link <repo>' in <cwd> respectively` },
    command: { type: 'string', alias: ['c'], description: `Command to execute after cloning inside the repo dir` },
    cwdCommand: { type: 'string', alias: ['cc'], description: `Command to execute in current-dir (cwd) (after --command exits cleanly)` },
    token: { type: 'string', description: `GitHub token` },
    tokenNote: { type: 'string', default: 'Token for gfork', description: `Note to use when getting token` },
    config: { type: 'array', default: ['~/gfork/config.json', '.gfork'], description: `File(s) to save config and token for future` },
    fork: { type: 'boolean', description: `Create a fork of the repo under your GitHub account` },
    assumeFork: { type: 'boolean', description: `Assume a fork already exists (with the same repo name) (requires username)` },
    username: { type: 'string', description: `GitHub username (to fetch token, and to set for cloned git repo)` },
    password: { type: 'string', promptType: 'password', save: false, description: `GitHub password (to fetch token)` },
    otp: { type: 'string', description: `GitHub 2FA OTP (to fetch token)` },
    email: { type: 'string', description: `Email to set for cloned git repo` },
    skipAuth: { type: 'boolean', description: `Skip GitHub authentication (don't prompt)` },
    setUser: { type: 'boolean', description: `Set username/email in forked git repo from GitHub account` },
    remote: { type: 'string', alias: ['r'], default: 'src', description: `Remote name to use for original library` },
    domain: { type: 'string', alias: ['d'], default: 'github.com', description: `In case you use something like 'acc1.github.com' in your SSH config` },
    http: { type: 'boolean', description: `Use web url (https://) (instead of ssh/git)')` },
    depth: { type: 'number', description: `Create shallow clone of that depth (applied to git command)` },
    // open: { type: 'boolean', default: true, description: `Open forked dir` },
    branch: { type: 'string', alias: ['b'], default: 'master', description: `Local branch to use` },
    pullRequest: { type: 'number', description: `PR to fetch` },
    cwd: { type: 'string', default: '<cwd>', description: `Current working directory` },
    help: { type: 'boolean', alias: ['h'], description: `Show help` },
    silent: { type: 'boolean', alias: ['s'], description: `Don't log unnecessarily` },
    debug: { type: 'boolean', alias: ['s'], description: `Log debug messages` },
    prompt: { type: 'boolean', default: '<isTTY>', description: `Prompt user for missing information` },
    confirm: { type: 'boolean', description: `Confirm decisions (only works if prompt=true)` },
  };

  async $$save(...args) {
    if (!this.$paths.length) return super.$save(...args);
    if (this.prompt) return this.$savePrompt(...args);
    const { $path } = this;
    try {
      this.$path = this.$paths[0];
      console.log('modifying path', { before: $path, after: this.$path });
      return await super.$save(...args);
    } finally {
      this.$path = $path;
      console.log('restoring path', { before: $path, after: this.$path });
    }
  }

  $prompt(key, opts) {
    if (!this.prompt) {
      this.set(key, opts.default || this.get(key));
      return;
    };
    // return super.$prompt(key, { skipIfExists: true, ...opts });
    return super.$prompt(key, opts);
  }

  $promptAuth() {
    const enter = async () => {
      await this.$prompt('token');
      await this.$prompt('username');
      await this.$prompt('password');
      await this.$prompt('otp');
    };
    const skip = () => {
      delete this.token;
      delete this.password;
      delete this.otp;
      this.skipAuth = true;
    };
    return Config.prompt.select({
      message: 'Authenticate to GitHub?',
      choices: {
        ['Enter Credentials']: enter,
        ['Skip']: skip
      },
      onCancel: skip,
    });
  }

  /** @type {string} */
  get library() { return this.get('library') } set library(v) { this.set('library', v) }
  /** @type {string} */
  get directory() { return this.get('directory') } set directory(v) { this.set('directory', v) }
  /** @type {boolean} */
  get clean() { return this.get('clean') } set clean(v) { this.set('clean', v) }
  /** @type {boolean} */
  get npmLink() { return this.get('npmLink') } set npmLink(v) { this.set('npmLink', v) }
  /** @type {array} */
  get command() { return this.get('command') } set command(v) { this.set('command', v) }
  /** @type {array} */
  get cwdCommand() { return this.get('cwdCommand') } set cwdCommand(v) { this.set('cwdCommand', v) }
  /** @type {string} */
  get token() { return this.get('token') } set token(v) { this.set('token', v) }
  /** @type {string} */
  get tokenNote() { return this.get('tokenNote') } set tokenNote(v) { this.set('tokenNote', v) }
  /** @type {array} */
  get config() { return this.get('config') } set config(v) { this.set('config', v) }
  /** @type {boolean} */
  get fork() { return this.get('fork') } set fork(v) { this.set('fork', v) }
  /** @type {boolean} */
  get assumeFork() { return this.get('assumeFork') } set assumeFork(v) { this.set('assumeFork', v) }
  /** @type {string} */
  get username() { return this.get('username') } set username(v) { this.set('username', v) }
  /** @type {string} */
  get password() { return this.get('password') } set password(v) { this.set('password', v) }
  /** @type {string} */
  get otp() { return this.get('otp') } set otp(v) { this.set('otp', v) }
  /** @type {string} */
  get email() { return this.get('email') } set email(v) { this.set('email', v) }
  /** @type {boolean} */
  get skipAuth() { return this.get('skipAuth') } set skipAuth(v) { this.set('skipAuth', v) }
  /** @type {boolean} */
  get setUser() { return this.get('setUser') } set setUser(v) { this.set('setUser', v) }
  /** @type {string} */
  get remote() { return this.get('remote') } set remote(v) { this.set('remote', v) }
  /** @type {string} */
  get domain() { return this.get('domain') } set domain(v) { this.set('domain', v) }
  /** @type {boolean} */
  get http() { return this.get('http') } set http(v) { this.set('http', v) }
  /** @type {number} */
  get depth() { return this.get('depth') } set depth(v) { this.set('depth', v) }
  /** @type {string} */
  get branch() { return this.get('branch') } set branch(v) { this.set('branch', v) }
  /** @type {number} */
  get pullRequest() { return this.get('pullRequest') } set pullRequest(v) { this.set('pullRequest', v) }
  /** @type {string} */
  get cwd() { return this.get('cwd') } set cwd(v) { this.set('cwd', v) }
  /** @type {boolean} */
  get help() { return this.get('help') } set help(v) { this.set('help', v) }
  /** @type {boolean} */
  get silent() { return this.get('silent') } set silent(v) { this.set('silent', v) }
  /** @type {boolean} */
  get debug() { return this.get('debug') } set debug(v) { this.set('debug', v) }
  /** @type {boolean} */
  get prompt() { return this.get('prompt') } set prompt(v) { this.set('prompt', v) }
  /** @type {boolean} */
  get confirm() { return this.get('confirm') } set confirm(v) { this.set('confirm', v) }
}
