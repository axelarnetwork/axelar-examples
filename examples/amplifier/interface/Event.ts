export interface Message {
    destinationAddress: string;
    messageID: string;
    payloadHash: string;
    sourceAddress: string;
    sourceChain: string;
}

export interface Meta {
    finalized: boolean;
    fromAddress: string;
    timestamp: string;
    txID: string;
}

export interface Event {
    destinationChain: string;
    eventID: string;
    message: Message;
    meta: Meta;
    payload: string;
    type: string;
}
