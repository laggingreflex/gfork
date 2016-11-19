const defaults = {};

function add(name, config) {
  defaults[name] = config;
}

add('rmRf', { type: 'boolean', alias: ['rm', 'R'] });
add('nm', { type: 'boolean', alias: ['N'] });
// add('forksDir', { type: 'boolean', alias: ['fd', 'F'] });


export default defaults;
