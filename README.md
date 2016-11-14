
# gfork
[![npm](https://img.shields.io/npm/v/gfork.svg)](https://www.npmjs.com/package/gfork)

Fork, clone, init github/npm projects from command-line.

How do you clone a GitHub project? Hit the fork button, copy the git URL, run `git clone ...` in the terminal, probably do some initialization like `npm install`? Or maybe you have GitHub client..

But how do you go about cloning an npm module? Find its GitHub URL and do the above? And what if you have to do it for multiple projects at a time?

**gfork** makes all this a lot easier.
With **gfork** you could simply do something like this:

```sh
$ gfork express
...
Forking expressjs/express...
Cloning into 'express'...
```

Or...

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr"><a href="https://twitter.com/kentcdodds">@kentcdodds</a> Now wouldn&#39;t it be cool, if you could go into a repo in your node_modules and run `npm fork` and it would fork it on github.</p>&mdash; Merrick Christensen (@iammerrick) <a href="https://twitter.com/iammerrick/status/717194650629476353">April 5, 2016</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

Super handy if you're debugging inside your dependencies and you might find a bug or want to submit a patch to the source project's github repo.

You can do this with gfork!

```sh
$ cd node_modules/express
$ rm --rf ./*
$ gfork .
...
Forking expressjs/express...
Cloning into 'express'...
```
Another way of doing it, without actually having to go *into* the said repo, you could just fork it in place from your project dir itself:
```sh
$ gfork express --root node_modules --rm
...
```
Changing `--root` to `./node_modules` makes it fork in `./node_modules/<repo>`, and `--rm` is basically `rm -rf ./*`.
There's also a shortcut switch for `--root node_modules`: `--nm`

And here's the kicker: you can fork/clone **multiple projects**!

```sh
$ gfork --nm --rm express cookie-session passport
...
Forking expressjs/express...
Forking expressjs/cookie-session...
Forking jaredhanson/passport...
```

All happen simultaneously and independently without stopping the other even if one errors out.



And last but not the least, cloning is only half the job. There's always some initialization that needs to be done afterwards, like `npm install`. gfork lets you specify a command to execute in the respective project dir after cloning.

gfork stores this command, along with its config in ~/.gfork and you can change it via gfork commandline itself. Arguments passed always take precedence over saved configs.


## Operation

**gfork** does 4 things when it clones a project:


1. Forks a project on your behalf.

    It asks you to login the first time you run it and uses GitHub REST API to get a token and stores it for future use. It doesn't store your credentials, only the token.

    You can also supply the token yourself to avoid logging in; [here's how to get one][get-token].

    ```sh
    gfork --token YOUR_ACCESS_TOKEN
    ```

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


**gfork** understands following URLs

* Github URLs:

    * https://github.com/expressjs/express
    * git@github.com:expressjs/express.git

* Github user/repo combo:

    * expressjs/cookie-session

* npm package names:

    * cookie-session

* npm URLs:

    * https://www.npmjs.com/package/express

(npm package names/URLs must have their `repository.url` property set in their `package.json`)

## Installation

```sh
npm install -g gfork
```

## Usage:

#### First time setup

Initially let it authenticate you to GitHub and get an authentication token for future use:

```
$ gfork
Welcome! Please login to your GitHub account
? Enter your username: <your-username>
? Enter your password: *******
Authenticating...
Welcome!
Config saved succesfully to file "~/.gfork"

? Clone a GitHub URL? (Y/n) No
? Edit the config? (Y/n) Yes

? Token note: Token for gfork
? Name for original remote: src
? Domain name: github.com
? Command to run after cloning: echo done
Config saved succesfully to file "~/.gfork"
```

You can run `gfork` (without arguments) any time to set up this config.

You can also supply the token yourself to avoid logging in; [here's how to get one][get-token].

```sh
gfork --token YOUR_ACCESS_TOKEN
```

#### Subsequent use

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
  -t, --token       Specify token manually (otherwise auto-retrived)
  -f, --config-file File to save config and token for future (default ~/.gfork)
  -u, --username    Your GitHub username (only 1st time) [optional: prompted if necessary]
  -p, --password    Your GitHub password (only 1st time) [optional: prompted if necessary]
  -n, --token-note  Note to use when getting token (default "gh-token"). If you're gettig error "already exists", try changing this.
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

After succesfully cloning it can execute specified commands from inside the repo dir. It also makes the repo name available as an environment variable: `$repo` which you can use in your command:

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

[1]: https://help.github.com/articles/checking-out-pull-requests-locally/
[2]: https://developer.github.com/v3/repos/forks/#create-a-fork


[git-fork]: https://www.npmjs.com/package/git-fork
[forked]: https://www.npmjs.com/package/forked

[get-token]: https://help.github.com/articles/creating-an-access-token-for-command-line-use/