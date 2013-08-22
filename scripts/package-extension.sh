#!/usr/bin/env bash

DIRNAME=$(readlink -f "$(dirname "$(readlink -f "${0}")")/../extension/")

# Compile templates
./scripts/compile-templates.sh

# Package extension
google-chrome --pack-extension=${DIRNAME}
