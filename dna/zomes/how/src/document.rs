use crate::error::*;
use crate::tree::*;
pub use hdk::prelude::Path;
pub use hdk::prelude::*;
use holo_hash::{EntryHashB64};
use how_core::{Document, EntryTypes, LinkTypes};

pub const DOC_DOCUMENT: &str = "_document";
pub const DOC_COMMENT: &str = "_comment";

pub const SECTION_TYPE_PROCESS: &str = "p";
pub const SECTION_TYPE_REQUIREMENT: &str = "r";
pub const SECTION_TYPE_CONTENT: &str = "";

pub const SECTION_SRC_PROCESS: &str = "p";
pub const SECTION_SRC_REQUIREMENT: &str = "r";
pub const SECTION_SRC_MANUAL: &str = "m";


#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct DocumentInput {
    pub path: String,
    pub document: Document,
}

fn link_document(hash: EntryHash, path: String) -> ExternResult<()> {
    let path = tree_path(path);
//    if !path.exists()? {
//        return Err(HowError::MissingPath.into());
//    }
    let anchor_hash = path.path_entry_hash()?;
    create_link(anchor_hash, hash, LinkTypes::Document, ())?;
    Ok(())
}

#[hdk_extern]
pub fn create_document(input: DocumentInput) -> ExternResult<EntryHashB64> {
    let _action_hash = create_entry(EntryTypes::Document(input.document.clone()))?;
    let hash = hash_entry(&input.document)?;
    link_document(hash.clone(), input.path)?;
    Ok(hash.into())
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]

pub struct DocumentOutput {
    pub hash: EntryHashB64,
    pub updated_by: Vec<EntryHash>,
    pub content: Document,
    pub actions: Vec<Action>,
}

#[hdk_extern]
pub fn get_documents(input: String) -> ExternResult<Vec<DocumentOutput>> {
    let path = tree_path(input);
    let documents = get_documents_inner(path.path_entry_hash()?)?;
    Ok(documents)
}

fn get_documents_inner(base: EntryHash) -> HowResult<Vec<DocumentOutput>> {
    let links = get_links(base, LinkTypes::Document, None)?;
    let get_input = links
        .into_iter()
        .map(|link| GetInput::new(link.target.into(), GetOptions::default()))
        .collect();

    let document_elements = HDK.with(|hdk| hdk.borrow().get_details(get_input))?;

    let documents: Vec<DocumentOutput> = document_elements
        .into_iter()
        .filter_map(|me| me)
        .filter_map(|details| match details {
            Details::Entry(EntryDetails { entry, updates, actions , ..}) => {
                let doc = entry.try_into().ok()?;
                let hash = hash_entry(&doc).ok()?;
                Some(DocumentOutput {
                    hash: hash.into(),
                    updated_by: updates.iter().map(|d| d.action().entry_hash().unwrap().clone()).collect(),
                    content: doc,
                    actions: actions.into_iter().map(|a| a.action().clone()).collect(),
                })
            }
            _ => None,
        })
        .collect();

    Ok(documents)
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct UpdateDocumentInput {
    pub hash: EntryHashB64,
    pub path: String,
    pub document: Document,
}
#[hdk_extern]
pub fn update_document(input: UpdateDocumentInput) -> ExternResult<EntryHashB64> {
    let record = get(EntryHash::from(input.hash), GetOptions::default())?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from("Document not found"))))?;
    let _action_hash = update_entry(record.action_address().clone().into(), &input.document)?;
    let hash = hash_entry(&input.document)?;
    // TODO validate that old doc had the same path, or get the path some other way?
    link_document(hash.clone(), input.path)?;
    return Ok(hash.into());
}
