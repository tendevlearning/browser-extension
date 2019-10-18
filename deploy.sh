#!/usr/bin/env bash
yarn build
cd dist
zip -q -r -o chrome.zip *
mv chrome.zip ../chrome.zip
