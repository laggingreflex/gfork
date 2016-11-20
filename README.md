
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
$ gfork express --forks-dir /home/my-forks
```


You can also specify an alternative `--root-dir-command` that's executed in your current dir after the regular `--command` is finished in the respective repo in `--forks-dir`.

So you can clone/fork a module in your forks dir and have it linked to your current project's node_modules:

```sh
$ gfork express \
    --forks-dir ~/my-forks \
    --command="npm link" \
    --root-dir-command="npm link $repo"
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

You don't have to type that long command every time,
gfork can store these command configs so you can have this as your default action for all forks, and you **just** have to run `gfork express`.


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

### Operation

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

## Features

### Authentication

Your credentials are used for the first time to receive an authentication token and stored for future use in `~/.gfork`.

### Fork & clone

It uses the [GitHub API][2] to fork, and uses local `git` to do the rest.

### Config

Settings are saved in config file (`~/.gfork`) in JSON format. You can edit the settings directly or by running `gfork --edit-config`


### Commands

gfork gets you specify a `--command` to run in the project dir and a `--root-dir-command` to run in the root dir. The root-dir command is run after the command in the project dir completes and **only** if it exits cleanly.

In both commands the repo name is available as an environment variable: `$repo`


## Issues

Feel free to [open issues](issues) and submit PRs!

### Known issues

If your token isn't working and you get an error like this:

```json
{"message":"Validation Failed","errors":[{"resource":"OauthAccess","code":"already_exists","field":"description"}],"documentation_url":"https://developer.github.com/v3/oauth_authorizations/#create-a-new-authorization"}
```
Try changing the `token-note`

```sh
$ gfork --edit-config --token-note "Some random new token note"
```



[1]: https://help.github.com/articles/checking-out-pull-requests-locally/
[2]: https://developer.github.com/v3/repos/forks/#create-a-fork


[npm link]: https://www.google.com/search?q=use+npm+link

[git-fork]: https://github.com/e-conomic/git-fork
[forked]: https://github.com/eanplatter/forked

[get-token]: https://help.github.com/articles/creating-an-access-token-for-command-line-use/