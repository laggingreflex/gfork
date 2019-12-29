const lodash = require('lodash');

const _ = exports;

_.constants = {
  start: +new Date,
  minute: 60,
  hour: 3600,
  day: 86400,
};

_.MergeError = class MergedError extends Error {
  constructor(...errors) {
    let error;
    for (let e of errors) {
      if (typeof e === 'string') {
        e = { message: e };
      }
      if (error) {
        error.message = (e && e.message || e) + ' ' + error.message;
        error.stack = (e && e.stack || e) + ' ' + error.stack;
      }
      error = new Error(e.message);
      error.stack = e.stack;
    }
    super(error.message);
    if (error.stack) {
      this.stack = error.stack;
    }
    Object.defineProperty(this, 'errors', { get: () => errors });
  }
};
_.UserError = class UserError extends _.MergeError {};

_.debounce = lodash.debounce;

_.noop = (...args) => {};

_.arrify = array => Array.isArray(array) ? array : array === undefined ? [] : [array];

_.flat = lodash.flattenDeep;
_.flatMap = lodash.flatMapDeep;

_.promise = cb => new Promise(async (resolve, reject) => {
  try {
    resolve(await cb());
  } catch (error) {
    reject(error);
  }
});

_.delay = (timeout = 1000) => new Promise((resolve) => setTimeout(resolve, timeout));
_.race = (promises, timeout = 1000) => Promise.race([..._.arrify(promises), _.delay(timeout)]);

_.try = (fn, onError = _.noop) => {
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.catch(onError)
    } else return result;
  } catch (error) {
    return onError(error);
  }
};

_.tryParse = thing => {
  try {
    return JSON.parse(thing);
  } catch (error) {
    return thing;
  }
}
_.tryAssign = (...args) => {
  try {
    return Object.assign(...args);
  } catch (error) {
    return args.pop();
  }
}
_.stringify = thing => typeof thing === 'string' ? thing : JSON.stringify(thing);

_.copy = thing => JSON.parse(JSON.stringify(thing));

_.Queue = class extends Set {
  run() {
    return Promise.all(Array.from(this).map(task => {
      this.delete(task);
      return _.try(task);
    }));
  }
};

_.patch = (object, method, patch) => {
  const originalMethod = object[method] ? object[method].bind(object) : () => {};
  object[method] = patch.bind(object, originalMethod);
  return object;
};

_.proxy = (object, override) => new Proxy(object, { get: (x, key, receiver) => typeof override === 'function' ? override(x, key, receiver) : override[key] || object[key] });

_.eventualProxy = (object) => new Proxy(object, {
  get: (x, method) => (...args) => object.then(object => object[method](...args))
});

_.now = () => +new Date;

_.from = (start = _.constants.start) => {
  const from = Math.round((_.now() - start) / 1000);
  if (from < _.constants.minute) {
    return from + 's';
  } else if (from < _.constants.hour) {
    return Math.round(from / _.constants.minute) + 'm';
  } else if (from < _.constants.day) {
    return Math.round(from / _.constants.hour) + 'h' + Math.round(from % _.constants.hour) + 'm';
  }
}


_.DeferredPromise = class DeferredPromise {
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
    this.then = (...args) => this.promise.then(...args);
    this.catch = (...args) => this.promise.catch(...args);
    this.finally = (...args) => this.promise.finally(...args);
  }
}

_.logError = function log(error, logger = console.error) {
  try {
    if (error.constructor.name === 'UserError') return logger(error.message);
    else if (error.name === 'HttpError') try {
      // return log(JSON.parse(error.message));
      error = JSON.parse(error.message);
      return logger(error.message);
      return log(error);
    } catch (x) {
      return logger(error.message);
    }
    else if (error.errors) try {
      for (const e of error.errors) {
        log(e);
      }
    } catch (x) {
      return logger(error.message);
    }
    else return logger(error);
  } catch (x) {
    return logger(error);
  }
};

_.logger = ({ prefix = null, silent = false, debug = false, format = i => i } = {}) => {
  const log = (...msg) => {
    if (silent) return;
    console.log(...process(...msg));
  };
  log.log = log;
  log.info = log;
  log.debug = (...msg) => {
    if (silent) return;
    if (!debug) return;
    console.debug(...process(...msg));
  };
  log.warn = (...msg) => {
    console.warn(...process(...msg));
  };
  log.error = (...msg) => {
    console.error(...process(...msg));
  };

  return log;

  function process(...messages) {
    if (prefix) {
      messages.unshift(prefix);
    }
    // messages = formatWithOptions({ depth: 10 }, ...messages);
    messages = messages.map(m => {
      if (m instanceof Buffer) {
        m = m.toString();
      }
      m = format(m);
      if (m.includes('\n')) {
        m = m.replace(/\n/g, '\n' + prefix + ' ');
      }
      return m;
    });
    const first = messages[0];
    const lastIndex = messages.length - 1;
    const last = messages[lastIndex];
    if (typeof first === 'string' && first.startsWith('\n')) {
      messages[0] = first.substr(1);
    }
    if (typeof last === 'string' && last.endsWith('\n')) {
      messages[lastIndex] = last.substring(0, last.length - 1);
    }
    return messages;
  }
};

// _.memoize = fn => fn;
_.memoize = fn => function(key, ...rest) {
  // if (_.memoize.cache[key]) console.log('Returning memoized');
  // else console.log('Memoizing...', { fn, args: [key, ...rest] })
  return _.memoize.cache[key] || (_.memoize.cache[key] = fn.call(this, key, ...rest));
};
_.memoize.cache = {};
