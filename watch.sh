#!/bin/bash
set -e
set -u

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

#check for inotifywait
command -v inotifywait >/dev/null 2>&1 || { echo >&2 "inotifywait is required but it's not installed. Try 'apt-get install inotify-tools'?  Aborting."; exit 1; }

#watch and build
while inotifywait -e close_write,moved_to,create $DIR/js $DIR/tmpl; do
  $DIR/build.sh;
done


