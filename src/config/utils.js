export function processCommand(command) {
  if (command instanceof Array) {
    command = command.join(' ');
  }
  return command;
}
