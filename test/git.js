import assert from 'assert';
import * as git from '../src/git';
import { rm } from 'shelljs';
import fs from 'fs-promise';

describe('git.clone', async() => {
  it('should exist', async() => {
    assert(git.clone);
  });
});

describe('git.clone', async() => {
  const repo = 'ghfork';
  const url = 'https://github.com/laggingreflex/ghfork';
  it('should clone', async() => {
    await git.clone({ url })
    const files = await fs.readdir(repo);
    console.log(`files.length: ${files.length}`);
    assert(files.length > 3);
  });
  before(async() => {
    rm('-rf', repo);
  });
  after(async() => {
    rm('-rf', repo);
  });
});


