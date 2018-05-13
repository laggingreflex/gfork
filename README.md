
# gfork
[![npm](https://img.shields.io/npm/v/gfork.svg)](https://www.npmjs.com/package/gfork)

Fork, clone, init github/npm projects from command-line.

## Installation

```sh
npm install -g gfork
```

## Usage

```
gfork [OPTIONS] [NPM library or GitHub project]
```
```
-c, --command               Command to execute after cloning inside the repo dir.
-R, --rm-rf                 Remove everything in target dir before cloning.
-F, --forks-dir             Directory to put new forks (create subdirs for repo) in. Default: ./
-N, --node-modules          Shortcut for --forks-dir="./node_modules".
--cc, --current-dir-command Command to execute in current dir after --command exits cleanly.
., --here                   Do stuff directly in current-dir, like clone etc.. (alias: .)
-L, --pull-request          Create a pull request from current branch. (opens default browser) (requires --here)
-H, --fetch-pr              Fetch a PR from src. (shortcut to: git fetch src pull/42/head:#42) (requires --here)
-t, --token                 Specify token manually (otherwise auto-retrieved)
-n, --token-note            Note to use when getting token (default "Token for gfork")
-f, --config-file           File to save config and token for future (default ~/.gfork)
-u, --username              Your GitHub username (only 1st time) [optional: prompted if necessary]
-p, --password              Your GitHub password (only 1st time) [optional: prompted if necessary]
-r, --remote                Remote name to use for original library (default "src")
-d, --domain                Use a different domain name than (default "github.com"). In case you use 'acc1.github.com' in your SSH config
--url-type                  Github URL type to use when cloning ('git@github.com/...' or 'https://<token>@github.com/...'). Default: git
--http                      Shortcut for --url-type=https. Use this if you haven't set up your SSH public key in github: https://help.github.com/articles/generating-an-ssh-key/
--depth                     Create shallow clone of that depth (applied to git command)
-e, --edit-config           Edit config. Either edit all config, or when used with other arguments just edit those.
-X, --no-saved-config       Don't use any saved config, except token.
```
```
Examples:
gfork express     # clones express in ./express
gfork . express   # clones express in ./
gfork -NR express # clones express in ./node_modules/express

# inside cloned module (./express)
gfork . -H 24     # pulls http://github.com/expressjs/express/pull/42 as #42 branch
gfork . -L        # opens http://github.com/expressjs/express/compare/<current-branch>
```

## Description

Wouldn't it be awesome if you could fork and clone a github project of the npm module just like you installed it?

```sh
$ gfork express
...
Forking expressjs/express...
Cloning into 'express'...
```
gfork finds the github repository of the npm module and forks it under your account and clones your forked repo.

You can also specify the github project directly:
```sh
$ gfork https://github.com/expressjs/express
# or just username/lib combo
$ gfork expressjs/express
```

By default it will clone it in `current-dir/express`, but you can have it remove your `./node_modules/express` and clone it there instead (just like `npm install` would have):
```sh
$ gfork express --forks-dir node_modules --rm-rf
# or
$ gfork express -NR
```
(shortcut switches for `--forks-dir node_modules`: `-N`, and for `--rm-rf`: `-R`)

You can even fork/clone multiple projects! All simultaneously and independently:

```sh
$ gfork -NR express cookie-session passport
...
Forking expressjs/express...
Forking expressjs/cookie-session...
Forking jaredhanson/passport...
```

Just cloning isn't enough though, you probably have to execute some initial commands in the cloned project dir(s). gfork can handle that for you:

```sh
$ gfork -NR express cookie-session passport --command="npm install"
...
Forking expressjs/express...
Forking expressjs/cookie-session...
Forking jaredhanson/passport...
...
Executing command: `npm install` in 'express'...
Executing command: `npm install` in 'cookie-session'...
Executing command: `npm install` in 'passport'...
```


### **Protip**

Instead of directly cloning inside your `./project/node_modules/…` dir, you should clone it in a separate dir and [**use `npm link`**][npm link] to link those projects into your current project's `node_modules`. It'll allow you to use the same forked module across different projects. You can specify the `--forks-dir` as any dir on your computer.

```sh
$ gfork express --forks-dir ~/my-forks
```
<sup>PS: `~` expands to homedir for Windows users as well.</sup>

Together with `--command` and `--current-dir-command` you can clone/fork a module in your forks dir and have it linked to your current project's node_modules:

```sh
$ gfork express \
    --forks-dir ~/my-forks \
    --command="npm link" \
    --current-dir-command="npm link \$repo"
```
this is the equivalent of doing:
```sh
$ pushd ~/my-forks
$ git clone https://github.com/<your-fork>/express
Cloning into 'express'...
...
$ pushd express
$ npm link
+-- express@3.0.5
~/.npm/node_modules/express -> ~/my-forks/express
$ popd; popd # back to original root-dir
$ npm link express
./node_modules/express -> ~/.npm/node_modules/express -> ~/my-forks/express
```

You don't have to type that long command every time, gfork can store these command configs so you can have this as your default action for all forks.
```sh
$ gfork --edit-config \
    --forks-dir ~/my-forks \
    --command="npm link" \
    --current-dir-command="npm link \$repo"
Config saved successfully to file "~/.gfork"
# now you can just run
gfork express
# and it'll run it with the saved config as options
```
You can still override saved config:
```sh
# passed arguments take precedence over saved config options
$ gfork express -NR -c "npm i" --cc ""
# or to not use any saved config (except token):
$ gfork express --no-saved-config  # alias: -X
# which can also be combined with other config:
$ gfork express -NRX
```

Caveat: A downside to this approach is that you'll be (re-)installing the said module's dependencies (and devDependencies\*) in its own dir again (npm link does all that). But then you may also be better able to hack on the module by being able to run its tests etc. which probably wouldn't work without its dependencies. \*To install devDependencies you may need to set your environment variable `NODE_ENV=development`.

## Setup

Initially gfork needs to authenticate you to GitHub (for forking). It'll ask you for your username/password and get an authentication token for future use:

```
$ gfork
Welcome! Please login to your GitHub account
? Enter your username: <your-username>
? Enter your password: *******
Authenticating...
Welcome!
Config saved successfully to file "~/.gfork"
```
You can also supply the token yourself to avoid logging in; [here's how to get one][get-token].

```sh
$ gfork --edit-config --token YOUR_ACCESS_TOKEN
? Token: YOUR_ACCESS_TOKEN
Config saved successfully to file "~/.gfork"
```

Also, by default it uses git urls (`git@github.com/….git`) which require you set up your SSH public key set up with Github ([more info][ssh-key]).

Or you can instead choose to use [https oauth urls][https-oauth] (`https://<your-token>@github.com/….git`) by setting the `--url-type=https` (or `--https`)

[ssh-key]: https://help.github.com/articles/generating-an-ssh-key/
[https-oauth]: https://github.com/blog/1270-easier-builds-and-deployments-using-git-over-https-and-oauth

Settings are stored as plain JSON in `~/.gfork` and you can edit or save new settings with: `gfork --edit-config` (or just `-e`). Stored settings are applied on every use, except in the case you wish to over-ride them; passed arguments always take precedence over any saved config of the same name, or you can use the `--no-saved-config` (alias: `-X`) in which case no saved setting (except token) are applied.


### Subsequent use

Just pass it the URL/package-name to fork/clone

```
$ gfork express
Authenticating...
Welcome!
Forking expressjs/express...
Cloning into 'express'...
remote: Counting objects: 6, done.
remote: Total 6 (delta 0), reused 0 (delta 0), pack-reused 6
Receiving objects: 100% (6/6), done.
Checking connectivity... done.
Adding remote "src" => "git@github.com:expressjs/express.git"
origin  git@github.com:<youuser>/express.git (fetch)
origin  git@github.com:<youuser>/express.git (push)
src     git@github.com:expressjs/express.git (fetch)
src     git@github.com:expressjs/express.git (push)
Setting user.name = "you"
Setting user.email = "your@email.com"
Executing custom commands...
echo done
done
```

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


### Detailed Features

#### Authentication

Your credentials are used for the first time to receive an authentication token and stored for future use in `~/.gfork`.

#### Fork & clone

It uses the [GitHub API][2] to fork, and uses local `git` to do the rest.

#### NPM module cloning

When you specify an npm module it finds its github repository from its `package.json` and clones the resulting github project. It also handles any redirects.

If the project name on the github differs from the npm module name supplied, it will use the supplied npm module name while cloning the github project. For example the npm module [`portscanner`][portscanner]'s github repo is named [`node-portscanner`][node-portscanner], if you do `gfork portscanner` it will use the name "portscanner" to create the resulting cloned directory.

[portscanner]: https://www.npmjs.com/package/portscanner
[node-portscanner]: https://github.com/baalexander/node-portscanner

#### Config

Settings are saved in config file (`~/.gfork`) in JSON format. You can edit the settings directly or by running `gfork --edit-config`

### Detailed usage

#### command

`--command` runs in the project dir after cloning process exits cleanly (code 0).

And a `--current-dir-command` runs in the root dir after the `--command` exits cleanly.

In both commands the repo name is available as an environment variable: `$repo`.

PS: Use a backslash to escape the `\$repo` when passing it as an argument to gfork on the command line, otherwise it'll expand (to empty var most likely). Or use the `--edit-config` inquiry prompt where you may enter it without escaping.

#### here

`--here` switch is used in cases where things need to be done in the current directory.

This clones the module in current directory instead of in a sub-directory:
```
gfork <url> --here
```
is equivalent to:
```
git clone <url> .
```

It's also used (required) in `--pull-request` and `--fetch-pr` because you can only do those things when you inside a cloned project.

A period `.` is a short alias for it:
```
gfork <url> --here
# or
gfork <url> .
```

#### pull request

`--pull-request` is a handy shortcut to open the github URL to create a pull request from current branch of your forked repo against the original author's github repo. It requires you to be inside your cloned project dir and use `--here` switch.
```
cd express
gfork . --pull-request
```

#### fetch pr

`--fetch-pr` is another handy shortcut to fetch a pull-request from the original author's github repo and check it out locally. It requires you to be inside your cloned project dir and use `--here` switch.
```
gfork . --fetch-pr 42
```
It's equivalent to:
```
git fetch src pull/42/head:#42
git checkout #42
```
Note that it automatically creates a new branch name `#` followed by the pull request ID, and also checks out that branch.

### Extra features

#### Non-empty directory

If the directory in which the repo is supposed to be cloned is non-empty, and you didn't provide `--rm` switch, it'll prompt you to delete the contents.

If you don't wish to delete the contents, maybe because the previously cloned copy is good enough, it'll ask you to execute the configured commands.

For eg., I've set up my `forksDir` as `~/forks`, `--command="npm link"`, and `--current-dir-command="npm link $repo"` (see [#protip](#protip) for more details on this setup). Now I've already ran `"gfork arrify"` once before in another project and I want to run it again in this `"current-project"` **but** I don't want to clone the repo all over again, nor do I want to run `--command="npm link"`, I *just* want to run the `--current-dir-command="npm link $repo"`.

```sh
$ gfork arrify
Cloning in forksDir: ~/forks/arrify...
Non-empty directory: ~/forks/arrify
? Delete everything from it? false
? Execute forksDir command? false
? Execute currentDir command? true
Executing command: `npm link $repo` in 'current-project'
./node_modules/arrify -> ~/forks/arrify
```

## Issues

Feel free to [open issues](../../issues) and submit PRs!

### Known issues

If your token isn't working and you get an error like this:

```json
{"message":"Validation Failed","errors":[{"resource":"OauthAccess","code":"already_exists","field":"description"}],"documentation_url":"https://developer.github.com/v3/oauth_authorizations/#create-a-new-authorization"}
```
Try changing the `token-note`

```sh
$ gfork --edit-config --token-note "Some random new token note"
```

## Similar projects

|                                   | gfork | [forked] | [git-fork]    | [sgit]
| -------------                     |:----: |:----:    |:-----:        |:----:
| Forks                             |x      |x         |x              |
| Auto-retrieves token              |x      |          |x              |
| Clones                            |x      |          |x              |x
| Opens a PR                        |x      |          |x              |
| Fetches a PR                      |x      |          |               |
| Works on GitHub URLs              |x      |x         |x              |x
| Works on NPM package names        |x      |          |               |
| Works on Bitbucket URLs           |       |          |               |x
| Works on Gitlab URLs              |       |          |               |x
| Https .git url type               |x      |          |o¹             |
| Shallow clone                     |x      |          |               |
| Multiple projects simultaneously  |x      |          |               |
| `rm -rf` before cloning           |x      |          |               |
| Execute a command afterwards      |x      |          |               |
| Use saved config                  |x      |          |               |

<sup>o¹: *only* https urls</sup>

[forked]: https://github.com/eanplatter/forked
[git-fork]: https://github.com/e-conomic/git-fork
[sgit]: https://github.com/rascada/sgit

Non-similar but relevant projects:

* [npmgitdev]

[npmgitdev]: https://github.com/TerriaJS/npmgitdev

Not related in any way, but nice little libraries for testing:

* [rtyley/small-test-repo]
* [noop4]

[noop4]: https://github.com/gabrieleds/noop4
[rtyley/small-test-repo]: https://github.com/rtyley/small-test-repo

[npm link]: https://www.google.com/search?q=use+npm+link

[git-fork]: https://github.com/e-conomic/git-fork
[forked]: https://github.com/eanplatter/forked

[get-token]: https://help.github.com/articles/creating-an-access-token-for-command-line-use/

## Limitations

Doesn't work on [Lerna] packages, like [babel-register].

[Lerna]: https://github.com/lerna/lerna
[babel-register]: https://github.com/babel/babel/tree/master/packages/babel-register




[1]: https://help.github.com/articles/checking-out-pull-requests-locally/
[2]: https://developer.github.com/v3/repos/forks/#create-a-fork



