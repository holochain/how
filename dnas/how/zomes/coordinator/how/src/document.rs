use crate::error::*;
use crate::tree::*;
pub use hdk::prelude::Path;
pub use hdk::prelude::*;
use hdk::prelude::holo_hash::AgentPubKeyB64;
use holo_hash::{EntryHashB64};
use how_integrity::{Document, EntryTypes, LinkTypes};
use crate::utils::*;

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
pub struct Mark {
    mark_type: u8,
    mark: String,
    author: AgentPubKeyB64,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]

pub struct DocumentOutput {
    pub hash: EntryHashB64,
    pub updated_by: Vec<EntryHash>,
    pub deleted_by: Vec<ActionHash>,
    pub content: Document,
    pub actions: Vec<ActionHashed>,
    pub marks: Vec<Mark>,
}

#[hdk_extern]
pub fn get_documents(input: String) -> ExternResult<Vec<DocumentOutput>> {
    let path = tree_path(input);
    let documents = get_documents_inner(path.path_entry_hash()?)?;
    Ok(documents)
}

fn get_documents_inner(base: EntryHash) -> HowResult<Vec<DocumentOutput>> {
    let links = get_links(base, LinkTypes::Document, None)?;

    let mut get_input=  vec!();
    for link in links {
        if let Ok(hash) = AnyDhtHash::try_from(link.target) {
            get_input.push(GetInput::new(hash, GetOptions::default()))
        }
    }

    let document_elements = HDK.with(|hdk| hdk.borrow().get_details(get_input))?;

    let documents: Vec<DocumentOutput> = document_elements
        .into_iter()
        .filter_map(|me| me)
        .filter_map(|details| match details {
            Details::Entry(EntryDetails { entry, updates, actions , deletes, ..}) => {
                let doc = entry.try_into().ok()?;
                let hash = hash_entry(&doc).ok()?;
                let links = get_link_details(hash.clone(), LinkTypes::Mark, None).ok()?;
                let mut marks = vec![];
                for (create,_) in links.into_inner() {
                    let x = create.action();
                    let y = CreateLink::try_from(x.clone()).ok()?;
                    let mut tag_bytes = y.tag.into_inner();
                    let mark_type = tag_bytes.pop().unwrap();
                    let mark = String::from_utf8(tag_bytes)
                    .map_err(|_e| wasm_error!(WasmErrorInner::Guest(String::from("could not convert link tag to string")))).unwrap();
                    
                    marks.push(Mark {
                        mark_type,
                        mark,
                        author: create.action().author().clone().into()
                    });
                }
                Some(DocumentOutput {
                    hash: hash.into(),
                    updated_by: updates.iter().map(|d| d.action().entry_hash().unwrap().clone()).collect(),
                    deleted_by: deletes.iter().map(|d| d.hashed.hash.clone()).collect(),
                    content: doc,
                    actions: actions.into_iter().map(|a| a.hashed.clone()).collect(),
                    marks,
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

#[hdk_extern]
pub fn delete_document(input: ActionHash) -> ExternResult<ActionHash> {
    let _record = get(input.clone(), GetOptions::default())?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from("Document not found"))))?;
    let action_hash = delete_entry(input)?;
    Ok(action_hash)
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct MarkDocumentInput {
    pub hash: EntryHashB64,
    pub mark_type: u8,
    pub mark: String,
}

#[hdk_extern]
pub fn mark_document(marks: Vec<MarkDocumentInput>) -> ExternResult<Vec<ActionHash>> {
    let mut results = vec![];
    for input in marks {
        let _record = get(input.hash.clone(), GetOptions::default())?
            .ok_or(wasm_error!(WasmErrorInner::Guest(String::from("Document not found"))))?;
        let tag = LinkTag::new(input.mark);
        let mut tag_bytes = tag.into_inner();
        tag_bytes.push(input.mark_type);
        let tag = LinkTag::from(tag_bytes);
        let action_hash = create_link_relaxed(input.hash.clone(), input.hash.clone(), LinkTypes::Mark, tag)?;
        results.push(action_hash);
    }
    Ok(results)
}
