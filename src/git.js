import git from 'git-promise';

export async function clone({ url }) {
  console.log(`Cloning ${url}...`);
  await git(`clone ${url}`);
}

export async function addRemote({ cwd, name = 'src', url }) {
  console.log(`Adding remote "${name}" => "${url}"`);
  await git(`remote add ${name} ${url}`, { cwd });
}

export async function setUser({ cwd, name, email }) {
  console.log(`Setting user.name = "${name}"`);
  await git(`config user.name ${name}`, { cwd });
  console.log(`Setting user.email = "${email}"`);
  await git(`config user.email ${email}`, { cwd });
}
