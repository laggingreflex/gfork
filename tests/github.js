const assert = require('assert');
const { getOwnerRepoFromGithubUrl } = require('../src/github');

describe('github.getOwnerRepoFromGithubUrl', function () {
  describe('extract {owner, repo} from url', function () {
    it('https://github.com/user/repo', function () {
      assert.deepEqual(getOwnerRepoFromGithubUrl(this.test.title), {
        owner: 'user',
        repo: 'repo'
      });
    });
    it('https://github.com/user/hyphenated-repo', function () {
      assert.deepEqual(getOwnerRepoFromGithubUrl(this.test.title), {
        owner: 'user',
        repo: 'hyphenated-repo'
      });
    });
    it('https://github.com/user/repo-with-git-in-name', function () {
      assert.deepEqual(getOwnerRepoFromGithubUrl(this.test.title), {
        owner: 'user',
        repo: 'repo-with-git-in-name'
      });
    });
    it('https://github.com/user/repo/issues/new', function () {
      assert.deepEqual(getOwnerRepoFromGithubUrl(this.test.title), {
        owner: 'user',
        repo: 'repo'
      });
    });
    it('git@github.com:user/repo.git', function () {
      assert.deepEqual(getOwnerRepoFromGithubUrl(this.test.title), {
        owner: 'user',
        repo: 'repo'
      });
    });
    it('git@github.com:user/repo-with-git-in-name.git', function () {
      assert.deepEqual(getOwnerRepoFromGithubUrl(this.test.title), {
        owner: 'user',
        repo: 'repo-with-git-in-name'
      });
    });
    it('git@github.com:user/repo.js.git', function () {
      assert.deepEqual(getOwnerRepoFromGithubUrl(this.test.title), {
        owner: 'user',
        repo: 'repo.js'
      });
    });
  });
});
