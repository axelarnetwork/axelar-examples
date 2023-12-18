use cosmwasm_std::{coin, Addr, Binary, Coin, Uint128};
use cw_multi_test::{App, BankKeeper, BasicAppBuilder, ContractWrapper, Executor};
use ethabi::{encode, Token};

use crate::contract::*;
use crate::msg::*;

// helper function to setup environment and deploy contracts
fn make_contracts() -> (App, Addr) {
    // create app environment with 100 "native" token minted to "user"
    let bank = BankKeeper::new();
    let mut app = BasicAppBuilder::new_custom()
        .with_bank(bank)
        .build(|router, _, storage| {
            router
                .bank
                .init_balance(storage, &Addr::unchecked("user"), vec![coin(100, "native")])
                .unwrap();
        });

    // create SendReceive smart contract
    let code = ContractWrapper::new(execute, instantiate, query);
    let code_id = app.store_code(Box::new(code));
    let send_receive = app
        .instantiate_contract(
            code_id,
            Addr::unchecked("owner"),
            &InstantiateMsg {},
            &[],
            "SendReceive",
            None,
        )
        .unwrap();

    (app, send_receive)
}

#[test]
#[should_panic(expected = "Cannot execute Stargate")] // cw_multi_test does not support Stargate Messages: https://github.com/CosmWasm/cw-multi-test/issues/37
fn send_evm() {
    let (mut app, send_receive) = make_contracts();

    // To be used to pay for gas
    let funds = Coin {
        denom: "native".to_string(),
        amount: Uint128::new(1),
    };

    app.execute_contract(
        Addr::unchecked("user"),
        send_receive.clone(),
        &ExecuteMsg::SendMessageEvm {
            destination_chain: "destination_chain".to_string(),
            destination_address: "destination_address".to_string(),
            message: "message".to_string(),
        },
        &[funds],
    )
    .unwrap();
}

#[test]
fn receive_evm() {
    let (mut app, send_receive) = make_contracts();

    // generate message payload
    let payload = encode(&vec![
        Token::String("sender".to_string()),
        Token::String("message".to_string()),
    ]);

    // mimic GMP message
    app.execute_contract(
        Addr::unchecked("user"),
        send_receive.clone(),
        &ExecuteMsg::ReceiveMessageEvm {
            source_chain: "source_chain".to_string(),
            source_address: "source_address".to_string(),
            payload: Binary::from(payload.clone()),
        },
        &[],
    )
    .unwrap();

    // check stored message
    let resp: GetStoredMessageResp = app
        .wrap()
        .query_wasm_smart(send_receive.clone(), &QueryMsg::GetStoredMessage {})
        .unwrap();
    assert_eq!(resp.sender, "sender".to_string());
    assert_eq!(resp.message, "message".to_string());
}

#[test]
#[should_panic(expected = "Cannot execute Stargate")] // cw_multi_test does not support Stargate Messages: https://github.com/CosmWasm/cw-multi-test/issues/37
fn send_cosmos() {
    let (mut app, send_receive) = make_contracts();

    // To be used to pay for gas
    let funds = Coin {
        denom: "native".to_string(),
        amount: Uint128::new(1),
    };

    app.execute_contract(
        Addr::unchecked("user"),
        send_receive.clone(),
        &ExecuteMsg::SendMessageCosmos {
            destination_chain: "destination_chain".to_string(),
            destination_address: "destination_address".to_string(),
            message: "message".to_string(),
        },
        &[funds],
    )
    .unwrap();
}

#[test]
fn receive_cosmos() {
    let (mut app, send_receive) = make_contracts();

    // mimic GMP message
    app.execute_contract(
        Addr::unchecked("user"),
        send_receive.clone(),
        &ExecuteMsg::ReceiveMessageCosmos {
            sender: "sender".to_string(),
            message: "message".to_string(),
        },
        &[],
    )
    .unwrap();

    // check stored message
    let resp: GetStoredMessageResp = app
        .wrap()
        .query_wasm_smart(send_receive.clone(), &QueryMsg::GetStoredMessage {})
        .unwrap();
    assert_eq!(resp.sender, "sender".to_string());
    assert_eq!(resp.message, "message".to_string());
}
