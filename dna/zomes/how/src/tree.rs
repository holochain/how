pub use hdk::prelude::*;
use holo_hash::EntryHashB64;

pub const TREE_ROOT:&str = "T";

#[derive(Clone, Serialize, Deserialize, Debug, Default, PartialEq)]
pub struct Content {
    name: String,
    alignments: Vec<EntryHashB64>,
    documents: Vec<EntryHashB64>,
}

fn get_entry_hashes(path: &Path, tag: LinkTag) -> ExternResult<Vec<EntryHashB64>> {
    let links = get_links(path.path_entry_hash()?, Some(tag))?;
    let entry_hashes = links.into_iter().map(|l| l.target.as_hash().clone().into()).collect();
    Ok(entry_hashes)
}

fn build_tree(tree: &mut Tree<Content>, node: usize, path: Path) -> ExternResult<()>{

    for path in path.children_paths()? {
        let v = path.as_ref();
        let val = Content {
            name: String::try_from(&v[v.len()-1])?,
            alignments: get_entry_hashes(&path, LinkTag::new("alignment"))?,
            documents: get_entry_hashes(&path, LinkTag::new("document"))?,
        };
        let idx = tree.insert(node, val);
        build_tree(tree, idx, path)?;
    }
    Ok(())
}

pub fn tree_path(path_str: String) -> Path {
    let mut path: String = TREE_ROOT.to_owned(); 
    path.push_str(".");
    path.push_str(&path_str);
    Path::from(path)
}

#[hdk_extern]
pub fn get_tree(_input: ()) -> ExternResult<Tree<Content>> {
    let root_path = Path::from(TREE_ROOT);
    let val = Content {
        name: String::from(""),
        alignments: get_entry_hashes(&root_path, LinkTag::new("alignment"))?,
        documents: get_entry_hashes(&root_path, LinkTag::new("document"))?,
    };
    let mut tree = Tree::new(val);
    build_tree(&mut tree, 0, root_path)?;
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
    idx: usize,
    val: T,
    parent: Option<usize>,
    children: Vec<usize>,
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
