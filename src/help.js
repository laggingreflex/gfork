
exports.showUsage = () => {
  console.log(`
    Usage:
      ghfork <url>
    Options:
      -u, --url       GitHub URL to fork    [required]
      -t, --token     GitHub auth token
      -u, --username  GitHub username
      -p, --password  GitHub password
  `);
}

exports.showErrors = (errors) => {
  if (errors instanceof Array) {
    console.error(`
      Errors:
        ${errors.join('\n      ')}
    `);
  } else {
    console.error(`
      Error: ${error}
    `);
  }
  process.exit(1);
}
