import path from 'path';
import _ from 'lodash';
import { cp } from './utils';

export async function clone({ dir, url, cwd, args }) {
  try {
    const argStr = _.map(_.omitBy(args, _.isUndefined), (val, arg) => `--${arg}=${val}`);
    // console.log({ args, argStr });
    // process.exit(1);
    await cp.exec(`git clone ${url} ${dir} ${argStr}`, { cwd });
  } catch (err) {
    if (err.message.match(128)) {
      err.message += `\nIf you're getting "Permission denied (publickey)" error, you probably need set up an SSH key with Github (more info: https://help.github.com/articles/generating-an-ssh-key). Or try setting --url-type=https (or --https) to use 'https://<token>@github.com/...' style git URLs.`;
    }
    throw err;
  }
}

export async function addRemote({ cwd, name = 'src', url }) {
  console.log(`Adding remote "${name}" => "${url}"`);
  await cp.exec(`git remote add ${name} ${url}`, { cwd });
  await cp.exec(`git fetch ${name} master`, { cwd });
  await cp.exec(`git checkout -b src`, { cwd });
  await cp.exec(`git reset --hard src/master`, { cwd });
  await cp.exec(`git branch --set-upstream-to src/master`, { cwd });
  await cp.exec(`git checkout master`, { cwd });
  await cp.exec('git remote -v', { cwd });
}

export async function setUser({ cwd, name, email }) {
  console.log(`Setting user.name = "${name}"`);
  await cp.exec(`git config user.name ${name}`, { cwd });
  console.log(`Setting user.email = "${email}"`);
  await cp.exec(`git config user.email ${email}`, { cwd });
}

export function extractUrlFromGitRemote({ str, name, nameLabel, fetch }) {
  try {
    const match = str.match(`(?:^|[\\n\\r]|[\\\\n\\\\r])${name}[\\s\\t]+(.*) \\(${fetch ? 'fetch' : 'push'}\\)`);
    if (!match) { throw new Error('Match not found'); }
    return match[1];
  } catch (err) {
    err.message = `Couldn't get ${nameLabel || name}: ${err.message}`;
    throw err;
  }
}

export async function readDir({ cwd, src }) {
  let remotes, remoteOrigin, remoteSrc, branch;
  console.log(`Reading dir "${path.basename(cwd)}"...`);
  const opts = { cwd, capture: true };
  try {
    console.log('Getting remotes...');
    remotes = await cp.exec('git remote -v', opts);
    if (!remotes) { throw new Error('Couldn\'t get `git remotes`'); }
    remoteOrigin = extractUrlFromGitRemote({ str: remotes, name: 'origin' });
    remoteSrc = extractUrlFromGitRemote({ str: remotes, name: 'src', nameLabel: `{src:${src}}`, fetch: true });
  } catch (err) {
    err.message = `Couldn't get remotes: ${err.message}`;
    throw err;
  }
  try {
    console.log('Getting current branch...');
    branch = await cp.exec('git rev-parse --abbrev-ref HEAD', opts);
    if (!branch) { throw new Error(''); }
  } catch (error) {
    error.message = `Couldn't get current branch. ${error.message}`;
    throw error;
  }

  // console.log({ remoteOrigin, remoteSrc, branch });
  return { remoteOrigin, remoteSrc, branch };
}

export async function fetchPr({ owner, repo, src, pr }) {
  console.log(`Fetching http://github.com/${owner}/${repo}/pull/${pr}...`);
  await cp.exec(`git fetch ${src} pull/${pr}/head:#${pr}`);
  await cp.exec(`git checkout #${pr}`);
}
