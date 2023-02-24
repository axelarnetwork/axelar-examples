use near_sdk::ext_contract;

/// A trait that defines the functions that the gateway contract will have.
#[ext_contract(axelar_gateway)]
pub trait Gateway {
    fn validate_contract_call(
        &mut self,
        command_id: String,
        source_chain: String,
        source_address: String,
        payload_hash: String,
    ) -> bool;

    fn call_contract(
        destination_chain: String,
        destination_contract_address: String,
        payload: String,
    );
}
