use crate::error::*;
use crate::tree::*;
pub use hdk::prelude::Path;
pub use hdk::prelude::*;
use holo_hash::{AgentPubKeyB64, EntryHashB64};
use std::collections::BTreeMap;

pub const DOC_DOCUMENT: &str = "_document";
pub const DOC_COMMENT: &str = "_comment";

pub const SECTION_TYPE_PROCESS: &str = "p";
pub const SECTION_TYPE_REQUIREMENT: &str = "r";
pub const SECTION_TYPE_CONTENT: &str = "";

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct Section {
    pub name: String,
    pub section_type: String,
    pub content_type: String,
    pub content: String,
}
impl Section {
    pub fn new(name: &str, section_type: &str, content_type: &str, content: &str) -> Self {
        Section {
            name: name.into(),
            section_type: section_type.into(),
            content_type: content_type.into(),
            content: content.into(),
        }
    }
}

/// Document entry definition
#[hdk_entry(id = "document")]
#[derive(Clone)]
pub struct Document {
    pub document_type: String, // DOC_TEMPLATE, DOC_DOCUMENT, DOC_COMMENT, ...
    pub state: String,         // name of current process
    pub editors: Vec<AgentPubKeyB64>, // people who can change this document, if empty anyone can
    pub content: Vec<Section>, // semantically identified content components
    pub meta: BTreeMap<String, String>, // semantically identified meta data including state
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct DocumentInput {
    pub path: String,
    pub document: Document,
}

fn link_document(hash: EntryHash, path: String) -> ExternResult<()> {
    let path = tree_path(path);
    if !path.exists()? {
        return Err(HowError::MissingPath.into());
    }
    let anchor_hash = path.path_entry_hash()?;
    create_link(anchor_hash, hash, LinkTag::new("document"))?;
    Ok(())
}

#[hdk_extern]
pub fn create_document(input: DocumentInput) -> ExternResult<EntryHashB64> {
    let _header_hash = create_entry(&input.document)?;
    let hash = hash_entry(&input.document)?;
    link_document(hash.clone(), input.path)?;
    Ok(hash.into())
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct DocumentOutput {
    pub hash: EntryHashB64,
    pub updated: bool,
    pub content: Document,
}

#[hdk_extern]
pub fn get_documents(input: String) -> ExternResult<Vec<DocumentOutput>> {
    let path = tree_path(input);
    let documents = get_documents_inner(path.path_entry_hash()?)?;
    Ok(documents)
}

fn get_documents_inner(base: EntryHash) -> HowResult<Vec<DocumentOutput>> {
    let links = get_links(base, Some(LinkTag::new("document")))?;
    let get_input = links
        .into_iter()
        .map(|link| GetInput::new(link.target.into(), GetOptions::default()))
        .collect();

    let document_elements = HDK.with(|hdk| hdk.borrow().get_details(get_input))?;

    let documents: Vec<DocumentOutput> = document_elements
        .into_iter()
        .filter_map(|me| me)
        .filter_map(|details| match details {
            Details::Entry(EntryDetails { entry, updates, .. }) => {
                let doc = entry.try_into().ok()?;
                let hash = hash_entry(&doc).ok()?;
                Some(DocumentOutput {
                    hash: hash.into(),
                    updated: updates.len() > 0,
                    content: doc,
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
    let element = get(EntryHash::from(input.hash), GetOptions::default())?
        .ok_or(WasmError::Guest(String::from("Document not found")))?;
    let _header_hash = update_entry(element.header_address().clone().into(), &input.document)?;
    let hash = hash_entry(&input.document)?;
    // TODO validate that old doc had the same path, or get the path some other way?
    link_document(hash.clone(), input.path)?;
    return Ok(hash.into());
}
