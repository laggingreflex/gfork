import opn from 'opn';
import github from './api';

export async function fork({ owner, repo, user }) {
  const result = await github.repos.fork({ user: owner, repo });
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
