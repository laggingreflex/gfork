[![npm](https://img.shields.io/npm/v/ghfork.svg)](https://www.npmjs.com/package/ghfork)

# ghfork

Fork, clone, and init a GitHub project all at once from command-line.

If you find yourself doing the following everytime you clone a GitHub project:

1. Fork a project on GitHub

    Original: `https://github.com/some/library`

    Forked: `https://github.com/your/library`

2. Clone **your** fork locally

    ```sh
    git clone git@github.com:your/library.git
    ```
    "origin" points to your fork so you can push changes to it that automatically show up as prompts to make new pull requests on the original author's library.

3. Set up original remote as "src"

    ```sh
    git remote add src git@github.com:original-author/some-library.git
    ```

    Pull any future updates

    ```sh
    git pull src
    ```

    or [checkout pull requests][1] from the original source:


    ```sh
    git fetch src pull/42/head:pull_request_#42
    ```

4. Initialize the project after cloning

    ```sh
    touch $repo.sublime-project && npm i
    ```

Then **ghfork** is for you! It does all this in one go from command line.

## Installation

```sh
npm install -g ghfork
```

## Usage:

#### First time setup

Initially let it authenticate you to GitHub and get an authentication token for future use:

```
$ ghfork
Welcome! Please login to your GitHub account
? Enter your username: hunter
? Enter your password: *******
Authenticating...
Welcome, AzureDiamond
Config saved succesfully to file "~/.ghfork"

? Clone a GitHub URL? (Y/n) No
? Edit the config? (Y/n) Yes

? Token note: Token for ghfork
? Name for original remote: src
? Domain name: github.com
? Command to run after cloning: echo done
Config saved succesfully to file "~/.ghfork"
```

You can run `ghfork` (without arguments) any time to set up this config.

#### Subsequent use

Just pass it the URL to fork/clone

```
$ ghfork https://github.com/original-owner/test-repo
Authenticating...
Welcome, you <your@email.com>
Forking original-owner/test-repo...
Cloning into 'test-repo'...
remote: Counting objects: 6, done.
remote: Total 6 (delta 0), reused 0 (delta 0), pack-reused 6
Receiving objects: 100% (6/6), done.
Checking connectivity... done.
Adding remote "src" => "git@github.com:original-owner/test-repo.git"
origin  git@github.com:you/test-repo.git (fetch)
origin  git@github.com:you/test-repo.git (push)
src     git@github.com:original-owner/test-repo.git (fetch)
src     git@github.com:original-owner/test-repo.git (push)
Setting user.name = "you"
Setting user.email = "your@gmail.com"
Executing custom commands...
done
```

## Options

```
ghfork <GitHub project URL>

Options:
  -u, --url         GitHub project URL to fork/clone [prompted if not provided]
  -t, --token       Specify token manually (otherwise auto-retrived)
  -f, --config-file File to save config and token for future (default ~/.ghfork)
  -u, --username    Your GitHub username (only 1st time) [optional: prompted if necessary]
  -p, --password    Your GitHub password (only 1st time) [optional: prompted if necessary]
  -n, --token-note  Note to use when getting token (default "gh-token"). If you're gettig error "already exists", try changing this.
  -r, --remote      Remote name to use for original library (default "src")
  -d, --domain      Use a different domain name than (default "github.com"). In case you use 'acc1.github.com' in your SSH config
  -c, --command     Command to execute after cloning. Inside repo dir with $repo variable name.
```

## Features

### Authentication

Your credentials are used for the first time to receive an authentication token and stored for future use in `~/.ghfork`

### Fork & clone

It uses the [GitHub API][2] to fork, and uses local `git` to do the rest.

### Command

After succesfully cloning it can execute specified commands from inside the repo dir. It also makes the repo name available as an environment variable: `$repo` which you can use in your command:

```
touch $repo.sublime-project && npm i
```

### Config

Settings are saved in config file (`~/.ghfork`) in JSON format on every command invocation.

## Issues

If you get an error like this while logging in:

```json
{"message":"Validation Failed","errors":[{"resource":"OauthAccess","code":"already_exists","field":"description"}],"documentation_url":"https://developer.github.com/v3/oauth_authorizations/#create-a-new-authorization"}
```
It probably means you had logged in before and token has been lost. Try changing the `token-note`

```sh
$ ghfork -n "Some random new token note"
```

  [1]: https://help.github.com/articles/checking-out-pull-requests-locally/
  [2]: https://developer.github.com/v3/repos/forks/#create-a-fork
