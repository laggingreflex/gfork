const Path = require('path');
const _ = require('./utils');
const { spawn, logger } = require('./utils/node');
const SimpleGit = require('simple-git/promise');

module.exports = class Git {
  static logPrefix = '[git]';
  log = logger({ prefix: '[git]' });

  constructor({ cwd = process.cwd() } = {}) {
    this.cwd = cwd;
  }

  cd(cwd) { return new Git({ cwd }) }

  get simple() {
    return SimpleGit(this.cwd).outputHandler((command, stdout, stderr) => {
      this.log('$', command);
      // stdout.on('data', data => this.log('>', data));
      // stderr.on('data', data => this.log('!', data));
      stdout.pipe(process.stdout);
      stderr.pipe(process.stderr);
    });
  }

  branch() { return this.simple.branch({}) }

  spawn(cmd, opts) {
    return spawn.call(this, cmd, { cwd: this.cwd, ...opts });
  }

  async getRemotes() {
    this.log('Getting remotes...');
    const array = await this.simple.getRemotes(true);
    if (!array || !array.length) {
      throw new _.UserError("Couldn't get `git remotes`");
    }
    return array.reduce((remotes, { name, refs }) => {
      if (!name) return;
      if (refs.fetch === refs.push) {
        refs = refs.fetch;
      }
      remotes[name] = refs;
      return remotes;
    }, {});
  }

  async fetchPr({ src, pullRequest, branch = `pull/${pullRequest}`, checkout = true }) {
    await this.spawn(`git fetch ${src} pull/${pullRequest}/head:${branch}`);
    if (checkout) {
      await this.spawn(`git checkout ${branch}`);
    }
  }

  toArgs(options) {
    return Object.keys(options)
      .filter(key => options[key] !== undefined)
      .map(key => `--${key}=${options[key]}`);
  }

  async clone({ url, directory, ...options }) {
    const args = this.toArgs(options);
    await this.spawn(['git', 'clone', url, ...args, directory]);
    this.log('Cloned');
  }

  async setUser({ name, email, ...options }) {
    const args = this.toArgs(options);
    this.log(`Setting repo`, { name, email });
    if (name)
      await this.spawn(['git', 'config', 'user.name', name, ...args]);
    if (email)
      await this.spawn(['git', 'config', 'user.email', email, ...args]);
  }

  async addRemote({ url, remote = 'src', ...options }) {
    const args = this.toArgs(options);
    await this.spawn(['git', 'remote', 'add', remote, url, ...args]);
  }
  async fetchRemote({ remote = 'src', branch = '', ...options } = {}) {
    const args = this.toArgs(options);
    await this.spawn(['git', 'fetch', remote, branch, ...args]);
  }
  async setRemote({ remote = 'src', branch = null } = {}) {
    const { current } = await this.simple.branch({});
    branch = branch || current;
    await this.spawn(`git checkout -b src`);
    try {
      await this.spawn(`git branch --set-upstream-to ${remote}/${branch}`);
      await this.spawn(`git reset --hard ${remote}/${branch}`);
    } finally {
      await this.spawn(`git checkout ${current}`);
    }
  }
  async checkoutLocal({ branch = 'master' }) {
    try {
      await this.spawn(`git checkout ${branch} -f`);
    } catch (error) {
      await this.spawn(`git checkout -b ${branch}`);
    }
    try {
      await this.spawn(`git merge src`);
    } catch (error) {
      console.error(error);
    }
    // await this.spawn('git remote -v');
  }


}
