# !/bin/bash

aptos move compile --save-metadata --bytecode-version 6 --package-dir examples/aptos/call-contract/modules
aptos move compile --save-metadata --bytecode-version 6 --package-dir examples/aptos/token-linker/modules
