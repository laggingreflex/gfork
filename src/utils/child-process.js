import spawn from 'cross-spawn-promise';

export function splitCommandStr(commandStr) {
  const [command, ...args] = commandStr.trim().split(/[\s]+/g);
  return [command, args];
}

export async function exec(command, args, opts = {}) {
  if (arguments[0] instanceof Array) {
    opts = arguments[1] || {};
    [command, ...args] = arguments[0];
  } else if (arguments[1] && !(arguments[1] instanceof Array)) {
    opts = arguments[1] || {};
    [command, args] = splitCommandStr(arguments[0]);
  } else if (!arguments[1]) {
    [command, args] = splitCommandStr(arguments[0]);
    opts = {};
  }
  if (opts.capture) {
    opts = {...opts, capture: ['stdout', 'stderr'] };
  } else {
    opts = { stdio: 'inherit', ...opts };
  }
  opts = { encoding: 'utf8', ...opts };
  opts = { shell: true, ...opts };
  if (opts.env) { opts.env = {...process.env, ...opts.env }; }
  args = args.filter(Boolean);
  let cp, promise, result, stdout, stderr;
  try {
    promise = spawn(command, args, opts);
    try {
      cp = promise.childProcess;
      cp.stdout && cp.stdout.pipe(process.stdout);
      cp.stderr && cp.stderr.pipe(process.stderr);
    } catch (error) {}
    stdout = await promise;
    stdout = fixStdout(stdout);
    return stdout;
  } catch (err) {
    err.stdout = fixStdout(err.stdout);
    err.stderr = fixStderr(err.stderr);
    err.message = err.stderr + err.message;
    throw err;
  }
}

export function fixStdout(std) {
  if (!std) { return ''; }
  if (typeof std !== 'string') { std = std.toString(); }
  std = std.replace(/(.*)([\r\n]+)$/, '$1');
  return std;
}
export function fixStderr(std) {
  std = fixStdout(std);
  if (!std) { return ''; }
  std = std.replace(/[\.]*$/, '. ');
  return std;
}
