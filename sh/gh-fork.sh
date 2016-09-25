#!/bin/bash

. ./utils.sh
. ./gh-authentication.sh

if [[ -n $1 ]]; then
  url=$1
else
  echo -n "Enter the GitHub URL you want to fork: "
  read url
fi

owner=`echo $url | sed 's/.*github\.com[\/\:]\([a-z0-9]*\)\/[a-z0-9]*.*/\1/'`
repo=`echo $url | sed 's/.*github\.com[\/\:][a-z0-9]*\/\([a-z0-9]*\).*/\1/'`

echo Forking $repo...
curl_output=`gh_request --request POST repos/$owner/$repo/forks`
if [[ ! $curl_output =~ .*$username\/$repo.* ]]; then
  echo Fork error: Couldn\'t find \"$username\/$repo\" in fork API response
  echo Curl output: $curl_output
  exit
fi

url=git@github.com:$username/$repo.git
src=git@github.com:$owner/$repo.git

git clone $url

pushd $repo > /dev/null 2>&1

git config user.name "$username"
git config user.email "$email"

git remote add src $src

git remote -v

touch $repo.sublime-project
