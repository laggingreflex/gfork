const spawn = require('cross-spawn-promise');
// const {spawn} = require('child-process-es6-promise');

const splitCommandStr = exports.splitCommandStr = (commandStr) =>  {
  const [command, ...args] = commandStr.trim().split(/[\s]+/g);
  return [command, args];
}

const exec = exports.exec = async (command, opts = {}) =>  {
  if (opts.capture) {
    opts = {...opts, capture: ['stdout', 'stderr'] };
  } else {
    opts = { stdio: 'inherit', ...opts };
  }
  opts = { encoding: 'utf8', ...opts };
  opts = { shell: true, ...opts };
  if (opts.env) { opts.env = {...process.env, ...opts.env }; }
  let child, promise, result, stdout, stderr;
  try {
    promise = spawn(command, [], opts);
    try {
      child = promise.childProcess || promise.child;
      child.stdout && child.stdout.pipe(process.stdout);
      child.stderr && child.stderr.pipe(process.stderr);
    } catch (error) {}
    stdout = await promise;
    if (stdout && stdout.stdout) {
      stdout = stdout.stdout;
    }
    stdout = fixStdout(stdout);
    // stderr = fixStderr(result.stderr);
    return stdout;
  } catch (err) {
    err.stdout = fixStdout(err.stdout);
    err.stderr = fixStderr(err.stderr);
    err.message = err.stderr + err.message;
    throw err;
  }
}

const fixStdout = exports.fixStdout = (std) =>  {
  if (!std) { return ''; }
  if (typeof std !== 'string') { std = std.toString(); }
  std = std.replace(/(.*)([\r\n]+)$/, '$1');
  return std;
}
const fixStderr = exports.fixStderr = (std) =>  {
  std = fixStdout(std);
  if (!std) { return ''; }
  std = std.replace(/[\.]*$/, '. ');
  return std;
}
