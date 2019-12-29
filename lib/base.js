module.exports = class Base {

  static silent = false;
  static cwd = process.cwd();
  static logPrefix = '';

  constructor(opts = {}) {
    this.config = opts.config || opts;
    this.cwd = this.config.cwd || this.constructor.cwd;

    this.log = this.log.bind(this);
    this.info = this.log.info = this.info.bind(this);
    this.debug = this.log.debug = this.debug.bind(this);
    this.warn = this.log.warn = this.warn.bind(this);
    this.error = this.log.error = this.warn.bind(this);
  }


  log(...msg) {
    if (this.config.silent) return;
    console.log(...this.constructor.process(...msg));
  }
  info(...msg) {
    if (this.config.silent) return;
    console.log(...this.constructor.process(...msg));
  }
  debug(...msg) {
    if (this.config.silent) return;
    // if (!this.config.debug) return;
    console.debug(...this.constructor.process(...msg));
  }
  warn(...msg) {
    console.warn(...this.constructor.process(...msg));
  }
  error(...msg) {
    console.error(...this.constructor.process(...msg));
  }

  static process(...messages) {
    if (this.logPrefix) {
      messages.unshift(this.logPrefix);
    }
    // messages = formatWithOptions({ depth: 10 }, ...messages);
    messages = messages.map(m => {
      if (m instanceof Buffer) {
        m = m.toString();
      }
      if (typeof m !== 'string') {
        m = formatWithOptions({ depth: 10 }, m);
      }
      if (m.includes('\n')) {
        m = m.replace(/\n/g, '\n' + this.logPrefix + ' ');
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
}
