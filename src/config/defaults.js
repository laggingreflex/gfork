const defaults = {};

function add(name, config) {
  defaults[name] = config;
}

add('command', { type: 'array', alias: ['c'] });
add('currentDirCommand', { type: 'array', alias: ['cc'] });

add('rmRf', { type: 'boolean', alias: ['rm', 'R'] });
add('nodeModules', { type: 'boolean', alias: ['N'] });

add('check', { type: 'boolean' });

add('pullRequest', { type: 'boolean', alias: ['L'] });
add('fetchPr', { type: 'number', alias: ['H'] });

add('noSavedConfig', { type: 'boolean', alias: ['X'] });

add('https', { type: 'boolean', alias: ['http']});

export default defaults;
