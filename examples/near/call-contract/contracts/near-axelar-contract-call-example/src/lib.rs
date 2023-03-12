/*
 * Example of a NEAR contract that supports cross-chain calls from Axelar.
 *
 */

use near_axelar_executable::ethabi::{ParamType, Token};
use near_axelar_executable::utils::{abi_decode, abi_encode};
use near_axelar_executable::{impl_axelar_executable, AxelarExecutable, ContractExecutable};
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::AccountId;
use near_sdk::PanicOnDefault;
use near_sdk::{near_bindgen, Promise};

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct AxelarNearExample {
    pub gateway_account_id: AccountId,
    // Example
    pub value: Option<String>,
    pub source_chain: Option<String>,
    pub source_address: Option<String>,
}

#[near_bindgen]
impl AxelarNearExample {
    #[init]
    pub fn new(gateway_account_id: AccountId) -> Self {
        Self {
            gateway_account_id,
            value: None,
            source_chain: None,
            source_address: None,
        }
    }

    pub fn get_gateway_account_id(&self) -> AccountId {
        self.gateway_account_id.clone()
    }

    pub fn get_value(&self) -> Option<String> {
        self.value.clone()
    }

    pub fn get_source_chain(&self) -> Option<String> {
        self.source_chain.clone()
    }

    pub fn get_source_address(&self) -> Option<String> {
        self.source_address.clone()
    }

    #[payable]
    pub fn set(&mut self, chain: String, destination_address: String, value: String) -> Promise {
        self.value = Some(value.clone());
        let payload = abi_encode(vec![Token::String(value)]);
        self.gateway_call_contract(chain, destination_address, payload)
    }
}

impl ContractExecutable for AxelarNearExample {
    fn _execute(&mut self, source_chain: String, source_address: String, payload: Vec<u8>) {
        let tokens = abi_decode(&payload, &vec![ParamType::String]).unwrap();

        self.value = tokens[0].clone().into_string();
        self.source_chain = Some(source_chain);
        self.source_address = Some(source_address);
    }
}

impl_axelar_executable!(AxelarNearExample, gateway_account_id, _execute);
