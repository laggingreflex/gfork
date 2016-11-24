import api from './api';

export async function getTokenFromGitHub({
  username,
  password,
  tokenNote = 'Token for gfork',
}) {
  api.authenticate({
    type: 'basic',
    username,
    password,
  });

  const { token } = await api.authorization.create({
    scopes: ['user', 'user:email', 'public_repo', 'repo', 'repo:status', 'gist'],
    note: tokenNote
  });

  return token;
}

export async function authenticateWithToken({ token, silent = false }) {
  silent || console.log('Authenticating...');

  api.authenticate({
    type: 'oauth',
    token,
  });

  const [
    { login },
    [{ email }]
  ] = await Promise.all([
    api.users.get({}),
    api.users.getEmails({})
  ]);

  return { user: login, email };
}
