function catchAll(error) {
  // console.error(error);
  console.error(error.stdout || error.message);
  process.exit(1);
}
process.on('unhandledRejection', catchAll);
process.on('uncaughtException', catchAll);
