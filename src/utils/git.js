import { exec } from './child-process';

export async function clone( { url } ) {
  await exec( 'git', [ 'clone', url ] );
}

export async function addRemote( { cwd, name = 'src', url } ) {
  console.log( `Adding remote "${name}" => "${url}"` );
  await exec( 'git', [ 'remote', 'add', name, url ], { cwd } );
  await exec( 'git', [ 'remote', '-v' ], { cwd } );
}

export async function setUser( { cwd, name, email } ) {
  console.log( `Setting user.name = "${name}"` );
  await exec( 'git', [ 'config', 'user.name', name ], { cwd } );
  console.log( `Setting user.email = "${email}"` );
  await exec( 'git', [ 'config', 'user.email', email ], { cwd } );
}
