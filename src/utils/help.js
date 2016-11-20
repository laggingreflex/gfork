import packageJson from '../../package.json';

export function printHelp(exit) {
  console.log(`
    ${packageJson.description}

    Usage: gfork [OPTIONS] [NPM library or GitHub project]

      -c, --command       Command to execute after cloning. Inside repo dir with $repo variable name.
      -F, --forks-dir     Directory to put new forks in.
      --root-dir-command  Command to execute in root-dir after --command exits cleanly.
      -R, --rm-rf         Remove everything in target dir before cloning.
      -N, --nm            Shortcut for --forks-dir="./node_modules"
      -t, --token         Specify token manually (otherwise auto-retrieved)
      -n, --token-note    Note to use when getting token (default "Tokek for gfork").
      -f, --config-file   File to save config and token for future (default ~/.gfork)
      -u, --username      Your GitHub username (only 1st time) [optional: prompted if necessary]
      -p, --password      Your GitHub password (only 1st time) [optional: prompted if necessary]
      -r, --remote        Remote name to use for original library (default "src")
      -d, --domain        Use a different domain name than (default "github.com"). In case you use 'acc1.github.com' in your SSH config

    Examples:
      gfork https://github.com/some/library
  `);
  exit && process.exit(1);
}

export function showUsage() {
  console.log(`
    Usage:
      gfork <url>
    Options:
      -u, --url       GitHub URL to fork    [required]
      -t, --token     GitHub auth token
      -u, --username  GitHub username
      -p, --password  GitHub password
  `);
}

export function showErrors(errors) {
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
