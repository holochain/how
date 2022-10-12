use hdi::prelude::*;
use hdk::hash_path::path::{Component, Path};
use std::collections::BTreeMap;
use holo_hash::{EntryHashB64, AgentPubKeyB64};


type ProcessType = String;
type ProcessName = String;
pub const TREE_ROOT:&str = "T";

#[hdk_entry_helper]
#[serde(rename_all = "camelCase")]
#[derive(Clone)]
pub struct Unit {
    pub parents: Vec<String>, // full paths to parent nodes (remember it's a DAG)
    pub short_name: String,
    pub path_abbreviation: String, // max 10 char
    pub stewards: Vec<AgentPubKeyB64>,  // people who can change this document
    pub processes: Vec<(ProcessType,ProcessName)>, // paths to processes to use
    pub history: BTreeMap<String, EntryHashB64>,
    pub meta: BTreeMap<String, String>, // for UI to do things    pub name: String,
}

impl Unit {
    pub fn tree_paths(&self) -> Vec<Path> {
        let mut paths = Vec::new();
        for parent in &self.parents {
            let mut path = Vec::new();
            path.push(Component::from(TREE_ROOT));
            for c in Path::from(parent).as_ref().into_iter() {
                path.push(c.clone());
            }
            path.push(Component::from(&self.path_abbreviation));
            paths.push(Path::from(path));
        };
        if paths.len() == 0 {
            let mut path = Vec::new();
            path.push(Component::from(TREE_ROOT));
            if self.path_abbreviation != "" {
                path.push(Component::from(&self.path_abbreviation));
            }
            paths.push(Path::from(path));
        }
        paths
    }
}


#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Section {
    pub name: String,
    pub section_type: String,
    pub content_type: String,
    pub source: String,
    pub content: String,
}
impl Section {
    pub fn new(name: &str, section_type: &str, content_type: &str, source: &str, content: &str) -> Self {
        Section {
            name: name.into(),
            section_type: section_type.into(),
            content_type: content_type.into(),
            source: source.into(),
            content: content.into(),
        }
    }
}
/// Document entry definition
#[hdk_entry_helper]
#[derive(Clone)]
#[serde(rename_all = "camelCase")]
pub struct Document {
    pub document_type: String, // DOC_TEMPLATE, DOC_DOCUMENT, DOC_COMMENT, ...
    pub state: String,         // name of current process
    pub editors: Vec<AgentPubKeyB64>, // people who can change this document, if empty anyone can
    pub content: Vec<Section>, // semantically identified content components
    pub meta: BTreeMap<String, String>, // semantically identified meta data including state
}


#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    #[entry_def(required_validations = 5)]
    Unitx(Unit), 
    #[entry_def(required_validations = 5)]
    Document(Document), 
}

#[hdk_link_types]
pub enum LinkTypes {
    Document,
    Unit,
    Tree,
}

#[hdk_extern]
pub fn validate(_op: Op) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}

