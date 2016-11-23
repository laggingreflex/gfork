import Enquirer from 'enquirer';
import Confirm from 'prompt-confirm';
import Password from 'prompt-password';

const enquirer = new Enquirer();

enquirer.register('confirm', Confirm);
enquirer.register('password', Password);

export async function confirm(message, def) {
  return (await enquirer.prompt({
    name: 'confirm',
    type: 'confirm',
    default: def || false,
    message,
  })).confirm;
}

export async function input(message, def) {
  return (await enquirer.prompt({
    name: 'input',
    message,
    default: def,
  })).input;
}

export async function password(message, def) {
  return (await enquirer.prompt({
    name: 'password',
    type: 'password',
    message,
  })).password;
}
