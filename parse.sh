#!/bin/bash

file=$1

node -e 'Script = require("./build/runtime/Script").Script; console.log(util.inspect(Script.fromFile("'$file'"), { depth: null, colors: true, customInspect: false }))'

