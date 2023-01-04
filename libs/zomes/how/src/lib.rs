use std::collections::BTreeMap;

pub use hdk::prelude::*;
pub use hdk::prelude::Path;
pub use error::{HowError, HowResult};

pub mod error;
pub mod unit;
pub mod document;
pub mod tree;
pub mod signals;
pub mod utils;

use hdk::prelude::holo_hash::AgentPubKeyB64;
use how_core::{Unit, Section, Document};
use unit::create_unit_inner;
use crate::document::{DocumentInput, create_document};

#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
    // grant unrestricted access to accept_cap_claim so other agents can send us claims
    let mut fns = BTreeSet::new();
    fns.insert((zome_info()?.name, "recv_remote_signal".into()));
    create_cap_grant(CapGrantEntry {
        tag: "".into(),
        // empty access converts to unrestricted
        access: ().into(),
        functions: GrantedFunctions::Listed(fns),
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
            let mut sections = Vec::new();
            for mut section in doc.content {
                // if we can't find a source path, then assume that the section was manually entered
                // its source is the document's unit
                if let Some((unit, _)) = units.get(&section.source_path) {
                    section.source_unit = Some(unit.clone());
                } else {
                    section.source_unit = Some(unit_hash.clone());
                }
                sections.push(section);
            }
            let input = DocumentInput {
                path: doc.path.clone(),
                document: Document {
                    unit_hash: unit_hash.clone(),
                    document_type: doc.document_type,
                    state: state.clone(),
                    editors: doc.editors,
                    content: sections,
                    meta: BTreeMap::new(),
                }
            };
            create_document(input)?;
        } else {
            debug!("no unit for document {:?}", doc);
        }
    }
    Ok(())
}
