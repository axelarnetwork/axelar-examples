/// Sui half of the call-contract example: holds a string and swaps it with a
/// contract on an EVM chain.
module hello_world::hello_world {
    use axelar_gateway::{channel::{Self, Channel, ApprovedMessage}, gateway::{Self, Gateway}};
    use gas_service::gas_service::GasService;
    use relayer_discovery::{discovery::RelayerDiscovery, transaction};
    use std::ascii::{Self, String};
    use sui::{coin::Coin, event, sui::SUI};

    /// Shared object holding this package's cross-chain identity and the last
    /// message it received. Other chains address `channel`, not the package id.
    public struct Singleton has key {
        id: UID,
        channel: Channel,
        source_chain: String,
        source_address: String,
        value: vector<u8>,
    }

    public struct Executed has copy, drop {
        source_chain: String,
        source_address: String,
        payload: vector<u8>,
    }

    fun init(ctx: &mut TxContext) {
        transfer::share_object(Singleton {
            id: object::new(ctx),
            channel: channel::new(ctx),
            source_chain: ascii::string(b""),
            source_address: ascii::string(b""),
            value: vector[],
        });
    }

    /// The address the EVM side must send to.
    public fun channel_address(self: &Singleton): address {
        self.channel.to_address()
    }

    public fun value(self: &Singleton): vector<u8> {
        self.value
    }

    /// Tell the relayer which Move call consumes messages addressed to our
    /// Channel. Without this, inbound messages are undeliverable and nothing
    /// reports an error.
    ///
    /// Argument prefixes come from relayer_discovery: 2 is the ApprovedMessage
    /// the relayer injects, 0 marks an object followed by its id.
    public fun register_transaction(discovery: &mut RelayerDiscovery, singleton: &Singleton) {
        // Intentionally permissionless, and that is safe here: every value in
        // the registered transaction is derived from `singleton` itself, so a
        // caller can only re-register the one correct transaction for this
        // Channel. There is no caller-supplied data to substitute.
        let mut singleton_arg = vector[0u8];
        singleton_arg.append(object::id_address(singleton).to_bytes());

        let transaction = transaction::new_transaction(
            true,
            vector[
                transaction::new_move_call(
                    transaction::new_function(
                        transaction::package_id<Singleton>(),
                        ascii::string(b"hello_world"),
                        ascii::string(b"execute"),
                    ),
                    vector[vector[2u8], singleton_arg],
                    vector[],
                ),
            ],
        );

        discovery.register_transaction(&singleton.channel, transaction);
    }

    /// Sui -> EVM.
    public fun set_remote_value(
        singleton: &Singleton,
        gateway: &Gateway,
        gas_service: &mut GasService,
        destination_chain: String,
        destination_address: String,
        payload: vector<u8>,
        refund_address: address,
        gas: Coin<SUI>,
    ) {
        // Demo only - this shouldn't be used as-is in production: `Singleton`
        // is a shared object, so any Sui account can send from this Channel.
        // The destination sees source_address = this Channel's address, which
        // proves the message came from this package but not which account sent
        // it, so a destination that allowlists this Channel trusts every Sui
        // account equally. Gate sending behind a capability, or carry an
        // authenticated sender the destination can check.
        let message_ticket = gateway::prepare_message(
            &singleton.channel,
            destination_chain,
            destination_address,
            payload,
        );

        gas_service.pay_gas(&message_ticket, gas, refund_address, vector[]);
        gateway.send_message(message_ticket);
    }

    /// EVM -> Sui. Invoked by the relayer via the transaction registered above.
    public fun execute(approved_message: ApprovedMessage, singleton: &mut Singleton) {
        let (source_chain, _message_id, source_address, payload) = singleton
            .channel
            .consume_approved_message(approved_message);

        // Demo only - this shouldn't be used as-is in production:
        // consume_approved_message only proves the gateway approved a message
        // addressed to THIS Channel. It does not prove who sent it. Validate
        // source_chain/source_address against a trusted sender before acting.
        singleton.source_chain = source_chain;
        singleton.source_address = source_address;
        singleton.value = payload;

        event::emit(Executed { source_chain, source_address, payload });
    }
}
