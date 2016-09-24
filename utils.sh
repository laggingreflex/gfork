
function extract_value_from_json () {
  # Extracts value for a key from json
  # Usage:
  #   1. store the json output in a variable
  #     json_output=`curl /some-api`  (store the json output in a variable)
  #   2. use it with "surrounding quotes"
  #     extract_value_from_json "$json_output" key

  local json=$1
  local key=$2
  local regex=${3-"a-z0-9\@\."}

  echo $json | sed "s/.*\"$key\": \"\([$regex]*\)\".*/\1/"
}


api_base=https://api.github.com
function gh_request () {
  local args_length=$(($#-1))
  if [[ $args_length < 0 ]]; then
    echo Invalid arguments to request
    return
  elif [[ $args_length == 0 ]]; then
    local path=$api_base/$1
  else
    local args=${@:1:$#-1}
    local path=$api_base/${!#}
  fi
  # echo $args_length-1
  echo args_length = $args_length
  echo args = $args
  echo path = $path
  # exit

  if [[ -n $token ]]; then
    eval "curl -s $args -H \"Authorization: token $token\" \"$path\""
  elif [[ -n $username ]]; then
    eval "curl -s $args --user \"$username\" \"$path\""
  else
    eval "curl -s $args \"$path\""
  fi
}
