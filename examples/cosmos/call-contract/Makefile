.PHONY: compile

compile:
	docker run --rm -v ./wasm-contract:/code \
  	--mount type=volume,source="call-contract_cache",target=/code/target \
  	--mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  	cosmwasm/rust-optimizer:0.12.13
