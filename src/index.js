import 'source-map-support/register';
import config from './config';
import {
  getTokenFromGitHub,
  authenticateWithToken,
} from './utils/auth';
import {
  decodeGitHubUrl,
  fork
} from './utils/github';
import {
  clone,
  addRemote,
  setUser
} from './utils/git';
import { exec } from './utils/child-process';
import {
  confirm,
  input,
  password,
} from './utils/prompt';

async function login() {
  if ( !config.token ) {
    config.username = await input( 'Enter your username:', config.username );
    config.password = await password( 'Enter your password:' );
    config.token = await getTokenFromGitHub( config );
  }
  const { user, email } = await authenticateWithToken( { token: config.token } );
  config.username = user;
  config.email = email;
  console.log( `Welcome, ${user} <${email}>` );
  if (config.configFileNotExistsFlag) {
    await config.saveToFile();
  }
}

async function editConfig() {
  await config.edit( config );
}

async function main() {
  if ( config.token ) {
    await login();
  } else if ( config.configFileNotExistsFlag === true ) {
    console.log( 'Welcome! Please login to your GitHub account' );
    await login();
  } else {
    console.log( `Couldn't find a valid GitHub token stored on this computer.` );
    if ( await confirm( 'Login again?', true ) ) {
      await login();
    } else if ( await confirm( 'Edit the config?', true ) ) {
      await editConfig();
      process.exit( 0 );
    } else {
      process.exit( 0 );
    }
  }


  let sourceRepoUrl = config.url;
  if ( !sourceRepoUrl ) {
    if ( await confirm( 'Clone a GitHub URL?', true ) ) {
      sourceRepoUrl = config.url = prompt( `Please enter the GitHub URL to clone: ` );
    } else if ( await confirm( 'Edit the config?', true ) ) {
      await editConfig();
      process.exit( 0 );
    } else {
      process.exit( 0 );
    }
  }

  const { owner, repo } = decodeGitHubUrl( { url: sourceRepoUrl } );
  sourceRepoUrl = `git@github.com:${owner}/${repo}.git`;

  await fork( { url: sourceRepoUrl, user: config.username } );
  const forkedUrl = `git@github.com:${config.username}/${repo}.git`;

  await clone( { url: forkedUrl } );

  await addRemote( { cwd: repo, name: config.remote, url: sourceRepoUrl } );

  await setUser( { cwd: repo, name: config.username, email: config.email } );

  if ( config.command ) {
    console.log( 'Executing custom commands...' );
    const [ command, ...args ] = config.command.split( /[\s]+/g );
    await exec( command, args, { cwd: repo, env: { repo }, } );
  }
}

main().catch( error => {
  // console.error(error);
  console.error( error.stdout || error.message );
} );
