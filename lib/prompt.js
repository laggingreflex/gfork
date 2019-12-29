const enquire = require('enquire-simple');
const _ = require('./utils');

const prompt = exports;

prompt.prompt = enquire.prompt;
prompt.confirm = enquire.confirm;
prompt.select = enquire.select;

prompt.paths = async (paths, { message = 'Save?' } = {}) => {
  paths = _.arrify(paths);
  if (!paths.length) return;
  const no = 'No';
  const choices = [no, ...paths.map(p => p.original)];
  const path = await enquire.select({ message, choices });
  if (path === no) throw new _.UserError('No path chosen');
  return path;
};

prompt.all = async (items, keys = Object.keys(items), { log = console.log } = {}) => {
  log('Enter the needed fields (or leave empty):');
  for (const key of keys) {
    const entered = await enquire(key, items[key]);
    if (entered) {
      items[key] = entered;
    }
  }
  return items;
};

prompt.github = config => prompt.all(config, 'token|username|password|otp'.split('|'));
