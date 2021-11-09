pub use hdk::prelude::*;
use std::collections::BTreeMap;
use holo_hash::EntryHashB64;

use crate::error::*;
use crate::signals::*;

/// Alignment entry definition
#[hdk_entry(id = "alignment")]
#[derive(Clone)]
pub struct Alignment {
    pub parent: Vec<String>, // full paths to parent nodes (remember it's a DAG)
    pub path_abbreviation: String, // max 10 char
    pub short_name: String, // max 25 char
    pub title: String,
    pub summary: String,
    pub stewards: Vec<AgentPubKey>,  // people who can change this document
    pub procesess: Vec<String>, // paths to process template to use
    pub history: BTreeMap<String, EntryHash>,
    pub meta: BTreeMap<String, String>, // for UI to do things    pub name: String,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct AlignmentOutput {
    pub hash: EntryHashB64,
    pub content: Alignment,
}


fn get_alignments_path() -> Path {
    Path::from("alignments")
}

#[hdk_extern]
fn create_alignment(input: Alignment) -> ExternResult<EntryHashB64> {
    let _header_hash = create_entry(&input)?;
    let hash = hash_entry(input.clone())?;
    emit_signal(&SignalPayload::new(hash.clone().into(), Message::NewAlignment(input)))?;
    let path = get_alignments_path();
    path.ensure()?;
    let anchor_hash = path.hash()?;
    create_link(anchor_hash, hash.clone(), ())?;
    Ok(hash.into())
}

///
#[hdk_extern]
fn get_alignments(_: ()) -> ExternResult<Vec<AlignmentOutput>> {
    let path = get_alignments_path();
    let anchor_hash = path.hash()?;
    let alignments = get_alignments_inner(anchor_hash)?;
    Ok(alignments)
}

fn get_alignments_inner(base: EntryHash) -> HowResult<Vec<AlignmentOutput>> {
    let links = get_links(base, None)?;

    let get_input = links
        .into_iter()
        .map(|link| GetInput::new(link.target.into(), GetOptions::default()))
        .collect();

    let alignment_elements = HDK.with(|hdk| hdk.borrow().get(get_input))?;

    let alignment_entries: Vec<Alignment> = alignment_elements
        .into_iter()
        .filter_map(|me| me)
        .filter_map(|element| match element.entry().to_app_option() {
            Ok(Some(g)) => Some(g),
            _ => None,
        })
        .collect();

    let mut alignments = vec![];
    for e in alignment_entries {
        alignments.push(AlignmentOutput {
            hash: hash_entry(&e)?.into(),
            content: e,
        });
    }
    Ok(alignments)
}
