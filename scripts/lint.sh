#!/usr/bin/env bash

node_modules/.bin/jshint $(find ./extension/assets/js/ -maxdepth 1 -type f -name "*.js") --config .jshint.json
exit $?
