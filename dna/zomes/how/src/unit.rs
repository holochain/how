pub use hdk::prelude::*;
use holo_hash::{EntryHashB64};
use how_core::{Unit, EntryTypes, LinkTypes};

use crate::error::*;
use crate::signals::*;

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct UnitOutput {
    pub hash: EntryHashB64,
    pub content: Unit,
}


fn get_units_path() -> Path {
    Path::from("units")
}

#[hdk_extern]
pub fn create_unit(input: Unit) -> ExternResult<EntryHashB64> {
    let _action_hash = create_entry(EntryTypes::Unitx(input.clone()))?;
    let tree_paths = input.tree_paths();
    let hash = hash_entry(&input)?;
    emit_signal(&SignalPayload::new(hash.clone().into(), Message::NewUnit(input)))?;
    let path = get_units_path();
    let typed_path = path.clone().into_typed(ScopedLinkType::try_from(LinkTypes::Tree)?);
    typed_path.ensure()?;

    let anchor_hash = path.path_entry_hash()?;
    create_link(anchor_hash, hash.clone(), LinkTypes::Unit, ())?;
    for path in tree_paths {
        let typed_path = path.clone().into_typed(ScopedLinkType::try_from(LinkTypes::Tree)?);
        typed_path.ensure()?;
        create_link(path.path_entry_hash()?, hash.clone(),LinkTypes::Unit, ())?;
    }
    Ok(hash.into())
}

///
#[hdk_extern]
fn get_units(_: ()) -> ExternResult<Vec<UnitOutput>> {
    let path = get_units_path();
    let anchor_hash = path.path_entry_hash()?;
    let units = get_units_inner(anchor_hash)?;
    Ok(units)
}

fn get_units_inner(base: EntryHash) -> HowResult<Vec<UnitOutput>> {
    let links = get_links(base, LinkTypes::Unit, None)?;

    let get_input = links
        .into_iter()
        .map(|link| GetInput::new(link.target.into(), GetOptions::default()))
        .collect();

    let unit_records = HDK.with(|hdk| hdk.borrow().get(get_input))?;

    let unit_entries: Vec<(Unit, Action)> = unit_records
        .into_iter()
        .filter_map(|me| me)
        .filter_map(|record| match record.entry().to_app_option() {
            Ok(Some(g)) => Some((g, record.action().clone())),
            _ => None,
        })
        .collect();

    let mut units = vec![];
    for (a,h) in unit_entries {
        units.push(UnitOutput {
            hash: h.entry_hash().unwrap().clone().into(),
            content: a,
        });
    }
    Ok(units)
}
