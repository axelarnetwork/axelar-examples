module token_linker::token_linker {
  use std::account::SignerCapability;
  use std::resource_account;
  use std::vector;
  use std::coin;
  use std::signer;
  use std::string::{Self, String};
  use std::error;

  use aptos_std::aptos_hash::keccak256;
  use aptos_std::from_bcs;

  use aptos_framework::account;
  use aptos_framework::event::{Self};
  use aptos_framework::bcs;

  use axelar::axelar_gas_service;
  use axelar::gateway;

  struct State has key {
    receive_token_events: event::EventHandle<ReceiveTokenMessage>,
    send_token_events: event::EventHandle<SendTokenMessage>,
    signer_cap: SignerCapability,
    burn_cap: coin::BurnCapability<Token>,
    freeze_cap: coin::FreezeCapability<Token>,
    mint_cap: coin::MintCapability<Token>,
    ignore_digits: u64,
    evm_chain: String,
    evm_token_linker: String,
  }

  struct ReceiveTokenMessage has drop, store {
    from_message: String,
    to_message: String,
  }
  struct SendTokenMessage has drop, store {
    from_message: String,
    to_message: String,
  }

  struct Token {}

  fun init_module(account: &signer) {
    let (burn_cap, freeze_cap, mint_cap) = coin::initialize<Token>(
      account,
      string::utf8(b"Linked Token"),
      string::utf8(b"LT"),
      6,
      true
    );
    move_to(account, State {
      receive_token_events: account::new_event_handle<ReceiveTokenMessage>(account),
      send_token_events: account::new_event_handle<SendTokenMessage>(account),
      signer_cap: resource_account::retrieve_resource_account_cap(account, @deployer),
      burn_cap,
      freeze_cap,
      mint_cap,
      ignore_digits: 5,
      evm_chain: string::utf8(b""),
      evm_token_linker: string::utf8(b""),
    });
  }

  public entry fun set_params(sender: &signer, evm_chain: String, evm_token_linker: String) acquires State {
    assert!(signer::address_of(sender) == @deployer, error::not_found(1));
    let state = borrow_global_mut<State>(@token_linker);
    state.evm_chain = evm_chain;
    state.evm_token_linker = evm_token_linker;
  }

  fun zero_vector(length: u64): vector<u8> {
    let vec = vector::empty<u8>();
    let i=0;
    while (i < length) {
      vector::push_back(&mut vec, 0);
      i = i+1;
    };
    vec
  }

  fun copy_str(str: &String) : String {
    string::sub_string(str, 0, string::length(str))
  }
  public entry fun send_token(sender: &signer, destination_address: vector<u8>, amount: u64, gas_fee_amount: u64) acquires State{
    let state = borrow_global_mut<State>(@token_linker);
    let coin = coin::withdraw<Token>(sender, amount);

    coin::burn<Token>(coin, &state.burn_cap);
    let payload = zero_vector(32 - vector::length(&destination_address));
    vector::append(&mut payload, destination_address);
    vector::append(&mut payload, zero_vector(24 - state.ignore_digits));
    let amountVec = bcs::to_bytes<u64>(&amount);
    vector::reverse(&mut amountVec);
    vector::append(&mut payload, amountVec);
    vector::append(&mut payload, zero_vector(state.ignore_digits));
    let signer = account::create_signer_with_capability(&state.signer_cap);
    axelar_gas_service::payNativeGasForContractCall(sender, @token_linker, copy_str(&state.evm_chain), copy_str(&state.evm_token_linker), keccak256(payload), gas_fee_amount, signer::address_of(sender));
    gateway::call_contract(&signer, state.evm_chain, state.evm_token_linker, payload);
  }

  fun subvector(vec: &vector<u8>, from: u64, to: u64): vector<u8> {
    let result = vector::empty<u8>();
    let i = from;
    while (i < to) {
      vector::push_back(&mut result, *vector::borrow<u8>(vec, i));
      i = i + 1;
    };
    result
  }
  public entry fun execute(command_id: vector<u8>, payload: vector<u8>) acquires State {
    let state = borrow_global_mut<State>(@token_linker);
    let signer = account::create_signer_with_capability(&state.signer_cap);
    let (_, _, payloadHash) = gateway::validate_contract_call(&signer, command_id);
    assert!(keccak256(payload) == payloadHash, error::not_found(1));
    // convert
    let address = from_bcs::to_address(subvector(&payload, 0, 32));
    let ignore_digits = state.ignore_digits;
    let amount_bytes = subvector(&payload, 56-ignore_digits, 64-ignore_digits);
    vector::reverse<u8>(&mut amount_bytes);
    let amount = from_bcs::to_u64(amount_bytes);

    let coin = coin::mint<Token>(amount, &state.mint_cap);
    coin::deposit(address, coin);
  }

  public entry fun register(account: &signer) {
    coin::register<Token>(account);
  }
}
