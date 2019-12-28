module.exports = class Base {

  static silent = false;
  static cwd = process.cwd();

  constructor(opts = {}) {
    this.cwd = opts.cwd || this.constructor.cwd;
    this.silent = 'silent' in opts ? opts.silent : this.constructor.silent;
  }

  log(...msg) {
    if (this.silent) return;
    console.log(...this.constructor.process(...msg));
  }
  warn(...msg) {
    console.warn(...this.constructor.process(...msg));
  }
  error(...msg) {
    console.error(...this.constructor.process(...msg));
  }

  static logPrefix = null;
  static process(...messages) {
    if (this.logPrefix) {
      messages.unshift(this.logPrefix);
    }
    // messages = formatWithOptions({ depth: 10 }, ...messages);
    messages = messages.map(m => {
      if (m instanceof Buffer) {
        return m.toString();
      } else {
        return m;
      }
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

}
