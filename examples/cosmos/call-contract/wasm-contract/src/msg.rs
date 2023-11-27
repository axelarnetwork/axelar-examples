use cosmwasm_schema::cw_serde;
use cosmwasm_std::Binary;

#[cw_serde]
pub struct InstantiateMsg {
    pub channel: String
}

#[cw_serde]
pub enum ExecuteMsg {
    SendMessageEvm {
        destination_chain: String,
        destination_address: String,
        message: String,
    },
    SendMessageCosmos {
        destination_chain: String,
        destination_address: String,
        message: String,
    },
    ReceiveMessageCosmos {
        sender: String,
        message: String
    },
    ReceiveMessageEvm {
        source_chain: String,
        source_address: String,
        payload: Binary,
    },
}

#[cw_serde]
pub enum QueryMsg {
    GetStoredMessage {},
}

#[cw_serde]
pub struct GetStoredMessageResp {
    pub sender: String,
    pub message: String,
}

#[cw_serde]
pub struct Fee {
    pub amount: String,
    pub recipient: String,
}

#[cw_serde]
pub struct GmpMessage {
    pub destination_chain: String,
    pub destination_address: String,
    pub payload: Vec<u8>,
    #[serde(rename = "type")]
    pub type_: i64,
    pub fee: Option<Fee>,
}
