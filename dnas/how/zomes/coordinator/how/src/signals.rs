use hdk::prelude::*;

use holo_hash::{EntryHashB64, AgentPubKeyB64};


#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
    #[serde(tag = "type", content = "content")]
pub enum Message {
    NewUnit(Record),
}

#[derive(Serialize, Deserialize, Debug)]
    #[serde(rename_all = "camelCase")]
pub struct SignalPayload {
    unit_hash: EntryHashB64,
    message: Message,
}

impl SignalPayload {
   pub fn new(unit_hash: EntryHashB64, message: Message) -> Self {
        SignalPayload {
            unit_hash,
            message,
        }
    }
}

#[hdk_extern]
fn recv_remote_signal(signal: ExternIO) -> ExternResult<()> {
    let sig: SignalPayload = signal.decode().map_err(|e| wasm_error!(e))?;
    debug!("Received signal {:?}", sig);
    Ok(emit_signal(&sig)?)
}

/// Input to the notify call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct NotifyInput {
    pub folks: Vec<AgentPubKeyB64>,
    pub signal: SignalPayload,
}


#[hdk_extern]
fn notify(input: NotifyInput) -> ExternResult<()> {
    let mut folks : Vec<AgentPubKey> = vec![];
    for a in input.folks.clone() {
        folks.push(a.into())
    }
    debug!("Sending signal {:?} to {:?}", input.signal, input.folks);
    send_remote_signal(ExternIO::encode(input.signal).map_err(|e| wasm_error!(e))?,folks)?;
    Ok(())
}
