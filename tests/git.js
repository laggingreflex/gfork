import assert from 'assert';
import * as git from '../src/git';
import fs from 'fs';
import rimraf from 'rimraf';

describe('git.clone', async() => {
  it('should exist', async() => {
    assert(git.clone);
  });
});

describe.skip('git.clone', async() => {
  const repo = 'gfork';
  const url = 'https://github.com/laggingreflex/gfork';
  it('should clone', async() => {
    await git.clone({ url })
    const files = await fs.readdir(repo);
    console.log(`files.length: ${files.length}`);
    assert(files.length > 3);
  });
  before(async() => {
    try { rimraf(repo); } catch (err) {}
  });
  after(async() => {
    rimraf(repo);
  });
});
