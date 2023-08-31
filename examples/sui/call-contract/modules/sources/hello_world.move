module sui_example::hello_world {
  use std::string::{utf8, String};
  use sui::object::{Self, ID, UID};
  use sui::transfer;
  use sui::hex::{decode};
  use sui::event::emit;
  use axelar::gateway;
  use sui::tx_context::{TxContext};

  struct MessageChangeEvent has copy, drop {
    id: ID,
    updated_message: String,
  }

  struct ContractCall has copy, drop {
    source: vector<u8>,
    destination_chain: vector<u8>,
    destination_address: vector<u8>,
    payload: vector<u8>,
  }

  struct MessageHolder has key {
    id: UID,
    message: String,
  }

  fun init(tx: &mut TxContext) {
    let msg_holder = MessageHolder {
      id: object::new(tx),
      message: utf8(b"init"),
    };

    emit(MessageChangeEvent {
      id: object::uid_to_inner(&msg_holder.id),
      updated_message: msg_holder.message,
    });

    transfer::share_object(msg_holder);
  }

  public fun get_message(messageHolder: &MessageHolder): String {
    messageHolder.message
  }

  public entry fun call(destination_chain: vector<u8>, destination_address: vector<u8>, payload: vector<u8>, _fee_amount: u64) {
    gateway::call_contract(destination_chain, destination_address, payload);
  }

  public entry fun execute(_command_id: vector<u8>, _source_chain: String, _source_address: String, payload: vector<u8>, ctx: &mut TxContext) {
    let message = utf8(decode(payload));
    let event = MessageHolder {
      id: object::new(ctx),
      message
    };

    emit(MessageChangeEvent {
      id: object::uid_to_inner(&event.id),
      updated_message: event.message,
    });

    transfer::share_object(event);
  }
}
