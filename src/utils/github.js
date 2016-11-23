import _ from 'lodash';
import GitHubApi from 'github';
import opn from 'opn';
import request from 'client-request/promise';
import resolveRedirect from 'resolve-redirect';
import resolveGitUrl from 'github-url-from-git';

const github = new GitHubApi({});

export default github;

export async function decodeUrl(input) {
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

export async function generateUrl({ https, token, domain = 'github.com', user, owner, repo } = {}) {
  let forkedUrl, sourceUrl;
  if (https) {
    if (!token) { throw new Error('Need a token for https URL'); }
    forkedUrl = `https://${token}:x-oauth-basic@github.com/${user}/${repo}.git`;
    sourceUrl = `https://${token}:x-oauth-basic@github.com/${owner}/${repo}.git`;
  } else {
    forkedUrl = `git@${domain}:${user}/${repo}.git`;
    sourceUrl = `git@${domain}:${owner}/${repo}.git`;
  }
  return { forkedUrl, sourceUrl };
}

export async function getOwnerRepoFromGithubUrl(url) {
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

export function getPackageNameFromNpmUrl(url) {
  const regexp = /npmjs.com\/package\/([a-zA-Z0-9-_.]+)($|\/$)/;
  const result = regexp.exec(url);
  if (!result || result.length < 1) {
    throw new Error(`Couldn't get package name from url "${url}"`);
  }
  const [, packageName] = result;
  return packageName;
}

export async function geGithubUrlFromNpmPackageName(packageName) {
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
  if (url.includes('git')) {
    url = resolveGitUrl(url);
  }
  return url;
}

export async function fork({ owner, repo, user, attempt = 1, err }) {
  if (attempt <= 1) {
    console.log(`Forking ${owner}/${repo}...`);
  } else if (attempt <= 3) {
    console.error(repo, err.message);
    console.log(`Forking ${owner}/${repo}... (attempt: ${attempt})`);
  } else {
    throw err;
  }
  try {
    const { full_name } = await github.repos.fork({ user: owner, repo });
    if (full_name !== `${user}/${repo}`) {
      throw new Error('Couldn\'t fork');
    }
  } catch (err) {
    return fork({ owner, repo, user, attempt: attempt + 1, err });
  }

}

export async function openPr({ owner, repo, branch }) {
  const url = `https://github.com/${owner}/${repo}/compare/${branch}`;
  console.log(`Navigating to: ${url}`);
  opn(url);
}
