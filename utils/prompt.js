const Enquirer = require('enquirer');
const Confirm = require('prompt-confirm');
const Password = require('prompt-password');

const enquirer = new Enquirer();

enquirer.register('confirm', Confirm);
enquirer.register('password', Password);

const confirm = exports.confirm = async (message, def) =>  {
  return (await enquirer.prompt({
    name: 'confirm',
    type: 'confirm',
    default: def || false,
    message,
  })).confirm;
}

const input = exports.input = async (message, def) =>  {
  return (await enquirer.prompt({
    name: 'input',
    message,
    default: def,
  })).input;
}

const password = exports.password = async (message, def) =>  {
  return (await enquirer.prompt({
    name: 'password',
    type: 'password',
    message,
  })).password;
}
