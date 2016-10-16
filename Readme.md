# GitHub Project Forker

I got sick of doing these 4 things over and over again so I made this CLI tool.

When I fork a GitHub project, I usually do the following:

1. Fork it on GitHub

    Original: `https://github.com/original-author/some-library`

    Forked: `https://github.com/my-username/some-library`

2. Clone **my** fork locally

    ```sh
    git clone git@github.com:my-username/some-library.git
    ```
    I usually clone my own fork, so that "origin" (remote name) points to it and I can push changes to it which automatically show up as prompts to make new pull requests on the original author's library.

3. Set up original remote

    Then I set up the original remote as "src"

    ```sh
    git remote add src git@github.com:original-author/some-library.git
    ```

    So that I can still pull any future updates or fetch other pull requests from the original source:

  ```sh
  git pull src master
  git fetch src pull/42/head:pull_request_#42
  ```

4. Initialize with some commands

    Lastly I initialize the proejct with some usual commands

    ```sh
    code.exe . && npm link
    ```

**ghfork** does exactly all this.

It uses the [GitHub API][1] to fork\*, and uses local `git` to do the rest.
<sup>\*It asks for your credentials for the first time, uses it to receive an authentication token and stores it for future use in ~/.ghfork.</sup>

  [1]: https://developer.github.com/v3/repos/forks/#create-a-fork


## Installation

```sh
npm install -g ghfork
```

## Usage:

#### First time use

Set up your GitHub login and other config.

```sh
$ ghfork
Welcome! Please login to your GitHub account
Enter your username: hunter
Enter your password: *******
Authenticating...
Welcome, AzureDiamond <your@email.com>
Config saved succesfully to file "~/.ghfork"
Clone a GitHub URL? [y] n
Edit the config? [y] y
Set a different token note? ["Token for ghfork"]:
Set a different name for original remote? [src]:
Set a different domain name? [github.com]:
Set a command to run after cloning?: echo done
Config saved succesfully to file "~/.ghfork"
```

You can run `ghfork` without a URL any time to set up this config.

#### Subsequent use

Just tell it the URL to fork & clone

```sh
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

```sh
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

Settings are saved in config file (`~/.ghfork`) in JSON format.
