pub use hdk::prelude::*;

pub const TREE_ROOT:&str = "T";

fn build_tree(tree: &mut Tree<String>, node: usize, path: Path) -> ExternResult<()>{
    for tag in path.children()?.into_iter().map(|link| link.tag) {
        let val = Path::try_from(&tag)?;
        let v = val.as_ref();
        let idx = tree.insert(node, String::try_from(&v[v.len()-1])?);
        build_tree(tree, idx, val)?;
    }
    Ok(())
}

#[hdk_extern]
pub fn get_tree(_input: ()) -> ExternResult<Tree<String>> {
    let mut tree = Tree::new(TREE_ROOT.to_string());
    build_tree(&mut tree, 0, Path::from(TREE_ROOT))?;
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
