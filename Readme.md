# GitHub Project Forker

Fork a GitHub project from CLI

It basically:

1. Forks a project into your GitHub account
2. Clones it locally
3. Sets up remote such that `origin` points to your fork, and `src` points to original source.

For authentication it uses [GitHub REST API][1]. It asks for your credentials for the first time, uses it to receive an authentication token and stores it for future use in `~/.gh-token`.

  [1]: https://developer.github.com/v3/repos/forks/#create-a-fork

##Installation

```sh
npm install -g ghfork
```

##Usage:

```sh
ghfork <GitHub Library URL>

Options:
  -u, --url         GitHub Library URL to fork/clone [prompted if not supplied]
  -t, --token       Specify token manually (otherwise auto-retrived)
  -f, --token-file  File to save token for future (default ~/.gh-token)
  -u, --username    Your GitHub username (only 1st time) [optional: prompted if necessary]
  -p, --password    Your GitHub password (only 1st time) [optional: prompted if necessary]
  -n, --token-note  Note to use when getting token (default "gh-token")
  -r, --remote      Remote name to use for original library (default "src")
  -d, --domain      Use a different domain name than (default "github.com"). In case you use 'acc1.github.com' in your SSH config
```

##Example

```sh
$ ghfork https://github.com/some-author/some-library

  Getting token from file ~/.gh-token...
  Authenticating...
  Welcome, your-username <your@email.com>
  Forking some-author/some-library...
  Cloning git@github.com:your-username/some-library.git...
  Adding remote "src" => "git@github.com:some-author/some-library.git"
  Setting user.name = "your-username"
  Setting user.email = "your@email.com"
  done
```

