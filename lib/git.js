const Path = require('path');
const _ = require('./utils');
const Base = require('./base');
const { spawn } = require('./utils/node');
const SimpleGit = require('simple-git/promise');

module.exports = class Git extends Base {
  static logPrefix = '[git]';

  dirname = Path.basename(this.cwd);
  simple = SimpleGit(this.cwd).outputHandler((command, stdout, stderr) => {
    this.log('$', command);
    stdout.on('data', data => this.log('>', data));
    stderr.on('data', data => this.log('!', data));
    // stdout.pipe(process.stdout);
    // stderr.pipe(process.stderr);
  });
  spawn(...args) {
    return spawn.call(this, ...args);
  }

  async getRemotes() {
    // this.log('Getting remotes...');
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

  async readdir() {
    let remotes, branches;
    this.log(`Reading '${this.dirname}'...`);
    try {
      remotes = await this.getRemotes();
    } catch (error) {
      throw new _.MergeError(`Couldn't get remotes.`, error)
    }
    try {
      branches = await this.simple.branch({});
    } catch (error) {
      throw new _.MergeError(`Couldn't get branches.`, error)
    }
    if (branches.detached || !branches.current) { throw new _.UserError(`Current in detached state`) }
    return { remotes, branches };
  }

  async fetchPr({ src, pullRequest, branch = `pull/${pullRequest}`, checkout = true }) {
    await this.spawn(`git fetch ${src} pull/${pullRequest}/head:${branch}`);
    if (checkout) {
      await this.spawn(`git checkout ${branch}`);
    }
  }

  async clone({ url, directory, ...options }) {
    const args = Object.keys(options)
      .filter(key => options[key] !== undefined)
      .map(key => `--${key}=${options[key]}`);
    await this.spawn(['git', 'clone', url, ...args, directory], {});
    // // await this.simple.clone(url, directory, args);
    // return;
    // const branches = await this.simple.branch({});
    // console.log(`branches.current:`, branches.current);
  }

  async setUser({ name, email, cwd = this.cwd }) {
    this.log(`Setting repo`, { name, email });
    await this.spawn(`git config user.name ${name}`, { cwd });
    await this.spawn(`git config user.email ${email}`, { cwd });
  }

  async addRemote({ url, remote = 'src', cwd = this.cwd }) {
    await this.spawn(`git remote add ${remote} ${url}`, { cwd });
  }
  async fetchRemote({ remote = 'src', branch = 'master', cwd = this.cwd }) {
    await this.spawn(`git fetch ${remote} ${branch}`, { cwd });
  }
  async setRemote({ remote = 'src', branch = 'master', cwd = this.cwd }) {
    await this.spawn(`git checkout -b src`, { cwd });
    await this.spawn(`git branch --set-upstream-to ${remote}/${branch}`, { cwd });
    await this.spawn(`git reset --hard ${remote}/${branch}`, { cwd });
  }
  async checkoutLocal({ branch = 'master', cwd = this.cwd }) {
    try {
      await this.spawn(`git checkout ${branch} -f`, { cwd });
    } catch (error) {
      await this.spawn(`git checkout -b ${branch}`, { cwd });
    }
    try {
      await this.spawn(`git merge src`, { cwd });
    } catch (error) {
      console.error(error);
    }
    // await this.spawn('git remote -v', { cwd });
  }


}
