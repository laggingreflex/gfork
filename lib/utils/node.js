const OS = require('os');
const Path = require('path');
const CP = require('child_process');
const fs = require('fs').promises;
const { formatWithOptions } = require('util')
const { DeferredPromise, logger } = require('.');

const homedir = OS.homedir();
const cwd = process.cwd();

const _ = exports;

_.spawn = function(cmd, opts) {
  let args;
  if (typeof cmd === 'string') {
    [cmd, ...args] = cmd.split(' ');
  } else if (Array.isArray(cmd)) {
    [cmd, ...args] = cmd;
  } else {
    throw new Error('Invalid cmd/args');
  }

  const config = this;
  const log = (...m) => config.log ? config.log(...m) : config.silent ? null : console.log(...m);
  const error = (...m) => config.log ? config.log.error(...m) : console.error(...m);

  if (config.silent !== false) {
    if (opts && opts.cwd && opts.cwd !== cwd) {
      log(`$ (${opts.cwd})`, cmd, ...args);
    } else {
      log(`$`, cmd, ...args);
    }
  }
  // return

  const cp = CP.spawn(cmd, args, {
    shell: true,
    stdio: 'inherit',
    // stdio: ['pipe', 'pipe', 'pipe'],
    ...opts,
  });


  Object.assign(cp, new DeferredPromise());

  const std = { out: [], err: [] };
  const push = (io, data) => {
    data = data.toString();
    data = data.split(/[\n\r]+/g);
    data = data.map(line => line.trim());
    data = data.filter(Boolean);
    for (const line of data) {
      std[io].push(line);
      if (io === 'err') {
        error('!', line)
      } else {
        log('>', line)
      }
    }
  };
  const getOutput = () => ({ output: std.out, error: std.err });

  cp.stdout && cp.stdout.on('data', data => push('out', data));
  cp.stdout && cp.stderr.on('data', data => push('err', data));

  cp.on('exit', code => {
    const { output, error } = getOutput();
    cp.stdout = output;
    cp.stderr = error;
    if (code === 0) cp.resolve(output);
    else {
      cp.reject(error.length ? error[error.length - 1] : `Exited with an error code: ${code}`);
    };
  });

  return cp;
};

_.isEmpty = async dir => {
  try {
    const contents = await fs.readdir(dir);
    // console.log({ dir, contents });
    return !Boolean(contents.length);
  } catch (error) {
    if (error.code === 'ENOENT') return true;
    throw error;
  }
}

_.logger = (opts) => logger({ ...opts, format: (...m) => formatWithOptions({ depth: 10 }, ...m) });

_.adjustPath = (path, { cwd: cwd_ = cwd, homedir: homedir_ = homedir, ...rest } = {}) => {
  if (typeof path !== 'string') throw new TypeError(`Expected a 'string', got '${typeof path}'`);
  path = homedir_ ? path.replace(/^~(?=$|\/|\\)/, homedir_) : path;
  if (cwd_ && !Path.isAbsolute(path)) path = Path.join(cwd_, path);
  for (const key in rest) {
    const replace = rest[key];
    const regex = new RegExp(`<${key}>`, 'ig');
    path = path.replace(regex, replace);
  }
  path = Path.join(path);
  return path;
};
