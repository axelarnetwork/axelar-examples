# !/bin/bash

aptos move compile --save-metadata --package-dir examples/aptos-call-contract/modules
aptos move compile --save-metadata --package-dir examples/aptos-token-linker/modules
