
# GitHub Project Forker

Fork a GitHub project from CLI (bash)

It basically

1. Forks the project into your GitHub account
2. Clones it locally
3. Sets up remote such that `origin` points to your fork, and `src` points to original source.

For authentication it uses [GitHub REST API][1]. It asks for your credentials for the first time, uses it to receive an authentication token and stores it for future use in `~/.gh-token`.

  [1]: https://developer.github.com/v3/repos/forks/#create-a-fork

Usage:



```sh
$ gh-fork https://github.com/author/library

  First time, please login
  Enter your GitHub username:me
  Enter host password for user 'me':***
  79f24c87xxxxxxxxxxxxxxxa4d203d75c
  Token saved successfully for future use in ~/.gh-token
  Authentication successfull! Welcome, me <my@email.com>
  Forking library...
  Cloning into 'library'...
  Receiving objects: 100% ..., done.
  origin  git@github.com:me/library.git (fetch)
  origin  git@github.com:me/library.git (push)
  src     git@github.com:author/library.git (fetch)
  src     git@github.com:author/library.git (push)
```

