import fs from 'fs-promise';
import { getCredentials } from './config';
import github from './github';

export async function readTokenFromFile({ file }) {
  console.log(`Getting token from file ${file}...`);
  let token;
  try {
    token = await fs.readFile(file, 'utf8');
  } catch (error) {
    throw new Error(`Couldn't read from file: ${file}`, error.message);
  }
  token = token.trim();
  token = token.replace(/[\r\n]/g, '');
  if (token.length != 40) {
    throw new Error(`Invalid token (must be 40 chars): "${token}"`);
  }
  if (token.match(/[^a-z0-9]/)) {
    throw new Error(`Invalid token (must be /[a-z0-9]*/): "${token}"`);
  }
  return token;
};
export async function saveTokenToFile({ token, file }) {
  try {
    fs.writeFile(file, token);
  } catch (error) {
    throw new Error(`Couldn't save token to file "${file}".`, error.message)
  }
  console.log(`Token saved succesfully to "${file}" for future use`);
};

export async function getTokenFromGitHub({
  username,
  password,
  note = 'gh-forker',
}) {
  if (!username || !password) {
    const input = await getCredentials();
    username = input.username;
    password = input.password;
  }

  github.authenticate({
    type: 'basic',
    username,
    password,
  });

  const { token } = await github.authorization.create({
    scopes: ['user', 'user:email', 'public_repo', 'repo', 'repo:status', 'gist'],
    note
  });

  return token;
};

export async function authenticateWithToken({ token }) {
  console.log(`Authenticating...`);

  github.authenticate({
    type: 'oauth',
    token,
  });

  const {login} = await github.users.get({});
  const [{email}] = await github.users.getEmails({});
  return {user: login, email}
};
