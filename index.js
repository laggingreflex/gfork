#!/usr/bin/env node

try {
  module.exports = require('./lib');
} catch (err) {
  require('babel-register');
  module.exports = require('./src');
}
