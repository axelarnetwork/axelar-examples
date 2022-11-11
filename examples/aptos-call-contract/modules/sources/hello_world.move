module my_account::hello_world {
  use std::string;
  use aptos_std::aptos_hash::keccak256;
  use axelar_framework::gateway;
  use aptos_framework::account;
  use axelar_framework::axelar_gas_service;
  use axelar_framework::executable_registry::ExecuteCapability;
  use aptos_framework::event::{Self};

  struct State has key {
    executable: ExecuteCapability,
  }

  struct MessageHolder has key {
    message: string::String,
    message_change_events: event::EventHandle<MessageChangeEvent>,
  }

  struct MessageChangeEvent has drop, store {
    from_message: string::String,
    to_message: string::String,
  }

  fun init_module(account: &signer) {
    let executable = gateway::register_executable(account);
    move_to(account, State { executable });
    move_to(account, MessageHolder { message: string::utf8(b"hello"), message_change_events: account::new_event_handle<MessageChangeEvent>(account) });
  }

  public entry fun call(sender: &signer, destination_chain: string::String, contract_address: string::String, payload: vector<u8>, fee_amount: u64) acquires State {
    let state = borrow_global_mut<State>(@my_account);
    axelar_gas_service::payNativeGasForContractCall(sender, destination_chain, contract_address, keccak256(payload), fee_amount, @my_account);
    gateway::call_contract_as_contract(&mut state.executable, destination_chain, contract_address, payload);
  }

  public entry fun execute(command_id: vector<u8>, _source_chain: string::String, _source_address: string::String, payload: vector<u8>) acquires State, MessageHolder {
    let state = borrow_global_mut<State>(@my_account);
    gateway::validate_contract_call(&mut state.executable, command_id);

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
