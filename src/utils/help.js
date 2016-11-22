import packageJson from '../../package.json';

export function printHelp(exit) {
  console.log(`
    ${packageJson.description}

    Usage: gfork [OPTIONS] [NPM library or GitHub project] [.]

      -c, --command               Command to execute after cloning. Inside repo dir with $repo variable name.
      -F, --forks-dir             Directory to put new forks in.
      --rdc, --root-dir-command   Command to execute in root-dir after --command exits cleanly.
      -R, --rm-rf                 Remove everything in target dir before cloning.
      -N, --node-modules          Shortcut for --forks-dir="./node_modules".
      --here, .                   Do stuff (clone) in current directory. (alias: .)
      -L, --pull-request          Create a pull request from current branch. (opens default browser) (requires --here)
      -H, --fetch-pr              Fetch a PR from src. (shortcut to: git fetch src pull/42/head:#42) (requires --here)
      -t, --token                 Specify token manually (otherwise auto-retrieved)
      -n, --token-note            Note to use when getting token (default "Tokek for gfork").
      -f, --config-file           File to save config and token for future (default ~/.gfork)
      -u, --username              Your GitHub username (only 1st time) [optional: prompted if necessary]
      -p, --password              Your GitHub password (only 1st time) [optional: prompted if necessary]
      -r, --remote                Remote name to use for original library (default "src")
      -d, --domain                Use a different domain name than (default "github.com"). In case you use 'acc1.github.com' in your SSH config

    Examples:
      gfork express     # clones express in ./express
      gfork . express   # clones express in ./
      gfork -NR express # clones express in ./node_modules/express

      # inside cloned module (./express)
      gfork . -H 24     # pulls http://github.com/expressjs/express/pull/42 as #42 branch
      gfork . -L        # opens http://github.com/expressjs/express/compare/<current-branch>
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
