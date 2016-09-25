# GitHub Project Forker

When I fork a GitHub project, I usually do the following:

1. Fork

  Original: https://github.com/original-author/some-library

  Forked: https://github.com/my-username/some-library

2. Clone

  ```sh
  git clone git@github.com:my-username/some-library.git
  ```
  I usually clone my own fork, so that "origin" (remote name) points to it and I can push changes to it which automatically show up as prompts to make new pull requests on the original author's library.

3. Set up remote

  Then I set up the original remote as "src"

  ```sh
  git remote add src git@github.com:original-author/some-library.git
  ```

  So that I can still pull any future updates or fetch other pull requests from the original source:

  ```sh
  git pull src master
  git fetch src pull/42/head:pull_request_#42
  ```

**ghfork** does exactly all this!

It uses the [GitHub REST API][1] to fork on your behalf\*, and uses local `git` to do the rest.

<sup>\* It asks for your credentials for the first time, uses it to receive an authentication token and stores it for future use in `~/.gh-token`.</sup>

  [1]: https://developer.github.com/v3/repos/forks/#create-a-fork

##Installation

```sh
npm install -g ghfork
```

##Usage:

```sh
ghfork <GitHub project URL>

Options:
  -u, --url         GitHub project URL to fork/clone [prompted if not provided]
  -t, --token       Specify token manually (otherwise auto-retrived)
  -f, --token-file  File to save token for future (default ~/.gh-token)
  -u, --username    Your GitHub username (only 1st time) [optional: prompted if necessary]
  -p, --password    Your GitHub password (only 1st time) [optional: prompted if necessary]
  -n, --token-note  Note to use when getting token (default "gh-token"). If you're gettig error "already exists", try changing this.
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

