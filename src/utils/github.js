import GitHubApi from 'github';
import request from 'client-request';

const github = new GitHubApi({});

export default github;

export async function decodeUrl(input) {
  if (!input) {
    throw new Error(`Need a URL/packageName`);
  } else if (input.match(/^[a-zA-Z0-9-_.]+$/)) {
    // just a package-name
    const packageName = input;
    const githubUrl = await geGithubUrlFromNpmPackageName(packageName);
    return getOwnerRepoFromGithubUrl(githubUrl);
  } else if (input.match(/^[a-zA-Z0-9-_.]+\/[a-zA-Z0-9-_.]+$/)) {
    // owner/package-name
    return getOwnerRepoFromGithubUrl('https://github.com/' + input);
  } else if (input.match(/npmjs.com/)) {
    // npm URL
    const packageName = getPackageNameFromNpmUrl(input);
    const githubUrl = await geGithubUrlFromNpmPackageName(input);
    return getOwnerRepoFromGithubUrl(githubUrl);
  } else {
    // assume github URL
    return getOwnerRepoFromGithubUrl(input);
  }
}

export function getOwnerRepoFromGithubUrl(url) {
  const regexp = /github.com[\/\:](.*?)\/(.*?)(\/|$|\.git)/;
  const result = regexp.exec(url);
  if (!result || result.length < 4) {
    throw new Error(`Couldn't extract owner/repo from url "${url}"`)
  }
  const [, owner, repo] = result;
  return { owner, repo, url };
}

export function getPackageNameFromNpmUrl(url) {
  const regexp = /npmjs.com\/package\/([a-zA-Z0-9-_.]+)($|\/$)/;
  const result = regexp.exec(url);
  if (!result || result.length < 1) {
    throw new Error(`Couldn't get package name from url "${url}"`)
  }
  const [, packageName] = result;
  return packageName;
}

export function geGithubUrlFromNpmPackageName(packageName) {
  return new Promise((k, e) => request({ uri: 'https://registry.npmjs.org/' + packageName, json: true }, function(err, response, body) {
    if (err) e(err);
    else if (body && body.repository && body.repository.url) k(body.repository.url);
    else e(new Error(`${packageName} doesn't exist`));
  }));
}


export async function fork({ owner, repo, user }) {
  console.log(`Forking ${owner}/${repo}...`);
  const { full_name } = await github.repos.fork({ user: owner, repo });
  if (full_name !== `${user}/${repo}`) {
    throw new Error(`Couldn't fork`)
  }
}
