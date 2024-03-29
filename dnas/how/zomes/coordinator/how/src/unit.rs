use std::any::Any;
use std::collections::HashMap;

pub use hdk::prelude::*;
use holo_hash::{EntryHashB64};
use how_integrity::Document;
use how_integrity::{Unit, EntryTypes, LinkTypes};

use crate::document::{update_document, UpdateDocumentInput, _update_document};
use crate::error::*;
//use crate::signals::*;
use crate::tree::{UnitInfo, _get_tree, tree_path, _get_path_tree, tree_path_to_str, PathContent, Node};

pub fn get_units_path() -> Path {
    Path::from("units")
}

pub const START_STATE: &str = "define";
pub const ALIVE_STATE: &str = "_alive";

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct UnitInput {
    pub state: String,
    pub unit: Unit,
}

#[hdk_extern]
pub fn create_unit(input: UnitInput) -> ExternResult<UnitOutput> {
    Ok(create_unit_inner(input.unit, &input.state)?)
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

pub fn create_unit_links(hash: EntryHash, tree_paths: Vec<Path>, state: &str, version: &str, flags: &str)  -> ExternResult<()> {
    let path = get_units_path();
    let typed_path = path.clone().into_typed(ScopedLinkType::try_from(LinkTypes::Tree)?);
    typed_path.ensure()?;

    let anchor_hash = path.path_entry_hash()?;
    let tag = LinkTag::new(String::from(format!("{}-{}-{}", state, version, flags)));

    create_link(anchor_hash, hash.clone(), LinkTypes::Unit, tag.clone())?;
    for path in tree_paths {
        let typed_path = path.clone().into_typed(ScopedLinkType::try_from(LinkTypes::Tree)?);
        typed_path.ensure()?;
        create_link(path.path_entry_hash()?, hash.clone(),LinkTypes::Unit, tag.clone())?;
    }
    Ok(())
}

pub fn create_unit_inner(input: Unit, state: &str) -> ExternResult<UnitOutput> {
    let action_hash = create_entry(EntryTypes::Unitx(input.clone()))?;
    let tree_paths = input.tree_paths();
    let hash = hash_entry(&input)?;
    let maybe_record = get(action_hash, GetOptions::default())?;
    let record = maybe_record.ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
        "Could not get the record created just now"
    ))))?;
    //emit_signal(&SignalPayload::new(hash.clone().into(), Message::NewUnit(record)))?;
    create_unit_links(hash.clone(), tree_paths, state, &input.version, input.flags_str())?;
    Ok(UnitOutput {
        info: UnitInfo {
            hash,
            state: state.into(),
            version: input.version.clone(),
            flags: String::from(input.flags_str()),
        },
        record,
    })
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

pub fn convert_tag(tag: LinkTag) -> ExternResult<(String,String,String)> {
    let tag_string = String::from_utf8(tag.into_inner())
    .map_err(|_e| wasm_error!(WasmErrorInner::Guest(String::from("could not convert link tag to string"))))?;
    let x : Vec<&str>= tag_string.split("-").collect();
    if x.len() != 3 {
        return Err(wasm_error!(WasmErrorInner::Guest(format!("Badly formed link: {:?}", tag_string))));
    }
    let state = x[0].into();
    let version: String = x[1].into();
    let flags: String = x[2].into();
    Ok((state,version,flags))
}

fn get_units_inner(base: EntryHash) -> HowResult<Vec<UnitOutput>> {
    let links = get_links(base, LinkTypes::Unit, None)?;

    let mut unit_infos: HashMap<EntryHash,UnitInfo> = HashMap::new();
    for link in links.clone() {
        let (state, version, flags) = convert_tag(link.tag.clone())?;

        let hash = EntryHash::try_from(link.target).map_err(|e| HowError::HashConversionError)?;
        unit_infos.insert(hash.clone(), UnitInfo {
            hash,
            version,
            state,
            flags,
        });
    }

    let mut get_input=  vec!();
    for link in links {
        if let Ok(hash) = AnyDhtHash::try_from(link.target) {
            get_input.push(GetInput::new(hash, GetOptions::default()))
        }
    }

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
        .to_app_option().map_err(|err| wasm_error!(err))?

        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from("Malformed unit"))))?;
    let mut document = input.document;
    let now = sys_time()?.as_micros(); // we need to do this to make sure that content is distinct in case of moving state back and forth for history.
    document.meta.insert("timestamp".to_string(),now.to_string());
    let new_document = UpdateDocumentInput { 
        hash: input.document_hash.clone(), path: unit.path_str()?, document };
    let new_doc_hash = update_document(new_document)?;
    
    delete_unit_links(hash.clone(), unit.tree_paths())?;

    create_unit_links(hash,unit.tree_paths(), &input.new_state, &unit.version, unit.flags_str())?;
    return Ok(new_doc_hash);
}

pub fn reparent_node(node: Node<PathContent>, from: String, to: String)-> ExternResult<()> {
    let units = node.val.units.clone();
    let current_path = node.val.path;//.clone();
    for unit in units {
        let documents: Vec<HoloHash<holo_hash::hash_type::Entry>> = node.val.documents.clone();

        let (new_unit_output, new_unit) = reparent_unit(&unit, from.clone(), to.clone())?;
        for doc in documents {
            reparent_document(unit.hash.clone(), new_unit_output.info.hash.clone(), &new_unit, doc, current_path.clone(), to.clone())?;
        }
    }
    Ok(())
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct UpdateUnitInput {
    pub hash: EntryHash,
    pub state: String,
    pub unit: Unit,
}
#[hdk_extern]
pub fn update_unit(input: UpdateUnitInput) -> ExternResult<UnitOutput> {
    let record = get(input.hash.clone(), GetOptions::default())?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from("Unit not found"))))?;
    let old_action_hash = record.action_address().clone();
    let old_unit: Unit = record
        .entry()
        .to_app_option().map_err(|err| wasm_error!(err))?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from("Malformed unit"))))?;

    let old_tree_paths = old_unit.tree_paths();
    let new_unit_output = _update_unit(input.hash.clone(), old_action_hash, old_tree_paths.clone(), &input.unit, &input.state)?;

    let old_path = old_unit.path_str()?;
    let new_path = input.unit.path_str()?;
    let new_parent = input.unit.parents[0].clone();
    let sub_tree = _get_path_tree(old_tree_paths[0].clone())?;
    let root = sub_tree.tree[0].clone();
    for doc in root.val.documents {
        reparent_document(input.hash.clone(), new_unit_output.info.hash.clone(), &input.unit, doc, old_path.clone(), new_parent.clone())?;
    }
    let reparenting = new_path != old_path || old_unit.path_abbreviation != input.unit.path_abbreviation;

    if reparenting && sub_tree.tree.len() > 1 {
        for node in sub_tree.tree.into_iter().skip(1) {
            reparent_node(node, old_path.clone(), new_path.clone())?;
        }
    };
    Ok(new_unit_output) 
}

pub fn _update_unit(hash: EntryHash, action_hash: ActionHash, paths: Vec<Path>, new_unit: &Unit, state: &str) -> ExternResult<UnitOutput> {
    delete_unit_links(hash.clone(), paths)?;
    let new_action_hash = update_entry(action_hash, new_unit)?;
    let new_unit_hash = hash_entry(new_unit)?;
    create_unit_links(new_unit_hash.clone(), new_unit.tree_paths(), state, &new_unit.version, new_unit.flags_str())?;
    let maybe_record = get(new_action_hash, GetOptions::default())?;
    let record = maybe_record.ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
        "Could not get the record created just now"
    ))))?;

    Ok(UnitOutput {
        info: UnitInfo {
            hash: new_unit_hash,
            state: state.into(),
            version: new_unit.version.clone(),
            flags: String::from(new_unit.flags_str()),
        },
        record,
    })
}

pub fn reparent_unit(unit_info: &UnitInfo, from: String, to: String)  -> ExternResult<(UnitOutput, Unit)> {
    let record = get(unit_info.hash.clone(), GetOptions::default())?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from("Unit not found"))))?;
    let mut unit: Unit = record
        .entry()
        .to_app_option().map_err(|err| wasm_error!(err))?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from("Malformed unit"))))?;
    let old_paths = unit.tree_paths();
    if let Some(idx) = unit.parents.clone().into_iter().position(|p| {
        p.starts_with(&from)}
    ) {
        unit.parents[idx] = unit.parents[idx].replacen(&from, &to,1);
    }

    let unit_output = _update_unit(unit_info.hash.clone(),record.action_address().clone(), old_paths, &unit, &unit_info.state)?;

    Ok((unit_output,unit))
}

pub fn reparent_document(old_unit_hash: EntryHash,  new_unit_hash: EntryHash, new_unit: &Unit, hash: EntryHash, old_path:String, new_parent: String)  -> ExternResult<()> {
    let record = get(hash.clone(), GetOptions::default())?
    .ok_or(wasm_error!(WasmErrorInner::Guest(String::from("Document not found"))))?;
    let mut document: Document = record
        .entry()
        .to_app_option().map_err(|err| wasm_error!(err))?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from("Malformed document"))))?;

    if document.unit_hash == old_unit_hash {
        document.unit_hash = new_unit_hash;
        let new_path = format!("{}.{}", new_parent, new_unit.path_abbreviation);
        let path = tree_path(old_path);
        let links = get_links(path.path_entry_hash()?, LinkTypes::Document, None)?;

        // delete all the old links at the old path
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
        for input in delete_link_input {
            HDK.with(|hdk| hdk.borrow().delete_link(input))?;
        }

        _update_document( record.action_address().clone().into(), new_path, &document )?;
    }
    Ok(())
}