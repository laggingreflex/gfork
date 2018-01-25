const opn = require('opn');
const github = require('./api');

export async function fork({ owner, repo, user }) {
  const result = await github.repos.fork({ owner, repo });
  const { name } = result;
  if (name !== repo) {
    console.warn(`Warning: Forked repo name different from the original: ${owner}/${repo} !==  ${user}/${name}`);
  }
  return name;
}

export function openPr({ owner, repo, branch }) {
  const url = `https://github.com/${owner}/${repo}/compare/${branch}`;
  console.log(`Navigating to: ${url}`);
  opn(url);
}
