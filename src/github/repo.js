import opn from 'opn';
import github from './api';

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
