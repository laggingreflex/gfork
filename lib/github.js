const Api = require('@octokit/rest');
const request = require('client-request/promise');
const resolveRedirect = require('resolve-redirect');
const resolveGitUrl = require('github-url-from-git');
const Base = require('./base');
const _ = require('./utils');

module.exports = class GitHub extends Base {
  static logPrefix = '[GitHub]';

  api = new Api({});
  token = null;
  user = null;
  email = null;
  silent = false;

  /**
   * @param {object} [opts]
   * @param {string} [opts.token]
   */
  constructor(opts = {}) {
    super(opts);
    this.token = opts.token;
  }

  async apiCall(cb) {
    try {
      await cb(this.api)
    } catch (error) {

    }
  }

  async getToken({
    username,
    password,
    note = 'Token for gfork v1da3',
    scopes = ['user', 'user:email', 'public_repo', 'repo', 'repo:status', 'gist'],
  }) {
    this.log('Getting token...', { username });
    try {
      await this.api.authenticate({
        type: 'basic',
        username,
        password,
      });
      const { data: { token } } = await this.api.authorization.create({ scopes, note });
      this.token = token;
      return token;
    } catch (error) {
      throw new _.MergeError(`Couldn't authenticate using the given credentials`, { username, note, scopes }, error);
    }
  }

  async authenticate() {
    this.log('Authenticating...');
    if (!this.token) throw new Error('Need a token');
    const { token } = this;
    const type = 'oauth';
    try {
      await this.api.authenticate({ type, token });
      const [
        { data: { login } },
        { data: [{ email }] }
      ] = await Promise.all([
        this.api.users.get({}),
        this.api.users.getEmails({})
      ]);
      this.user = login;
      this.email = email;
    } catch (error) {
      throw new _.MergeError(`Couldn't authenticate using the given token`, { token, type }, error);
    }
  }

  async fork({ owner, repo }) {
    const { data: { name } } = await this.api.repos.fork({ owner, repo });
    if (name !== repo) {
      this.log(`Warning: Forked repo name different from the original: ${owner}/${repo} !==  ${this.user}/${name}`);
    }
    return name;
  }

  static async decodeUrl(input) {
    if (!input) {
      throw new Error('Need a URL/packageName');
    } else if (
      input.match(/^[a-z0-9-_.]+$/i)
      || input.match(/^\@[a-z0-9-_.]+\/[a-z0-9-_.]+$/i)
    ) {
      // npm package
      const packageName = input;
      const githubUrl = await this.geUrlFromNpmPackageName(packageName);
      const { owner, repo } = await this.getOwnerRepoFromUrl(githubUrl);
      if (repo !== input) {
        // package-name provided differs from the one gotten from redirected github project name
        return { owner, repo };
      }
      return { owner, repo };
    } else if (input.match(/^[a-z0-9-_.]+\/[a-z0-9-_.]+$/i)) {
      // Github owner/package-name
      const { owner, repo } = await this.getOwnerRepoFromUrl('https://github.com/' + input);
      return { owner, repo };
    } else if (input.match(/npmjs.com/)) {
      // npm URL
      const packageName = this.getPackageNameFromNpmUrl(input);
      const githubUrl = await this.geUrlFromNpmPackageName(input);
      const { owner, repo } = await this.getOwnerRepoFromUrl(githubUrl);
      return { owner, repo };
    } else {
      // assume github URL
      const { owner, repo } = await this.getOwnerRepoFromUrl(input);
      return { owner, repo };
    }
  }

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

  static async generateUrl({ https, token, domain = 'github.com', user, owner, repo, forkedRepoName }) {
    let forkedUrl, sourceUrl;
    const fRepo = forkedRepoName || repo;
    if (https) {
      if (!token) { throw new Error('Need a token for https URL'); }
      sourceUrl = `https://${token}:x-oauth-basic@github.com/${owner}/${repo}.git`;
      forkedUrl = `https://${token}:x-oauth-basic@github.com/${user}/${fRepo}.git`;
    } else {
      sourceUrl = `git@${domain}:${owner}/${repo}.git`;
      forkedUrl = `git@${domain}:${user}/${fRepo}.git`;
    }
    return { forkedUrl, sourceUrl };
  }

  // static verifyToken(token = this.token) {
  //   // return
  //   if (!token || token.length < 40) {
  //     throw new Error(`Invalid token: ${token}`);
  //   }
  // }

}
