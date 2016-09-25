import assert from 'assert';
import * as github from '../src/github';

describe.only('github.decodeGitHubUrl', async() => {
  it('should extract {owner, repo} from url', async() => {
    const url = 'https://github.com/laggingreflex/ghfork';
    const {owner, repo} = github.decodeGitHubUrl({url});
    assert(owner === 'laggingreflex')
    assert(repo === 'ghfork')
  });
});

