use std::collections::BTreeMap;

pub use hdk::prelude::*;
pub use hdk::prelude::Path;
pub use error::{HowError, HowResult};

pub mod error;
pub mod unit;
pub mod document;
pub mod tree;
pub mod signals;
use hdk::prelude::holo_hash::AgentPubKeyB64;
use how_core::{Unit, Section, Document};
use unit::create_unit_inner;
use crate::document::{DocumentInput, create_document};

#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
    // grant unrestricted access to accept_cap_claim so other agents can send us claims
    let mut functions = BTreeSet::new();
    functions.insert((zome_info()?.name, "recv_remote_signal".into()));
    create_cap_grant(CapGrantEntry {
        tag: "".into(),
        // empty access converts to unrestricted
        access: ().into(),
        functions,
    })?;
    Ok(InitCallbackResult::Pass)
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DocumentInitializer {
    pub path: String,
    pub document_type: String,
    pub editors: Vec<AgentPubKeyB64>,
    pub content: Vec<Section>,
 //   pub meta: BTreeMap<String, String>, // semantically identified meta data including state
}
  

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct Initialization {
    pub units: Vec<(String, Unit)>,
    pub documents: Vec<DocumentInitializer>,
}

#[hdk_extern]
fn initialize(input: Initialization) -> ExternResult<()> {
    let mut units: BTreeMap<String, (EntryHash, String)> = BTreeMap::new();
    // add progenitor check for call
    for (state, unit) in input.units {
        let path = unit.path_str()?;
        let unit_output = create_unit_inner(unit, &state)?;
        units.insert(path, (unit_output.info.hash, state));
    }
    for doc in input.documents {
        if let Some((unit_hash, state)) = units.get(&doc.path) {
            let input = DocumentInput {
                path: doc.path.clone(),
                document: Document {
                    unit_hash: unit_hash.clone(),
                    document_type: doc.document_type,
                    state: state.clone(),
                    editors: doc.editors,
                    content: doc.content,
                    meta: BTreeMap::new(),
                }
            };
            create_document(input)?;
        }
    }
    Ok(())
}
