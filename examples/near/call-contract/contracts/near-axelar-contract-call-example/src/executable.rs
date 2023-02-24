use near_sdk::{Promise, PromiseError};

/// This is a trait that is implemented by the contract and provides a contract-specific way to execute a command.
pub trait ContractExecutable {
    fn _execute(&mut self, source_chain: String, source_address: String, payload: Vec<u8>);
}

/// A trait that is implemented by the contract and is used by the gateway contract to call the contract.
pub trait AxelarExecutable {
    fn gateway_call_contract(
        &self,
        destination_chain: String,
        destination_contract_address: String,
        payload: String,
    ) -> Promise;

    fn execute(
        &mut self,
        command_id: String,
        source_chain: String,
        source_address: String,
        payload: String,
    ) -> Promise;

    fn execute_callback(
        &mut self,
        source_chain: String,
        source_address: String,
        payload: String,
        call_result: Result<bool, PromiseError>,
    );
}

/// A macro that is used to implement the AxelarExecutable trait for the contract.
#[macro_export]
macro_rules! impl_axelar_executable {
    ($contract: ident, $gateway_account_id: ident, $_execute: ident) => {
        use near_sdk::*;
        use $crate::utils::*;

        #[near_bindgen]
        impl AxelarExecutable for $contract {
            fn gateway_call_contract(
                &self,
                destination_chain: String,
                destination_contract_address: String,
                payload: String,
            ) -> Promise {
                axelar_gateway::ext(self.$gateway_account_id.clone())
                    .with_static_gas(Gas(5 * TGAS))
                    .call_contract(destination_chain, destination_contract_address, payload)
            }

            #[payable]
            fn execute(
                &mut self,
                command_id: String,
                source_chain: String,
                source_address: String,
                payload: String,
            ) -> Promise {
                let keccak_payload = keccak256(clean_payload(payload.clone()));
                let payload_hash = to_eth_hex_string(keccak_payload);

                axelar_gateway::ext(self.$gateway_account_id.clone())
                    .with_static_gas(Gas(5 * TGAS))
                    .with_attached_deposit(0)
                    .validate_contract_call(
                        command_id.clone(),
                        source_chain.clone(),
                        source_address.clone(),
                        payload_hash.clone(),
                    )
                    .then(
                        Self::ext(env::current_account_id())
                            .with_static_gas(Gas(5 * TGAS))
                            .execute_callback(
                                source_chain.clone(),
                                source_address.clone(),
                                payload.clone(),
                            ),
                    )
            }

            #[private]
            fn execute_callback(
                &mut self,
                source_chain: String,
                source_address: String,
                payload: String,
                #[callback_result] call_result: Result<bool, near_sdk::PromiseError>,
            ) {
                if call_result.is_err() {
                    let a = call_result.unwrap_err();
                    env::panic_str(&format!("Error: {:?}", a));
                }

                if call_result.unwrap() == false {
                    env::panic_str("Not approved by gateway");
                }

                let clean_payload = clean_payload(payload.clone());

                self.$_execute(source_chain, source_address, clean_payload);
            }
        }
    };
}
