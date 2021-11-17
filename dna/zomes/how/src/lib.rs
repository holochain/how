pub use hdk::prelude::*;
pub use hdk::prelude::Path;
pub use error::{HowError, HowResult};

pub mod error;
pub mod alignment;
pub mod tree;
pub mod signals;

use crate::alignment::{Alignment, create_alignment};

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

entry_defs![
    Path::entry_def(),
    alignment::Alignment::entry_def()
];

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct Initialization {
    pub alignments: Vec<Alignment>,
}

#[hdk_extern]
fn initialize(input: Initialization) -> ExternResult<()> {
    // add progenitor check for call
    for alignment in input.alignments {
        create_alignment(alignment)?;
    }
    Ok(())
}
