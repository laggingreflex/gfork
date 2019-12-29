
# gfork
[![npm](https://img.shields.io/npm/v/gfork.svg)](https://www.npmjs.com/package/gfork)

Finds the GitHub repository of the NPM module, forks it under your account, and clones your forked repo.

```sh
$ gfork express
Forking "expressjs/express" -> "<you>/express"
Cloning into '~/gfork/express'
Running 'npm link' in '~/gfork/express'
Running 'npm link express' in <current-dir>
```

## Installation

```sh
npm install -g gfork
```

## Usage

```
gfork express
```

In its simplest form it:

1. Finds the GitHub repository

2. Clones it in `~/gfork/<repo>`

3. If it's an npm project, [npm-link]s accordingly

### Forking

If you let it [authenticate](#Authentication) to GitHub it can also [fork] the repo under your account.

Or you can pass your `--username=xxx` and `--forked` flag and it'll assume that you've forked on your own.

Forking a repo creates 2 sources in the cloned repo

* `origin` - your fork
* `src` - original repo

And 2 branches:

* `master` - tracks `origin`
* `src` - tracks `src`

This lets you push your changes to your own fork, and allows you to pull in latest changes from original repo easily as well:

```
git checkout src
git pull
```

### Authentication

You can authenticate either via a [token][get-token] or your credentials (username/password/OTP).

\*Note: [GitHub is deprecating password authentication][deprecated-passwords-api], in the future you may have no other option but to [get the token][get-token] manually.

### Settings

Settings are stored as plain JSON in `~/gfork/config.json` and you can edit or save new settings. Stored settings are applied on every use, and can be overridden by command-line arguments.


### Commands

In addition to the default command, it has 2 extra commands (that works only on forked repos):

Use these commands in the cloned directory:

#### fetch

Fetch a PR from source remote. (E.g.: "git fetch src pull/42/head:#42")

E.g.:

```
gfork fetch 42
```

#### pr

Create a pull request on original source using your (current) branch

E.g.:

```
gfork pr
```



Inside a fork (`~/gfork/express`)
```
gfork fetch 42     # pulls http://github.com/expressjs/express/pull/42 as pull/42 branch
gfork pr           # opens http://github.com/expressjs/express/compare/<current-branch>
```


### Detailed Usage

```
gfork <library> [directory]

Fork a library

Commands:
  gfork <library> [directory]     Fork a library  [default]
  gfork pr [branch=<current>]     Create a pull request on original source using your (current) branch
  gfork fetch <pull-request>      Fetch a PR from source remote. (E.g.: "git fetch src pull/42/head:#42")

Options:
  --help, -h          Show help  [boolean]
  --version           Show version number  [boolean]
  --library, -l       Library/URL to fork  [string]
  --directory         Directory to use for cloning'  [string] [default: "~/gfork/<repo>"]
  --clean             Remove everything in target dir before cloning  [boolean]
  --npmLink           Run 'npm link' in <directory> and 'npm link <repo>' in <cwd> respectively  [boolean] [default: "<true if npm-package>"]
  --command, -c       Command to execute after cloning inside the repo dir  [string]
  --cwdCommand, --cc  Command to execute in current-dir (cwd) (after --command exits cleanly)  [string]
  --token             GitHub token  [string]
  --tokenNote         Note to use when getting token  [string] [default: "Token for gfork"]
  --config            File(s) to save config and token for future  [array] [default: ["~/gfork/config.json",".gfork"]]
  --fork              Create a fork of the repo under your GitHub account  [boolean]
  --username          GitHub username (to fetch token, and to set for cloned git repo)  [string]
  --password          GitHub password (to fetch token)  [string]
  --otp               GitHub 2FA OTP (to fetch token)  [string]
  --email             Email to set for cloned git repo  [string]
  --skipAuth          Skip GitHub authentication (don't prompt)  [boolean]
  --setUser           Set username/email in forked git repo from GitHub account  [boolean]
  --remote, -r        Remote name to use for original library  [string] [default: "src"]
  --domain, -d        In case you use something like 'acc1.github.com' in your SSH config  [string] [default: "github.com"]
  --http              Use web url (https://) (instead of ssh/git)')  [boolean]
  --depth             Create shallow clone of that depth (applied to git command)  [number]
  --branch, -b        Local branch to use  [string] [default: "master"]
  --pullRequest       PR to fetch  [number]
  --cwd               Current working directory  [string] [default: "<cwd>"]
  --silent, -s        Don't log unnecessarily  [boolean]
  --debug, -s         Log debug messages  [boolean]
  --prompt            Prompt user for missing information  [boolean] [default: "<isTTY>"]
  --confirm           Confirm decisions (only works if prompt=true)  [boolean]
```


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
| `rm -rf` before cloning           |x      |          |               |
| Execute commands afterwards       |x      |          |               |
| Use saved config                  |x      |          |               |

<sup>-¹: for the time being... [GitHub is deprecating the API that makes this possible][deprecated-passwords-api]</sup>
<sup>o²: *only* https urls</sup>


Non-similar but relevant projects:

* [npmgitdev]

[npmgitdev]: https://github.com/TerriaJS/npmgitdev

Not related in any way, but nice little libraries for testing:

* [rtyley/small-test-repo]
* [noop4]


[1]: https://help.github.com/articles/checking-out-pull-requests-locally/
[2]: https://developer.github.com/v3/repos/forks/#create-a-fork
[fork]: https://help.github.com/en/github/getting-started-with-github/fork-a-repo
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
[npm-link]: https://www.google.com/search?q=use+npm+link
[portscanner]: https://www.npmjs.com/package/portscanner
[rtyley/small-test-repo]: https://github.com/rtyley/small-test-repo
[sgit]: https://github.com/rascada/sgit
[ssh-key]: https://help.github.com/articles/generating-an-ssh-key/



