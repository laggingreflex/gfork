import GitHubApi from 'github';

const github = new GitHubApi({});

export default github;

export function decodeGitHubUrl({ url }) {
  const regexp = /github.com[\/\:](.*?)\/(.*?)($|.git)/;
  const result = regexp.exec(url);
  if (!result || result.length < 4) {
    throw new Error(`Couldn't extract owner/repo from url "${url}"`)
  }
  const [, owner, repo] = result;
  return { owner, repo };
}


export async function fork({ url, user }) {
  const { owner, repo } = decodeGitHubUrl({ url });

  console.log(`Forking ${owner}/${repo}...`);

  const { full_name } = await github.repos.fork({ user: owner, repo });
  if (full_name !== `${user}/${repo}`) {
    throw new Error(`Couldn't fork`)
  }
}
