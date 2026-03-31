const fs = require('node:fs');
const path = require('node:path');

class Logger {
  constructor(options = {}) {
    this.logPath = options.logPath || null;
    this.level = options.level || 'info';
    this.silent = options.silent || false;
  }

  setLogPath(logPath) {
    this.logPath = logPath;
    if (this.logPath) {
      const dir = path.dirname(this.logPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  _format(level, message) {
    return `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`;
  }

  _write(level, message) {
    if (this.silent) return;
    
    const formatted = this._format(level, message);
    
    // Always write to stdout for OpenClaw to see
    process.stdout.write(formatted + '\n');

    if (this.logPath) {
      try {
        fs.appendFileSync(this.logPath, formatted + '\n');
      } catch (err) {
        // Silently fail if file write fails to avoid crashing
      }
    }
  }

  debug(message) {
    if (['debug'].includes(this.level)) {
      this._write('debug', message);
    }
  }

  info(message) {
    if (['debug', 'info'].includes(this.level)) {
      this._write('info', message);
    }
  }

  warn(message) {
    if (['debug', 'info', 'warn'].includes(this.level)) {
      this._write('warn', message);
    }
  }

  error(message, err) {
    const msg = err ? `${message}: ${err.message}\n${err.stack}` : message;
    this._write('error', msg);
  }
}

// Global instance for simple usage
const logger = new Logger();

module.exports = { Logger, logger };
