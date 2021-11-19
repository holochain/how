pub use hdk::prelude::*;
use std::collections::BTreeMap;
use holo_hash::{EntryHashB64, AgentPubKeyB64};
pub use hdk::prelude::Path;
use crate::error::*;
use crate::tree::*;

pub const DOC_TEMPLATE:&str = "T";

/// Alignment entry definition
#[hdk_entry(id = "alignment")]
#[derive(Clone)]
pub struct Document {
    pub document_type: String, // template path (i.e. a process template) or "_comment" "_reply", "_template"(or other reserved types which start with _)
    pub editors: Vec<AgentPubKeyB64>,  // people who can change this document, if empty anyone can
    pub content: BTreeMap<String, String>, // semantically identified content components
    pub meta: BTreeMap<String, String>, // semantically identified meta
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct DocumentInput {
    pub path: String,
    pub document: Document,
}

#[hdk_extern]
pub fn create_document(input: DocumentInput) -> ExternResult<EntryHashB64> {
    let _header_hash = create_entry(&input.document)?;
    let path = tree_path(input.path);
    if !path.exists()? {
        return Err(HowError::MissingPath.into());
    }
    let anchor_hash = path.hash()?;
    let hash = hash_entry(&input.document)?;
    create_link(anchor_hash, hash.clone(), LinkTag::new("document"))?;   

    Ok(hash.into())
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct DocumentOutput {
    pub hash: EntryHashB64,
    pub content: Document,
}

#[hdk_extern]
pub fn get_documents(input: String) -> ExternResult<Vec<DocumentOutput>> {
    let path = tree_path(input);
    let documents = get_documents_inner(path.hash()?)?;
    Ok(documents)
}

fn get_documents_inner(base: EntryHash) -> HowResult<Vec<DocumentOutput>> {
    let links = get_links(base, Some(LinkTag::new("document")))?;
    let get_input = links
        .into_iter()
        .map(|link| GetInput::new(link.target.into(), GetOptions::default()))
        .collect();

    let document_elements = HDK.with(|hdk| hdk.borrow().get(get_input))?;

    let document_entries: Vec<Document> = document_elements
        .into_iter()
        .filter_map(|me| me)
        .filter_map(|element| match element.entry().to_app_option() {
            Ok(Some(g)) => Some(g),
            _ => None,
        })
        .collect();

    let mut documents = vec![];
    for e in document_entries {
        documents.push(DocumentOutput {
            hash: hash_entry(&e)?.into(),
            content: e,
        });
    }
    Ok(documents)
}
