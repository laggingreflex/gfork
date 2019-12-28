const Configucius = require('configucius/lib/node');
const _ = require('./utils');

module.exports = class Config extends Configucius {
  // static path = { '~': '~/.gfork', '.': '.gfork' };
  static path = ['~/.gfork', '.gfork'];

  async $enquireToken() {
    if (this.token) return;
    return Configucius.prompt.select({
      message: 'Github Token not found. Enter:',
      choices: {
        token: async () => {
          this.token = await Configucius.prompt.input('Enter your token:');
        },
        ['username/password']: async () => {
          this.username = await Configucius.prompt.input('Enter your Github username:', this.username);
          this.password = await Configucius.prompt.password('Enter your Github password:', this.password);
          // return this.github.getToken({ username, password });
        },
      }
    });
  }

  get branch() { return this.get('branch') }
  set branch(v) { this.set('branch', v) }
  get clean() { return this.get('clean') }
  set clean(v) { this.set('clean', v) }
  get command() { return this.get('command') }
  set command(v) { this.set('command', v) }
  get configFile() { return this.get('configFile') }
  set configFile(v) { this.set('configFile', v) }
  get cwdCommand() { return this.get('cwdCommand') }
  set cwdCommand(v) { this.set('cwdCommand', v) }
  get depth() { return this.get('depth') }
  set depth(v) { this.set('depth', v) }
  get directory() { return this.get('directory') }
  set directory(v) { this.set('directory', v) }
  get domain() { return this.get('domain') }
  set domain(v) { this.set('domain', v) }
  get email() { return this.get('email') }
  set email(v) { this.set('email', v) }
  get library() { return this.get('library') }
  set library(v) { this.set('library', v) }
  get link() { return this.get('link') }
  set link(v) { this.set('link', v) }
  get password() { return this.get('password') }
  set password(v) { this.set('password', v) }
  get prompt() { return this.get('prompt') }
  set prompt(v) { this.set('prompt', v) }
  get remote() { return this.get('remote') }
  set remote(v) { this.set('remote', v) }
  get setUser() { return this.get('setUser') }
  set setUser(v) { this.set('setUser', v) }
  get silent() { return this.get('silent') }
  set silent(v) { this.set('silent', v) }
  get token() { return this.get('token') }
  set token(v) { this.set('token', v) }
  get tokenNote() { return this.get('tokenNote') }
  set tokenNote(v) { this.set('tokenNote', v) }
  get urlType() { return this.get('urlType') }
  get username() { return this.get('username') }
  set username(v) { this.set('username', v) }

  set urlType(v) {
    if (!['git', 'https'].includes(v)) throw new _.UserError(`Invalid urlType`);
    this.set('urlType', v);
  }

  // get showPrompts() { return this.get('prompt') }
  // set prompt(v) { this.set('prompt', v) }
}
