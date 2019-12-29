
# gfork
[![npm](https://img.shields.io/npm/v/gfork.svg)](https://www.npmjs.com/package/gfork)

Finds the GitHub repository of the NPM module, forks it under your account, and clones your forked repo.

```sh
$ gfork express ~/forks/<repo> --link
...
Forking expressjs/express
Cloning into '~/forks/express'
Running 'npm link' in '~/forks/express'
Running 'npm link express' in current-dir
```

You can specify the project in various ways:
```sh
$ gfork expressjs/express # GitHub user/lib format
$ gfork express           # Plain npm package format
$ gfork https://github.com/expressjs/express # URL
```


## Installation

```sh
npm install -g gfork
```

## Usage

```
gfork <library> [directory]

Fork a library

Commands:
  gfork <library> [directory]     Fork a library  [default]
  gfork pr [branch=<current>]     Create a pull request on original source using your (current) branch
  gfork fetch <pr>                Fetch a PR from source remote. (E.g.: "git fetch src pull/42/head:#42")

Options:
  --help, -h           Show help  [boolean]
  --version            Show version number  [boolean]
  --library, -l        Library/URL to fork  [string] [required]
  --directory          Directory to use for cloning'  [string] [default: "<repo>"]
  --clean              Remove everything in target dir before cloning  [boolean]
  --link               Run 'npm link' in <directory> and 'npm link <repo>' in <cwd> respectively  [boolean]
  --command, -c        Command to execute after cloning inside the repo dir  [array]
  --cwdCommand, --cc   Command to execute in current-dir (cwd) (after --command exits cleanly)  [array]
  --token              GitHub token  [string]
  --tokenNote          Note to use when getting token  [string] [default: "Token for gfork"]
  --configFile         File(s) to save config and token for future  [array] [default: ["~/.gfork",".gfork"]]
  --username           GitHub username (to fetch token, and to set for cloned git repo)  [string]
  --password           GitHub password (to fetch token)  [string]
  --email              Email to set for cloned git repo  [string]
  --setUser            Set username/email in forked git repo from GitHub account  [boolean]
  --remote, -r         Remote name to use for original library  [string] [default: "src"]
  --domain, -d         In case you use something like 'acc1.github.com' in your SSH config  [string] [default: "github.com"]
  --urlType            Github URL type to use when cloning. "git" or "https" ('git@github.com/...' or 'https://<token>@github.com/...')  [string] [default: "git"]
  --depth              Create shallow clone of that depth (applied to git command)  [number]
  --silent, -s         Don't log unnecessarily  [boolean]
  --prompt             Prompt user for missing information  [boolean] [default: "<isTTY>"]
  --forksDir, -F       [Deprecated. Use --directory=".../<repo>"]
  --nodeModules, -N    [Deprecated. Use --directory="./node_modules/<repo>"]
  --http               [Deprecated. Use --url-type="https"]
  --rmRf, --rm, -R     [Deprecated. Use --clean]
  --currentDirCommand  [Deprecated. Use --cwdCommand]
  --noSavedConfig, -X  [Deprecated. Use --config-file=false]
```
```
Examples:
gfork express                          # clones express in ./express
gfork express ~/forks/<repo> --link    # clones express in ~/forks/express and npm link's it to current project ("<repo>" is replaced with "express" automatically)

# inside cloned module (~/forks/express)
gfork fetch 42     # pulls http://github.com/expressjs/express/pull/42 as pull/42 branch
gfork pr           # opens http://github.com/expressjs/express/compare/<current-branch>
```

## Setup

Initially gfork needs to authenticate you to GitHub (for forking).

You can [get the token][get-token] and provide it using `--token=...` or it'll ask you for it, with an option to enter your credentials (username/password)\* and it'll get it for you.

\*Note: [GitHub is deprecating password authentication][deprecated-passwords-api], you may have no other option but to [get the token][get-token] manually in the future.

After the first time it'll save the token in `~/.gfork` file.

Settings are stored as plain JSON in `~/.gfork` and you can edit or save new settings. Stored settings are applied on every use, and can be overridden by command-line arguments.

## Details

### Detailed operation

gfork does 4 things when it clones a project:

1. Forks a project on your behalf.

    It asks you to login the first time you run it and uses GitHub REST API to get a token and stores it for future use. It doesn't store your credentials, only the token. [You can also supply the token yourself](#first-time-setup).

2. Clones your fork locally, so that "origin" points to your fork.

    "origin" points to your fork so you can push changes to it that automatically show up as prompts to make new pull requests on the original author's library.

3. Sets up the original remote as "src"

    So that you can still pull any new changes
    ```sh
    git pull src
    ```

    or [checkout other pull requests][1]:
    ```sh
    git fetch src pull/42/head:pull_request_#42
    ```

4. And finally it allows you to execute custom command after cloning, generally to initialize the project. Such as:

    ```sh
    npm install && touch $repo.sublime-project
    ```

    Notice that it also makes available an environment variable "`repo`" which holds the name of the project that was being cloned.


## Limitations

Doesn't work on [Lerna] packages, like [babel-register].

## Similar projects

|                                   | gfork | [forked] | [git-fork]    | [sgit]
| -------------                     |:----: |:----:    |:-----:        |:----:
| Forks                             |x      |x         |x              |
| Auto-retrieves token              |-¹     |          |x              |
| Clones                            |x      |          |x              |x
| Opens a PR                        |x      |          |x              |
| Fetches a PR                      |x      |          |               |
| Works on GitHub URLs              |x      |x         |x              |x
| Works on NPM package names        |x      |          |               |
| Works on Bitbucket URLs           |       |          |               |x
| Works on Gitlab URLs              |       |          |               |x
| Https .git url type               |x      |          |o²             |
| Shallow clone                     |x      |          |               |
| Multiple projects simultaneously  |x      |          |               |
| `rm -rf` before cloning           |x      |          |               |
| Execute a command afterwards      |x      |          |               |
| Use saved config                  |x      |          |               |

<sup>-¹: for the time being, but [GitHub is deprecating the API that makes this possible][deprecated-passwords-api]</sup>
<sup>o²: *only* https urls</sup>


Non-similar but relevant projects:

* [npmgitdev]

[npmgitdev]: https://github.com/TerriaJS/npmgitdev

Not related in any way, but nice little libraries for testing:

* [rtyley/small-test-repo]
* [noop4]


[1]: https://help.github.com/articles/checking-out-pull-requests-locally/
[2]: https://developer.github.com/v3/repos/forks/#create-a-fork
[babel-register]: https://github.com/babel/babel/tree/master/packages/babel-register
[deprecated-passwords-api]: https://developer.github.com/changes/2019-11-05-deprecated-passwords-and-authorizations-api/
[forked]: https://github.com/eanplatter/forked
[forked]: https://github.com/eanplatter/forked
[get-token]: https://help.github.com/articles/creating-an-access-token-for-command-line-use/
[git-fork]: https://github.com/e-conomic/git-fork
[git-fork]: https://github.com/e-conomic/git-fork
[https-oauth]: https://github.com/blog/1270-easier-builds-and-deployments-using-git-over-https-and-oauth
[Lerna]: https://github.com/lerna/lerna
[node-portscanner]: https://github.com/baalexander/node-portscanner
[noop4]: https://github.com/gabrieleds/noop4
[npm link]: https://www.google.com/search?q=use+npm+link
[portscanner]: https://www.npmjs.com/package/portscanner
[rtyley/small-test-repo]: https://github.com/rtyley/small-test-repo
[sgit]: https://github.com/rascada/sgit
[ssh-key]: https://help.github.com/articles/generating-an-ssh-key/



