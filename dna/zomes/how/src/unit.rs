pub use hdk::prelude::*;
use holo_hash::{EntryHashB64};
use how_core::{Unit, EntryTypes, LinkTypes};

use crate::error::*;
use crate::signals::*;

fn get_units_path() -> Path {
    Path::from("units")
}

pub const START_STATE: &str = "define";
pub const ALIVE_STATE: &str = "_alive";

#[hdk_extern]
pub fn create_unit(input: Unit) -> ExternResult<EntryHashB64> {
    create_unit_inner(input, START_STATE)
}

pub fn create_unit_inner(input: Unit, state: &str) -> ExternResult<EntryHashB64> {
    let action_hash = create_entry(EntryTypes::Unitx(input.clone()))?;
    let tree_paths = input.tree_paths();
    let hash = hash_entry(&input)?;
    let maybe_record = get(action_hash, GetOptions::default())?;
    let record = maybe_record.ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
        "Could not get the record created just now"
    ))))?;
    emit_signal(&SignalPayload::new(hash.clone().into(), Message::NewUnit(record)))?;
    let path = get_units_path();
    let typed_path = path.clone().into_typed(ScopedLinkType::try_from(LinkTypes::Tree)?);
    typed_path.ensure()?;

    let anchor_hash = path.path_entry_hash()?;
    let tag = LinkTag::new(String::from(format!("{}-{}", state, input.version)));

    create_link(anchor_hash, hash.clone(), LinkTypes::Unit, tag.clone())?;
    for path in tree_paths {
        let typed_path = path.clone().into_typed(ScopedLinkType::try_from(LinkTypes::Tree)?);
        typed_path.ensure()?;
        create_link(path.path_entry_hash()?, hash.clone(),LinkTypes::Unit, tag.clone())?;
    }
    Ok(hash.into())
}

///
#[hdk_extern]
fn get_units(_: ()) -> ExternResult<Vec<Record>> {
    let path = get_units_path();
    let anchor_hash = path.path_entry_hash()?;
    let units = get_units_inner(anchor_hash)?;
    Ok(units)
}

fn get_units_inner(base: EntryHash) -> HowResult<Vec<Record>> {
    let links = get_links(base, LinkTypes::Unit, None)?;

    let get_input = links
        .into_iter()
        .map(|link| GetInput::new(link.target.into(), GetOptions::default()))
        .collect();

    let unit_records: Vec<Record> = HDK.with(|hdk| hdk.borrow().get(get_input))?.into_iter()
    .filter_map(|me| me).collect();
    Ok(unit_records)
}
