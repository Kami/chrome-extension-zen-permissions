#!/usr/bin/env bash

if [ ! -d "extension/assets/compiled/" ]; then
    mkdir extension/assets/compiled/
fi

handlebars extension/templates/*.handlebars -f extension/assets/compiled/templates.js
