pub use hdk::prelude::*;
pub use hdk::hash_path::path::TypedPath;
use how_integrity::{TREE_ROOT, LinkTypes};

use crate::{unit::convert_tag, HowError};

#[derive(Clone, Serialize, Deserialize, Debug, PartialEq)]
pub struct UnitInfo {
    pub hash: EntryHash,
    pub version: String,
    pub state: String,
}

#[derive(Clone, Serialize, Deserialize, Debug, Default, PartialEq)]
pub struct Content {
    pub name: String,
    pub units: Vec<UnitInfo>,
    pub documents: Vec<EntryHash>,
}

#[derive(Clone, Debug, Default, PartialEq)]
pub struct PathContent {
    pub path: String,
    pub units: Vec<UnitInfo>,
    pub documents: Vec<EntryHash>,
}


fn get_entry_hashes(path: &Path) -> ExternResult<(Vec<UnitInfo>,Vec<EntryHash>)> {
    let mut units = vec![];
    let mut documents = vec![];
    let links = get_links(path.path_entry_hash()?, vec![LinkTypes::Unit, LinkTypes::Document], None)?;
    for l in links {
        let link_type = LinkTypes::try_from(ScopedLinkType {
            zome_index: l.zome_index,
            zome_type: l.link_type,
        })?;

        let target = l.target.try_into().map_err(|e| HowError::HashConversionError)?;
        match link_type {
            LinkTypes::Document => documents.push(target),
            LinkTypes::Unit => {
                let (state, version) = convert_tag(l.tag)?;
                units.push(UnitInfo{
                    hash: target,
                    version,
                    state});                
            },
            _ => (),
        };
    };
    Ok((units,documents))
}

fn build_tree(tree: &mut Tree<Content>, node: usize, path: Path) -> ExternResult<()>{
    for path in path.into_typed(ScopedLinkType::try_from(LinkTypes::Tree)?).children_paths()? {
        let v = path.as_ref();
        let (units, documents) = get_entry_hashes(&path)?;
        // there may be a path left over from a move that is now empty, so ignore it if there are no units there.
        if units.len() > 0 {
            let val = Content {
                name: String::try_from(&v[v.len()-1]).map_err(|e| wasm_error!(e))?,
                units,
                documents,
            };
            let idx = tree.insert(node, val);
            build_tree(tree, idx, path.path)?;
        }
    }
    Ok(())
}


fn build_path_tree(tree: &mut Tree<PathContent>, node: usize, path: Path) -> ExternResult<()>{
    for path in path.into_typed(ScopedLinkType::try_from(LinkTypes::Tree)?).children_paths()? {
        let path_str : String = path.clone().try_into().map_err(|_e| wasm_error!(WasmErrorInner::Guest(String::from("XXX"))))?;
        let (units, documents) = get_entry_hashes(&path)?;
        if units.len() > 0 {
            let val = PathContent {
                path: path_str,
                units,
                documents,
            };
            let idx = tree.insert(node, val);
            build_path_tree(tree, idx, path.path)?;
        }
    }
    Ok(())
}

pub fn tree_path(path_str: String) -> Path {
    let mut path: String = TREE_ROOT.to_owned(); 
    path.push_str(".");
    path.push_str(&path_str);
    Path::from(path)
}

pub fn tree_path_to_str(path:Path) -> ExternResult<String>  {
    let mut v = path.as_ref().clone();
    v.remove(0);
    let mut x:Vec<String> = Vec::new();
    for c in v {
        x.push(String::try_from(&c).map_err(|e| wasm_error!(e))?);
    }
    Ok(x.join("."))
}

#[hdk_extern]
pub fn get_tree(_input: ()) -> ExternResult<Tree<Content>> {
    let root_path = Path::from(TREE_ROOT);
    _get_tree(root_path)
}

pub fn _get_tree(root_path: Path) -> ExternResult<Tree<Content>> {
    let (units, documents) = get_entry_hashes(&root_path)?;
    let val = Content {
        name: String::from(""),
        units,
        documents,
    };
    let mut tree = Tree::new(val);
    build_tree(&mut tree, 0, root_path)?;
    Ok(tree)
}

pub fn _get_path_tree(root_path: Path) -> ExternResult<Tree<PathContent>> {
    let (units, documents) = get_entry_hashes(&root_path)?;
    let val = PathContent {
        path: tree_path_to_str(root_path.clone())?,
        units,
        documents,
    };
    let mut tree = Tree::new(val);
    build_path_tree(&mut tree, 0, root_path)?;
    Ok(tree)
}


#[derive(Clone, Serialize, Deserialize, Debug, Default)]
pub struct Tree<T> 
where
    T: PartialEq
{
    pub tree: Vec<Node<T>>,
}

impl<T> Tree<T>
where
    T: PartialEq
{
    // create a new tree with a root node at index 0
    pub fn new(root: T) -> Self {
        Self {
            tree: vec![Node::new(0, None, root)]
        }
    }

    // inserts value into parent, return index of new node or 0 if parent doesn't exist
    pub fn insert(&mut self, parent: usize, val: T) -> usize {
        let idx = self.tree.len();
        match self.tree.get_mut(parent) {
            None => 0,
            Some(node) => {
                node.children.push(idx);
                self.tree.push(Node::new(idx, Some(parent), val));
                idx
            }
        }
    }
}

#[derive(Clone, Serialize, Deserialize, Debug, Default)]
pub struct Node<T>
where
    T: PartialEq
{
    pub idx: usize,
    pub val: T,
    pub parent: Option<usize>,
    pub children: Vec<usize>,
}

impl<T> Node<T>
where
    T: PartialEq
{
    fn new(idx: usize, parent: Option<usize>, val: T) -> Self {
        Self {
            idx,
            val,
            parent,
            children: vec![],
        }
    }
}
