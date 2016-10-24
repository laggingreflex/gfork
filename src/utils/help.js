import packageJson from '../../package.json';

export function printHelp( exit ) {
  console.log( `
    ${packageJson.description}

    Usage: ghfork [OPTIONS] [<url>]
      -u, --url         GitHub project URL to fork/clone [prompted if not provided]
      -t, --token       Specify token manually (otherwise auto-retrived)
      -f, --config-file File to save config and token for future (default ~/.ghfork)
      -u, --username    Your GitHub username (only 1st time) [optional: prompted if necessary]
      -p, --password    Your GitHub password (only 1st time) [optional: prompted if necessary]
      -n, --token-note  Note to use when getting token (default "gh-token"). If you're gettig error "already exists", try changing this.
      -r, --remote      Remote name to use for original library (default "src")
      -d, --domain      Use a different domain name than (default "github.com"). In case you use 'acc1.github.com' in your SSH config
      -c, --command     Command to execute after cloning. Inside repo dir with $repo variable name.

    Examples:
      ghfork https://github.com/some/library
  ` );
  exit && process.exit( 1 );
}

export function showUsage() {
  console.log( `
    Usage:
      ghfork <url>
    Options:
      -u, --url       GitHub URL to fork    [required]
      -t, --token     GitHub auth token
      -u, --username  GitHub username
      -p, --password  GitHub password
  ` );
}

export function showErrors( errors ) {
  if ( errors instanceof Array ) {
    console.error( `
      Errors:
        ${errors.join('\n      ')}
    ` );
  } else {
    console.error( `
      Error: ${error}
    ` );
  }
  process.exit( 1 );
}
