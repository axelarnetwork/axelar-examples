module my_account::hello_world {
  use std::string;
  use aptos_std::aptos_hash::keccak256;
  use axelar::gateway;
  use aptos_framework::account;
  use axelar::axelar_gas_service;
  use aptos_framework::event::{Self};
  use std::error;

  struct MessageHolder has key {
    message: string::String,
    message_change_events: event::EventHandle<MessageChangeEvent>,
  }

  struct MessageChangeEvent has drop, store {
    from_message: string::String,
    to_message: string::String,
  }

  fun init_module(account: &signer) {
    move_to(account, MessageHolder { message: string::utf8(b"hello"), message_change_events: account::new_event_handle<MessageChangeEvent>(account) });
  }

  public entry fun call(sender: &signer, destination_chain: string::String, contract_address: string::String, payload: vector<u8>, fee_amount: u64) {
    axelar_gas_service::payNativeGasForContractCall(sender, @my_account, destination_chain, contract_address, keccak256(payload), fee_amount, @my_account);
    gateway::call_contract(sender, destination_chain, contract_address, payload);
  }

  public entry fun execute(sender: &signer, command_id: vector<u8>, payload: vector<u8>) acquires MessageHolder {
    let (_,_, payloadHash) = gateway::validate_contract_call(sender, command_id);
    assert!(payloadHash == keccak256(payload), error::not_found(1));
    // convert
    let message = string::utf8(payload);
    let old_message_holder = borrow_global_mut<MessageHolder>(@my_account);
    let from_message = *&old_message_holder.message;
    event::emit_event(&mut old_message_holder.message_change_events, MessageChangeEvent {
        from_message,
        to_message: copy message,
    });
    old_message_holder.message = message;
  }
}
