import config from './config';
import * as getConfig from './config';
import prompt from 'prompt-promise';
import * as auth from './auth';
import { decodeGitHubUrl, fork } from './github';
import { clone, addRemote, setUser } from './git';

(async function main() {
  let token = config.token;
  if (!token) {
    try {
      token = await auth.readTokenFromFile({ file: config.tokenFile });
    } catch (err) {
      token = await auth.getTokenFromGitHub({
        username: config.username,
        password: config.password,
        note: config.tokenNote,
      });
      await auth.saveTokenToFile({ token, file: config.tokenFile });
    }
  }
  const { user, email } = await auth.authenticateWithToken({ token });
  console.log(`Welcome, ${user} <${email}>`);

  let sourceRepoUrl = config.url;
  if (!sourceRepoUrl) {
    sourceRepoUrl = await prompt('Enter GitHub URL of the library: ');
  }

  const { owner, repo } = decodeGitHubUrl({ url: sourceRepoUrl });
  sourceRepoUrl = `git@github.com:${owner}/${repo}.git`;

  await fork({ url: sourceRepoUrl, user });
  const forkedUrl = `git@github.com:${user}/${repo}.git`;

  await clone({ url: forkedUrl });

  await addRemote({ cwd: repo, name: config.remote, url: sourceRepoUrl });

  await setUser({ cwd: repo, name: user, email });

  console.log(`done`);
  process.exit(0)
})();


function catchAll(error) {
  console.error(error.stdout || error.message);
  process.exit(1);
}
process.on('unhandledRejection', catchAll);
process.on('uncaughtException', catchAll);
