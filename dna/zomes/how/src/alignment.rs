pub use hdk::prelude::*;
use holo_hash::{EntryHashB64};
use how_core::{Alignment, EntryTypes, LinkTypes};

use crate::error::*;
use crate::signals::*;

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct AlignmentOutput {
    pub hash: EntryHashB64,
    pub content: Alignment,
}


fn get_alignments_path() -> Path {
    Path::from("alignments")
}

#[hdk_extern]
pub fn create_alignment(input: Alignment) -> ExternResult<EntryHashB64> {
    let _action_hash = create_entry(EntryTypes::Alignment(input.clone()))?;
    let tree_paths = input.tree_paths();
    let hash = hash_entry(&input)?;
    emit_signal(&SignalPayload::new(hash.clone().into(), Message::NewAlignment(input)))?;
    let path = get_alignments_path();
    let typed_path = path.clone().into_typed(ScopedLinkType::try_from(LinkTypes::Tree)?);
    typed_path.ensure()?;

    let anchor_hash = path.path_entry_hash()?;
    create_link(anchor_hash, hash.clone(), LinkTypes::Alignment, ())?;
    for path in tree_paths {
        let typed_path = path.clone().into_typed(ScopedLinkType::try_from(LinkTypes::Tree)?);
        typed_path.ensure()?;
        create_link(path.path_entry_hash()?, hash.clone(),LinkTypes::Alignment, ())?;
    }
    Ok(hash.into())
}

///
#[hdk_extern]
fn get_alignments(_: ()) -> ExternResult<Vec<AlignmentOutput>> {
    let path = get_alignments_path();
    let anchor_hash = path.path_entry_hash()?;
    let alignments = get_alignments_inner(anchor_hash)?;
    Ok(alignments)
}

fn get_alignments_inner(base: EntryHash) -> HowResult<Vec<AlignmentOutput>> {
    let links = get_links(base, LinkTypes::Alignment, None)?;

    let get_input = links
        .into_iter()
        .map(|link| GetInput::new(link.target.into(), GetOptions::default()))
        .collect();

    let alignment_records = HDK.with(|hdk| hdk.borrow().get(get_input))?;

    let alignment_entries: Vec<(Alignment, Action)> = alignment_records
        .into_iter()
        .filter_map(|me| me)
        .filter_map(|record| match record.entry().to_app_option() {
            Ok(Some(g)) => Some((g, record.action().clone())),
            _ => None,
        })
        .collect();

    let mut alignments = vec![];
    for (a,h) in alignment_entries {
        alignments.push(AlignmentOutput {
            hash: h.entry_hash().unwrap().clone().into(),
            content: a,
        });
    }
    Ok(alignments)
}
