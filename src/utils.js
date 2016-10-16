import Prompt from 'prompt-sync';
import { spawn as _spawn } from 'child-process-promise';


export function hiddenProp(object, property, getter, setter) {
  const hidden = {};
  getter = getter || function() { return hidden[property] };
  setter = setter || function(val) { hidden[property] = val };
  return Object.defineProperty(object, property, {
    configurable: true,
    enumerable: false,
    get: getter,
    set: setter,
  });
}

export const prompt = Prompt({ sigint: true });

const getOpts = (opts = {}) => ({
  stdio: 'inherit',
  shell: true,
  ...opts,
});

export function spawn(command, args = [], opts = {}) {
  return _spawn(command, args, getOpts(opts));
}
