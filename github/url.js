const _ = require('lodash');
const request = require('client-request/promise');
const resolveRedirect = require('resolve-redirect');
const resolveGitUrl = require('github-url-from-git');

const decodeUrl = exports.decodeUrl = async (input) =>  {
  if (!input) {
    throw new Error('Need a URL/packageName');
  } else if (input.match(/^[a-zA-Z0-9-_.]+$/)) {
    // just a package-name
    const packageName = input;
    const githubUrl = await geGithubUrlFromNpmPackageName(packageName);
    const { owner, repo } = await getOwnerRepoFromGithubUrl(githubUrl);
    if (repo !== input) {
      // package-name provided differs from the one gotten from redirected github project name
      return { owner, repo, originalRepoName: input };
    }
    return { owner, repo };
  } else if (input.match(/^[a-zA-Z0-9-_.]+\/[a-zA-Z0-9-_.]+$/)) {
    // owner/package-name
    const { owner, repo } = await getOwnerRepoFromGithubUrl('https://github.com/' + input);
    return { owner, repo };
  } else if (input.match(/npmjs.com/)) {
    // npm URL
    const packageName = getPackageNameFromNpmUrl(input);
    const githubUrl = await geGithubUrlFromNpmPackageName(input);
    const { owner, repo } = await getOwnerRepoFromGithubUrl(githubUrl);
    return { owner, repo };
  } else {
    // assume github URL
    const { owner, repo } = await getOwnerRepoFromGithubUrl(input);
    return { owner, repo };
  }
}

const generateUrl = exports.generateUrl = async ({ https, token, domain = 'github.com', user, owner, repo, forkedRepoName } = {}) =>  {
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

const getOwnerRepoFromGithubUrl = exports.getOwnerRepoFromGithubUrl = async (url) =>  {
  if (url.match(/^git\+http/)) {
    url = url.substr(4);
  }
  if (url.match(/^http/)) {
    url = await resolveRedirect(url);
  }
  const regexp = /github.com[\/\:](.*?)\/(.*?)(\/|$|\.git)/;
  const result = regexp.exec(url);
  if (!result || result.length < 4) {
    throw new Error(`Couldn't extract owner/repo from url "${url}"`);
  }
  const [, owner, repo] = result;
  return { owner, repo, url };
}

const getPackageNameFromNpmUrl = exports.getPackageNameFromNpmUrl = (url) =>  {
  const regexp = /npmjs.com\/package\/([a-zA-Z0-9-_.]+)($|\/$)/;
  const result = regexp.exec(url);
  if (!result || result.length < 1) {
    throw new Error(`Couldn't get package name from url "${url}"`);
  }
  const [, packageName] = result;
  return packageName;
}

const geGithubUrlFromNpmPackageName = exports.geGithubUrlFromNpmPackageName = async (packageName) =>  {
  let json, url;
  try {
    json = await request({
      uri: 'https://registry.npmjs.org/' + packageName,
      json: true
    });
  } catch (error) {
    throw new Error(`Couldn't retrieve {packageName: ${packageName}} from npmjs registry. ` + error.message);
  }
  url = _.get(json, 'repository.url');
  if (!url) {
    throw new Error(`{packageName: ${packageName}} doesn't seem to have a repository.url`);
  }
  if (url.match(/\.git$/)) {
    url = resolveGitUrl(url);
  }
  return url;
}
