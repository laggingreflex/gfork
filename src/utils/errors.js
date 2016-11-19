export default function handleErrors(err) {
  console.error(err);
  // console.error(err.stdout || err.message);
}

process.on('unhandledRejection', handleErrors);
process.on('uncaughtException', handleErrors);
