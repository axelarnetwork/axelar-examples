/*
 * Axelar ETH utils
 *
 */
use ethabi::decode;
use ethabi::encode;
use ethabi::ParamType;
use ethabi::Token;
use sha3::{Digest, Keccak256};
use uint::hex;

/// It takes a slice of bytes and returns a 32-byte hash
/// Compute the Keccak-256 hash of input bytes.
///
/// Panics if the computed hash is not the expected length (32 bytes).
///
/// Arguments:
///
/// * `bytes`: The bytes to hash.
///
/// Returns:
///
/// A 32 byte array
pub fn keccak256<S>(bytes: S) -> [u8; 32]
where
    S: AsRef<[u8]>,
{
    let hash = Keccak256::digest(bytes.as_ref());
    let hash: [u8; 32] = hash
        .as_slice()
        .try_into()
        .expect("hash is not the correct length");
    hash
}

/// It takes a byte array and a list of expected output types, and returns a list of tokens
///
/// Arguments:
///
/// * `data`: The data to decode.
/// * `expected_output_types`: The types of the values that are expected to be returned.
///
/// Returns:
///
/// A vector of tokens.
pub fn abi_decode(data: &[u8], expected_output_types: &[ParamType]) -> Result<Vec<Token>, String> {
    match decode(expected_output_types, data) {
        Ok(tokens) => Ok(tokens),
        Err(e) => Err(format!("Error decoding ABI-encoded data: {:?}", e)),
    }
}

/// It takes a vector of tokens, encodes them into a byte array, and then converts that byte array into
/// a hex string
///
/// Arguments:
///
/// * `tokens`: A vector of tokens to encode.
///
/// Returns:
///
/// A string of hexadecimal characters.
pub fn abi_encode(tokens: Vec<Token>) -> String {
    let payload = encode(&tokens);
    format!("0x{}", hex::encode::<Vec<u8>>(payload))
}

/// It takes a string, removes the first two characters, and then converts the remaining string into a
/// vector of bytes
///
/// Arguments:
///
/// * `payload`: The payload of the transaction.
///
/// Returns:
///
/// A vector of bytes
pub fn clean_payload(payload: String) -> Vec<u8> {
    let clean_payload = &payload[2..payload.len()];
    hex::decode(clean_payload).unwrap()
}

/// It takes a 32-byte array and returns a hex string
///
/// Arguments:
///
/// * `payload`: [u8; 32] - The payload is a 32 byte array.
///
/// Returns:
///
/// A string
pub fn to_eth_hex_string(payload: [u8; 32]) -> String {
    format!("0x{}", hex::encode(payload))
}
