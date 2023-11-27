use cosmwasm_schema::cw_serde;
use cw_storage_plus::Item;

#[cw_serde]
pub struct Message {
    pub sender: String,
    pub message: String,
}

pub const STORED_MESSAGE: Item<Message> = Item::new("storedmessage");
