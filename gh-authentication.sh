#!/bin/bash

token_file=~/.gh-token
token_note=gh-token12313

if [[ -f $token_file ]]; then
  token=`cat $token_file`
  token_read_from_file=true
else
  echo First time, please login
  echo -n "Enter your GitHub username:"
  read username

  curl_output=`gh_request --data "'{\"scopes\":[\"public_repo\",\"user:email\"],\"note\":\"$token_note\"}'" authorizations`

  if [[ $curl_output =~ .*error.* ]]; then
    echo Authentication error: Got an error message \while trying to get a token via \'/authorizations\' API
    echo Curl output: $curl_output
    exit
  fi
  extract_value_from_json "$curl_output" token
  token=`extract_value_from_json "$curl_output" token`
  echo $token>$token_file
  echo Token saved successfully for future use in $token_file
fi

if [[ -z $token || $token =~ .*([^a-z0-9]).* ]]; then
  echo Authentication error: Couldn\'t get a valid token
  echo Token received: $token
  if [[ -n $curl_output ]]; then
    echo Curl output: $curl_output
  fi
  echo Try deleting $token_file
  exit
fi

curl_output=`gh_request user`
username=`extract_value_from_json "$curl_output" login`
if [[ -z $username || $username =~ .*([^a-z0-9]).* ]]; then
  echo Authentication error: Couldn\'t get a valid username via \'/user\' API
  echo Token used: $token
  echo Username received: $username
  echo Try deleting $token_file
  echo Curl output: $curl_output
  exit
fi

curl_output=`gh_request user/emails`
email=`extract_value_from_json "$curl_output" email`

echo Authentication successfull! Welcome, $username \<$email\>
