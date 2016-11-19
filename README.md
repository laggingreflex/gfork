
# gfork
[![npm](https://img.shields.io/npm/v/gfork.svg)](https://www.npmjs.com/package/gfork)

Fork, clone, init github/npm projects from command-line.

Wouldn't it be cool if you could fork and clone a project just like you install an npm module?

```sh
$ gfork express
...
Forking expressjs/express...
Cloning into 'express'...
```
By default it clones it in `./express`. To replace your `./node_modules/express` do this:

```sh
$ gfork express --forks-dir node_modules --rm-rf
```
(there's also shortcut switches for `--root node_modules`: `-N`, and for `--rm-rf`: `-R`)

You can even fork/clone multiple projects! All simultaneously and independently:

```sh
$ gfork -NR express cookie-session passport
...
Forking expressjs/express...
Forking expressjs/cookie-session...
Forking jaredhanson/passport...
```

gfork also lets you specify a command to execute after cloning in the respective project dir:

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

Instead of directly cloning inside the `node_modules` dir of your current project, you should clone it in a separate dir and [**use `npm link`**][npm link] to link those projects into your current project's `node_modules`. It'll allow you to use the same forked module across different projects. You can specify the `--forks-dir` as any dir on your computer.

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

And last but not the least, gfork stores these command configs, along with its other configs (token, etc.) in ~/.gfork so you can have this as your default action for all forks. You can edit this config with `gfork -e`. Passed arguments always take precedence so you can always override the saved commands.



**gfork** understands following URLs

* npm package names:

    * cookie-session

* npm URLs:

    * https://www.npmjs.com/package/express

* Github user/repo combo:

    * expressjs/cookie-session

* Github URLs:

    * https://github.com/expressjs/express
    * git@github.com:expressjs/express.git

(npm package names/URLs must have their `repository.url` property set in their `package.json`)

## Installation

```sh
npm install -g gfork
```

## Usage:

### First time setup

Initially let it authenticate you to GitHub and get an authentication token for future use:

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

## Options

```
gfork <GitHub project URL>

Options:
  -u, --url         GitHub project URL to fork/clone [prompted if not provided]
  -t, --token       Specify token manually (otherwise auto-retrieved)
  -f, --config-file File to save config and token for future (default ~/.gfork)
  -u, --username    Your GitHub username (only 1st time) [optional: prompted if necessary]
  -p, --password    Your GitHub password (only 1st time) [optional: prompted if necessary]
  -n, --token-note  Note to use when getting token (default "gh-token"). If you're getting error "already exists", try changing this.
  -r, --remote      Remote name to use for original library (default "src")
  -d, --domain      Use a different domain name than (default "github.com"). In case you use 'acc1.github.com' in your SSH config
  -c, --command     Command to execute after cloning. Inside repo dir with $repo variable name.
```

## Features

### Authentication

Your credentials are used for the first time to receive an authentication token and stored for future use in `~/.gfork`

### Fork & clone

It uses the [GitHub API][2] to fork, and uses local `git` to do the rest.

### Command

After successfully cloning it can execute specified commands from inside the repo dir. It also makes the repo name available as an environment variable: `$repo` which you can use in your command:

```
touch $repo.sublime-project && npm i
```

### Config

Settings are saved in config file (`~/.gfork`) in JSON format on every command invocation.

## Issues

If you get an error like this while logging in:

```json
{"message":"Validation Failed","errors":[{"resource":"OauthAccess","code":"already_exists","field":"description"}],"documentation_url":"https://developer.github.com/v3/oauth_authorizations/#create-a-new-authorization"}
```
It probably means you had logged in before and token has been lost. Try changing the `token-note`

```sh
$ gfork -n "Some random new token note"
```

## Detailed operation

**gfork** does 4 things when it clones a project:


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
    touch $repo.sublime-project && npm install
    ```

    Notice that it also makes available an environment variable "`repo`" which holds the name of the project that was being cloned.


[1]: https://help.github.com/articles/checking-out-pull-requests-locally/
[2]: https://developer.github.com/v3/repos/forks/#create-a-fork


[npm link]: https://www.google.com/search?q=use+npm+link

[git-fork]: https://github.com/e-conomic/git-fork
[forked]: https://github.com/eanplatter/forked

[get-token]: https://help.github.com/articles/creating-an-access-token-for-command-line-use/