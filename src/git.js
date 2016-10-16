import { spawn } from './utils';

export async function clone({ url }) {
  await spawn('git', ['clone', url]);
}

export async function addRemote({ cwd, name = 'src', url }) {
  console.log(`Adding remote "${name}" => "${url}"`);
  await spawn('git', ['remote', 'add', name, url], { cwd });
  await spawn('git', ['remote', '-v'], { cwd });
}

export async function setUser({ cwd, name, email }) {
  console.log(`Setting user.name = "${name}"`);
  await spawn('git', ['config', 'user.name', name], { cwd });
  console.log(`Setting user.email = "${email}"`);
  await spawn('git', ['config', 'user.email', email], { cwd });
}
