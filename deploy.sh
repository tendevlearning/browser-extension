#!/usr/bin/env bash
yarn build
zip -q -r -o output.zip ./dist
