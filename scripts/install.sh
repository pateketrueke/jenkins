#!/bin/bash

# this is used on Jenkins only
if [[ ! -z "$JENKINS_URL" ]]; then
  npm prune
  npm install
fi
