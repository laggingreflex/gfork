import assert from 'assert';
import * as github from '../src/github';

describe('github.decodeGitHubUrl', function ()  {
  describe('extract {owner, repo} from url', function ()  {
    it('https://github.com/user/repo', function ()  {
      assert.deepEqual(github.decodeGitHubUrl({ url: this.test.title }),{
        owner: 'user',
        repo: 'repo'
      });
    });
    it('https://github.com/user/hyphenated-repo', function ()  {
      assert.deepEqual(github.decodeGitHubUrl({ url: this.test.title }),{
        owner: 'user',
        repo: 'hyphenated-repo'
      });
    });
    it('https://github.com/user/repo-with-git-in-name', function ()  {
      assert.deepEqual(github.decodeGitHubUrl({ url: this.test.title }),{
        owner: 'user',
        repo: 'repo-with-git-in-name'
      });
    });
    it('https://github.com/user/repo/issues/new', function ()  {
      assert.deepEqual(github.decodeGitHubUrl({ url: this.test.title }),{
        owner: 'user',
        repo: 'repo'
      });
    });
    it('git@github.com:user/repo.git', function ()  {
      assert.deepEqual(github.decodeGitHubUrl({ url: this.test.title }),{
        owner: 'user',
        repo: 'repo'
      });
    });
    it('git@github.com:user/repo-with-git-in-name.git', function ()  {
      assert.deepEqual(github.decodeGitHubUrl({ url: this.test.title }),{
        owner: 'user',
        repo: 'repo-with-git-in-name'
      });
    });
    it('git@github.com:user/repo.js.git', function ()  {
      assert.deepEqual(github.decodeGitHubUrl({ url: this.test.title }),{
        owner: 'user',
        repo: 'repo.js'
      });
    });
  });
});

