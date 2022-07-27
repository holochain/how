pub use hdk::prelude::*;
pub use hdk::prelude::Path;
pub use error::{HowError, HowResult};

pub mod error;
pub mod alignment;
pub mod document;
pub mod tree;
pub mod signals;
use how_core::Alignment;
use crate::alignment::create_alignment;
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
pub struct Initialization {
    pub alignments: Vec<Alignment>,
    pub documents: Vec<DocumentInput>,
}

#[hdk_extern]
fn initialize(input: Initialization) -> ExternResult<()> {
    // add progenitor check for call
    for alignment in input.alignments {
        create_alignment(alignment)?;
    }
    for document in input.documents {
        create_document(document)?;
    }
    Ok(())
}
