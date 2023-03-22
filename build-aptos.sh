# !/bin/bash

source .env

if [[ -z "${APTOS_ADDRESS}" || -z "${APTOS_TOKEN_LINKER_ADDRESS}" ]]; then
    echo "Please set the APTOS_ADDRESS and APTOS_TOKEN_LINKER_ADDRESS environment variables in your .env file."
    echo "You can copy the values from the .env.example file."
    exit 1
fi

aptos move compile --save-metadata --bytecode-version 6 --package-dir examples/aptos/call-contract/modules
aptos move compile --save-metadata --bytecode-version 6 --package-dir examples/aptos/token-linker/modules
