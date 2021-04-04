#!/bin/bash

build () {
  cur_dir=$(dirname "$1")
  pandoc -s -o "$cur_dir/index.html" --template=template.html \
    --css /base.css "$1"
}

build content/body.md
for body in content/*/body.md; do
  build "$body"
done