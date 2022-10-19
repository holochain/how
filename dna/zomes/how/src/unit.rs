use std::collections::HashMap;

pub use hdk::prelude::*;
use holo_hash::{EntryHashB64};
use how_core::Document;
use how_core::{Unit, EntryTypes, LinkTypes};

use crate::document::{update_document, UpdateDocumentInput};
use crate::error::*;
use crate::signals::*;
use crate::tree::UnitInfo;

pub fn get_units_path() -> Path {
    Path::from("units")
}

pub const START_STATE: &str = "define";
pub const ALIVE_STATE: &str = "_alive";

#[hdk_extern]
pub fn create_unit(input: Unit) -> ExternResult<EntryHashB64> {
    Ok(create_unit_inner(input, START_STATE)?.into())
}

pub fn delete_unit_links(hash: EntryHash, tree_paths: Vec<Path>)  -> ExternResult<()> {
    let path = get_units_path();
    let anchor_hash = path.path_entry_hash()?;
    let links = get_links(anchor_hash, LinkTypes::Unit, None)?;
    let mut delete_link_input: Vec<DeleteLinkInput> = Vec::new();
    let any: AnyLinkableHash = hash.into();
    for l in links {
        if l.target == any {
            delete_link_input.push(DeleteLinkInput{
                address: l.create_link_hash,
                chain_top_ordering: ChainTopOrdering::Relaxed,
            });
        }
    }
    for path in tree_paths {
        let links = get_links(path.path_entry_hash()?, LinkTypes::Unit, None)?;
        for l in links {
            if l.target == any {
                delete_link_input.push(DeleteLinkInput{
                    address: l.create_link_hash,
                    chain_top_ordering: ChainTopOrdering::Relaxed,
                });
            }
        }
    }

    for input in delete_link_input {
        HDK.with(|hdk| hdk.borrow().delete_link(input))?;
    } 

    Ok(())
}

pub fn create_unit_links(hash: EntryHash, tree_paths: Vec<Path>, state: &str, version: &str)  -> ExternResult<()> {
    let path = get_units_path();
    let typed_path = path.clone().into_typed(ScopedLinkType::try_from(LinkTypes::Tree)?);
    typed_path.ensure()?;

    let anchor_hash = path.path_entry_hash()?;
    let tag = LinkTag::new(String::from(format!("{}-{}", state, version)));

    create_link(anchor_hash, hash.clone(), LinkTypes::Unit, tag.clone())?;
    for path in tree_paths {
        let typed_path = path.clone().into_typed(ScopedLinkType::try_from(LinkTypes::Tree)?);
        typed_path.ensure()?;
        create_link(path.path_entry_hash()?, hash.clone(),LinkTypes::Unit, tag.clone())?;
    }
    Ok(())
}

pub fn create_unit_inner(input: Unit, state: &str) -> ExternResult<EntryHash> {
    let action_hash = create_entry(EntryTypes::Unitx(input.clone()))?;
    let tree_paths = input.tree_paths();
    let hash = hash_entry(&input)?;
    let maybe_record = get(action_hash, GetOptions::default())?;
    let record = maybe_record.ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
        "Could not get the record created just now"
    ))))?;
    emit_signal(&SignalPayload::new(hash.clone().into(), Message::NewUnit(record)))?;
    create_unit_links(hash.clone(), tree_paths, state, &input.version)?;
    Ok(hash)
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]

pub struct UnitOutput {
    pub info: UnitInfo,
    pub record: Record,
}

///
#[hdk_extern]
fn get_units(_: ()) -> ExternResult<Vec<UnitOutput>> {
    let path = get_units_path();
    let anchor_hash = path.path_entry_hash()?;
    let units = get_units_inner(anchor_hash)?;
    Ok(units)
}

pub fn convert_tag(tag: LinkTag) -> ExternResult<(String,String)> {
    let tag_string = String::from_utf8(tag.into_inner())
    .map_err(|_e| wasm_error!(WasmErrorInner::Guest(String::from("could not convert link tag to string"))))?;
    let x : Vec<&str>= tag_string.split("-").collect();
    if x.len() != 2 {
        return Err(wasm_error!(WasmErrorInner::Guest(format!("Badly formed link: {:?}", tag_string))));
    }
    let state = x[0].into();
    let version = x[1].into();
    Ok((state,version))
}

fn get_units_inner(base: EntryHash) -> HowResult<Vec<UnitOutput>> {
    let links = get_links(base, LinkTypes::Unit, None)?;

    let mut unit_infos: HashMap<EntryHash,UnitInfo> = HashMap::new();
    for link in links.clone() {
        let (state, version) = convert_tag(link.tag.clone())?;
        unit_infos.insert(link.target.clone().into(), UnitInfo {
            hash: link.target.into(),
            version,
            state});
    }

    let get_input = links
        .into_iter()
        .map(|link| GetInput::new(link.target.into(), GetOptions::default()))
        .collect();

    let unit_records = HDK.with(|hdk| hdk.borrow().get(get_input))?.into_iter()
    .filter_map(|me| me)
    .map(|record| {
        let hash = record.action().entry_hash().unwrap().clone();
        UnitOutput{
            info: unit_infos.remove(&hash).unwrap(),
            record,}
        }
     )
    .collect();
    Ok(unit_records)
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AdvanceStateInput {
    pub new_state: String,
    pub unit_hash: EntryHash,
    pub document_hash: EntryHashB64,
    pub document: Document,
}
#[hdk_extern]
pub fn advance_state(input: AdvanceStateInput) -> ExternResult<EntryHashB64> {
    let hash = EntryHash::from(input.unit_hash);
    let record = get(hash.clone(), GetOptions::default())?
         .ok_or(wasm_error!(WasmErrorInner::Guest(String::from("Unit not found"))))?;
    let unit: Unit = record
        .entry()
        .to_app_option().map_err(|err| wasm_error!(err.into()))?

        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from("Malformed unit"))))?;
    let new_doc_hash = update_document(UpdateDocumentInput { 
        hash: input.document_hash.clone(), path: unit.path_str()?, document: input.document })?;
    
    delete_unit_links(hash.clone(), unit.tree_paths())?;
    create_unit_links(hash,unit.tree_paths(), &input.new_state, &unit.version)?;
    return Ok(new_doc_hash);
}
