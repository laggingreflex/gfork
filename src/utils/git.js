import path from 'path';
import { emptydir, readdir } from 'fs-promise';
import { exec } from './child-process';
import { confirm } from './prompt';

export async function clone({ dir, url, cwd }) {
  await exec('git', ['clone', url, dir], { cwd });
}

export async function addRemote({ cwd, name = 'src', url }) {
  console.log(`Adding remote "${name}" => "${url}"`);
  await exec('git', ['remote', 'add', name, url], { cwd });
  await exec('git', ['remote', '-v'], { cwd });
}

export async function setUser({ cwd, name, email }) {
  console.log(`Setting user.name = "${name}"`);
  await exec('git', ['config', 'user.name', name], { cwd });
  console.log(`Setting user.email = "${email}"`);
  await exec('git', ['config', 'user.email', email], { cwd });
}

export async function readDir({ cwd, src }) {
  let remoteOrigin, remoteSrc, branch;
  console.log(`Reading dir "${path.basename(cwd)}"...`);
  const opts = { cwd, capture: true };
  try {
    console.log('Getting origin...');
    remoteOrigin = await exec('git remote get-url --push origin', opts);
    if (!remoteOrigin) { throw new Error(''); }
  } catch (error) {
    error.message = `Couldn't get origin. ${error.message}`;
    throw error;
  }
  try {
    console.log(`Getting {src: ${src}}...`);
    remoteSrc = await exec(`git remote get-url ${src}`, opts);
    if (!remoteSrc) { throw new Error(''); }
  } catch (error) {
    error.message = `Couldn't get {src: ${src}}. ` + error.message;
    throw error;
  }
  try {
    console.log('Getting current branch...');
    branch = await exec('git rev-parse --abbrev-ref HEAD', opts);
    if (!branch) { throw new Error(''); }
  } catch (error) {
    error.message = `Couldn't get current branch. ${error.message}`;
    throw error;
  }
  console.log({ remoteOrigin, remoteSrc, branch });
  return { remoteOrigin, remoteSrc, branch };
}

export async function fetchPr({ owner, repo, src, pr }) {
  console.log(`Fetching http://github.com/${owner}/${repo}/pull/${pr}...`);
  await exec(`git fetch ${src} pull/${pr}/head:#${pr}`);
  await exec(`git checkout #${pr}`);
}
