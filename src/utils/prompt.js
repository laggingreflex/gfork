import { prompt } from 'inquirer';

export async function confirm(message, def) {
  return (await prompt([{
    type: 'confirm',
    name: 'confirm',
    message,
    default: def || false
  }])).confirm;
}

export async function input(message, def) {
  return (await prompt([{
    type: 'input',
    name: 'input',
    default: def,
    message
  }])).input;
}

export async function password(message) {
  return (await prompt([{
    type: 'password',
    name: 'password',
    message
  }])).password;
}
