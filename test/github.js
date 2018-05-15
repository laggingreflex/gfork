const assert = require('assert');
const { url: { getOwnerRepoFromGithubUrl } } = require('../github');

describe('github.getOwnerRepoFromGithubUrl', () => {
  describe('extract {owner, repo} from url', () => {
    it('https://github.com/user/repo', async function () {
      assert.deepEqual(await getOwnerRepoFromGithubUrl(this.test.title), {
        owner: 'user',
        repo: 'repo',
        url: this.test.title
      });
    });
    it('https://github.com/user/hyphenated-repo', async function () {
      assert.deepEqual(await getOwnerRepoFromGithubUrl(this.test.title), {
        owner: 'user',
        repo: 'hyphenated-repo',
        url: this.test.title
      });
    });
    it('https://github.com/user/repo-with-git-in-name', async function () {
      assert.deepEqual(await getOwnerRepoFromGithubUrl(this.test.title), {
        owner: 'user',
        repo: 'repo-with-git-in-name',
        url: this.test.title
      });
    });
    it('https://github.com/user/repo/issues/new', async function () {
      assert.deepEqual(await getOwnerRepoFromGithubUrl(this.test.title), {
        owner: 'user',
        repo: 'repo',
        url: this.test.title
      });
    });
    it('git@github.com:user/repo.git', async function () {
      assert.deepEqual(await getOwnerRepoFromGithubUrl(this.test.title), {
        owner: 'user',
        repo: 'repo',
        url: this.test.title
      });
    });
    it('git@github.com:user/repo-with-git-in-name.git', async function () {
      assert.deepEqual(await getOwnerRepoFromGithubUrl(this.test.title), {
        owner: 'user',
        repo: 'repo-with-git-in-name',
        url: this.test.title
      });
    });
    it('git@github.com:user/repo.js.git', async function () {
      assert.deepEqual(await getOwnerRepoFromGithubUrl(this.test.title), {
        owner: 'user',
        repo: 'repo.js',
        url: this.test.title
      });
    });
  });
});
