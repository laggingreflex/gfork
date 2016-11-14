import github from './github';

export async function getTokenFromGitHub({
  username,
  password,
  tokenNote = 'Token for ghfork',
}) {
  github.authenticate({
    type: 'basic',
    username,
    password,
  });

  const { token } = await github.authorization.create({
    scopes: ['user', 'user:email', 'public_repo', 'repo', 'repo:status', 'gist'],
    note: tokenNote
  });

  return token;
};

export async function authenticateWithToken({ token }) {
  console.log(`Authenticating...`);

  github.authenticate({
    type: 'oauth',
    token,
  });

  const { login } = await github.users.get({});
  const [{ email }] = await github.users.getEmails({});
  return { user: login, email }
};
