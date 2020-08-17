#!/bin/bash

build () {
  cur_dir=$(dirname "$1")
  # pandoc -s -o "$cur_dir/index.html" --template=template.html "$1"
  if [[ "$(uname)" == MSYS* ]]; then
      css=//base.css
  else
      css=/base.css
  fi
  pandoc -s -o "$cur_dir/index.html" --no-highlight --css "$css" "$1"
}

build content/body.md
for body in content/*/body.md; do
  build "$body"
done