const API = require('@octokit/rest');
const request = require('client-request/promise');
const resolveRedirect = require('resolve-redirect');
const resolveGitUrl = require('github-url-from-git');
const _ = require('./utils');
const { logger } = require('./utils/node');

const log = logger({ prefix: '[GitHub]' });

module.exports = class GitHub {
  static log = log;
  log = this.constructor.log;

  // static API = API;
  static api = new API({ log });
  // api = new API({ log: this.log });
  // // token = null;
  // // user = null;
  // // email = null;
  // // silent = false;

  /**
   * @param {object} [opts]
   * @param {string} [opts.token]
   * @param {object} [opts.config]
   */
  constructor(opts = {}) {
    // super(opts);
    // this.config = opts.config || {};
    // if (opts.token) {
    //   this.token = opts.token;
    // }
    this.initApi(opts);
  }

  initApi({ token, username, password, otp } = {}) {
    this.api = new API({
      log: {
        log: this.log.debug,
        info: this.log.debug,
        debug: this.log.debug,
        warn: this.log.warn,
        error: this.log.error,
      },
      ...(token || username ? {
        auth: token || {
          username,
          password,
          on2fa: () => otp,
        }
      } : {})
    });

  }

  async authenticate({ token, tokenNote: note = 'Token for gfork', username, password, otp }) {
    if (this.authenticated) return;
    this.initApi({ token, username, password, otp });
    this.log('Authenticating...');
    const { data: { login } } = await this.api.users.getAuthenticated();
    // const { data: { login } } = { data: { login: 'hi' } };
    this.log('Authenticated');
    this.user = login;
    this.log(`Welcome, ${this.user}`);
    this.authenticated = true;
    if (!token) {
      try {
        this.log('Getting token...', { username, note });
        const result = await this.api.oauthAuthorizations.createAuthorization({
          note,
          scopes: ['user', 'user:email', 'public_repo', 'repo', 'repo:status', 'gist'],
        });
        // const result = { data: { token: 'token' } };
        token = result.data.token;
        this.log('Token created:', token);
      } catch (error) {
        _.logError(error, this.log.error);
        this.log.error(`Couldn't create token. This feature may have been deprecated now. Please create a token manually and use that`);
      }
    }
    return { token };
  }

  async fork({ owner, repo }) {
    // this.log('Forking...');
    const { data: { name } } = await this.api.repos.createFork({ owner, repo });
    if (name !== repo) {
      this.log.warn(`Forked repo name different from the original: ${owner}/${repo} !==  ${this.user}/${name}`);
    }
    this.log(`Forked '${owner}/${repo}' => '${this.user}/${name}'`);
    return name;
  }


  static decodeInput = _.memoize(async function decodeInput(input, {
    http = null,
    token = null,
    domain = 'github.com',
  } = {}) {
    if (!input) throw new Error('Need a URL/packageName');

    let packageName = input;
    if (input.match(/npmjs.com/)) {
      packageName = this.getPackageNameFromNpmUrl(input);
    }

    const githubUrl = await this.geUrlFromNpmPackageName(packageName);
    const { owner, repo } = await this.getOwnerRepoFromUrl(githubUrl);
    const url = await this.generateUrl({ http, token, domain, owner, repo });

    return { owner, repo, url, packageName };
  });

  static decodeUrl = _.memoize(async function(input) {
    if (!input) {
      throw new Error('Need a URL/packageName');
    }
    const isNpmUrl = input.match(/npmjs.com/);
    let packageName = input;
    if (isNpmUrl) packageName = this.getPackageNameFromNpmUrl(input);
    const githubUrl = await this.geUrlFromNpmPackageName(packageName);
    const { owner, repo } = await this.getOwnerRepoFromUrl(githubUrl);
    return { owner, repo };
  });

  static async geUrlFromNpmPackageName(packageName) {
    let json, url;
    try {
      json = await request({
        uri: 'https://registry.npmjs.org/' + packageName,
        json: true
      });
    } catch (error) {
      throw new Error(`Couldn't retrieve {packageName: ${packageName}} from npmjs registry. ` + error.message);
    }
    url = _.try(() => json.body.repository.url);
    // url = _.get(json, 'body.repository.url');
    if (!url) {
      throw new Error(`{packageName: ${packageName}} doesn't seem to have a repository.url`);
    }
    if (url.match(/\.git$/)) {
      url = resolveGitUrl(url);
    }
    return url;
  }

  static async getOwnerRepoFromUrl(url) {
    if (url.match(/^git\+http/)) {
      url = url.substr(4);
    }
    if (url.match(/^http/)) {
      url = await resolveRedirect(url);
    }
    const regexp = /github.com[/:](.*?)\/(.*?)(\/|$|\.git$)/;
    const result = regexp.exec(url);
    if (!result || result.length < 4) {
      throw new Error(`Couldn't extract owner/repo from url "${url}"`);
    }
    const [, owner, repo] = result;
    return { owner, repo, url };
  }

  static getPackageNameFromNpmUrl(url) {
    const regexp = /npmjs.com\/package\/([a-zA-Z0-9-_.]+)($|\/$)/;
    const result = regexp.exec(url);
    if (!result || result.length < 1) {
      throw new Error(`Couldn't get package name from url "${url}"`);
    }
    const [, packageName] = result;
    return packageName;
  }

  static async generateUrl({ http, token, domain = 'github.com', owner, repo }) {
    if (http) {
      if (token) {
        return `https://${token}:x-oauth-basic@${domain}/${owner}/${repo}.git`;
      } else {
        return `https://${domain}/${owner}/${repo}.git`;
      }
    } else {
      return `git@${domain}:${owner}/${repo}.git`;
    }
  }

  static async repoExists({ owner, repo }) {
    try {
      const { data: { name } } = await this.api.repos.get({ owner, repo });
      return name;
    } catch (error) {
      // console.error(error);
      return false;
    }
  }

  static verifyToken(token) {
    if (!token || token.length < 40) {
      throw new Error(`Invalid token: ${token}`);
    }
  }

}
