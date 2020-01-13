const Config = require('configucius/lib/node');

module.exports = class extends Config {

  static path = ['~/gfork/config.json', '.gfork'];

  $promptAuth() {
    const enter = async () => {
      console.log(`Leave blank if not needed`);
      await this.$prompt('username');
      await this.$prompt('email');
      await this.$prompt('token');
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

  $$save(key) {
    return this.$savePrompt(key);
  }


  /** @type {string} Library/URL to fork */
  library = '';

  /** @type {string} Directory to use for cloning' */
  directory = '~/gfork/<repo>';

  /** @type {boolean} Remove everything in target dir before cloning */
  clean = false;

  /** @type {boolean} Run 'npm link' in <directory> and 'npm link <repo>' in <cwd> respectively */
  npmLink;

  /** @type {string} Command to execute after cloning inside the repo dir */
  command = '';

  /** @type {string} Command to execute in current-dir (cwd) (after --command exits cleanly) */
  cwdCommand = '';

  /** @type {string} GitHub token */
  token = '';

  /** @type {string} Note to use when getting token */
  tokenNote = 'Token for gfork';

  /** @type {array} File(s) to save config and token for future */
  config = ['~/gfork/config.json', '.gfork'];

  /** @type {boolean} Create a fork of the repo under your GitHub account */
  fork;

  /** @type {string} GitHub username (to fetch token, and to set for cloned git repo) */
  username = '';

  /** @type {string} GitHub password (to fetch token) */
  password = '';

  /** @type {string} GitHub 2FA OTP (to fetch token) */
  otp = '';

  /** @type {string} Email to set for cloned git repo */
  email = '';

  /** @type {boolean} Skip GitHub authentication (don't prompt) */
  skipAuth;

  /** @type {boolean} Set username/email in forked git repo from GitHub account */
  setUser;

  /** @type {string} Remote name to use for original library */
  remote = 'src';

  /** @type {string} In case you use something like 'acc1.github.com' in your SSH config */
  domain = 'github.com';

  /** @type {boolean} Use web url (https://) (instead of ssh/git)') */
  http;

  /** @type {number} Create shallow clone of that depth (applied to git command) */
  depth;

  /** @type {boolean} Open forked dir */
  open;

  /** @type {string} Local branch to use */
  branch = 'master';

  /** @type {number} PR to fetch */
  pullRequest;

  /** @type {string} Current working directory */
  cwd = process.cwd();

  /** @type {boolean} Show help */
  help;

  /** @type {boolean} Don't log unnecessarily */
  silent;

  /** @type {boolean} Log debug messages */
  debug;

  /** @type {boolean} Prompt user for missing information */
  prompt;

  /** @type {boolean} Confirm decisions (only works if prompt=true) */
  confirm;
}
