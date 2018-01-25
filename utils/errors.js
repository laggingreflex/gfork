export default function handleErrors(err) {
  // console.error(err.stderr || err.stdout || err.message);
  console.error(err);
}

process.on('unhandledRejection', handleErrors);
process.on('uncaughtException', handleErrors);
