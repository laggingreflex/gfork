const defaults = {};

function add(name, config) {
  defaults[name] = config;
}

add('rm', { type: 'boolean' });


export default defaults;
