const assert = require('assert');
const { url: { decodeUrl } } = require('../github');

describe('github.getOwnerRepoFromGithubUrl', () => {
  describe('extract {owner, repo} from url', () => {
    it('https://github.com/user/repo', async function () {
      assert.deepEqual(await decodeUrl(this.test.title), {
        owner: 'user',
        repo: 'repo'
      });
    });
    it('https://github.com/user/hyphenated-repo', async function () {
      assert.deepEqual(await decodeUrl(this.test.title), {
        owner: 'user',
        repo: 'hyphenated-repo'
      });
    });
    it('https://github.com/user/repo-with-git-in-name', async function () {
      assert.deepEqual(await decodeUrl(this.test.title), {
        owner: 'user',
        repo: 'repo-with-git-in-name'
      });
    });
    it('https://github.com/user/repo-with-.dot-in-name', async function () {
      assert.deepEqual(await decodeUrl(this.test.title), {
        owner: 'user',
        repo: 'repo-with-.dot-in-name'
      });
    });
    it('https://github.com/user/repo.with.dots', async function () {
      assert.deepEqual(await decodeUrl(this.test.title), {
        owner: 'user',
        repo: 'repo.with.dots'
      });
    });
    it('user/repo.with.dots', async function () {
      assert.deepEqual(await decodeUrl(this.test.title), {
        owner: 'user',
        repo: 'repo.with.dots'
      });
    });
    it('user/hyphenated-with-.dots-in-name', async function () {
      assert.deepEqual(await decodeUrl(this.test.title), {
        owner: 'user',
        repo: 'hyphenated-with-.dots-in-name'
      });
    });
    it.only('user/hyperspy.github.com', async function () {
      assert.deepEqual(await decodeUrl(this.test.title), {
        owner: 'user',
        repo: 'hyperspy.github.com'
      });
    });
    it('https://github.com/user/repo/issues/new', async function () {
      assert.deepEqual(await decodeUrl(this.test.title), {
        owner: 'user',
        repo: 'repo'
      });
    });
    it('git@github.com:user/repo.git', async function () {
      assert.deepEqual(await decodeUrl(this.test.title), {
        owner: 'user',
        repo: 'repo'
      });
    });
    it('git@github.com:user/repo-with-git-in-name.git', async function () {
      assert.deepEqual(await decodeUrl(this.test.title), {
        owner: 'user',
        repo: 'repo-with-git-in-name'
      });
    });
    it('git@github.com:user/repo.js.git', async function () {
      assert.deepEqual(await decodeUrl(this.test.title), {
        owner: 'user',
        repo: 'repo.js'
      });
    });
  });
});
