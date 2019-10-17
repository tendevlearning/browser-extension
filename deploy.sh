#!/usr/bin/env bash
yarn build
zip -q -r -o chrome.zip ./dist
