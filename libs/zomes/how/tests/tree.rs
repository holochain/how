//use holochain::sweettest::*;
use how::tree::*;

#[tokio::test(flavor = "multi_thread")]
pub async fn test_tree_basics() {
    let mut t = Tree::new("".to_string());
    assert_eq!(t.tree.len(), 1);
    let idx = t.insert(0, "test".to_string());
    assert_eq!(idx,1);
    assert_eq!(t.tree.len(), 2);

    let tree = get_tree(());
    debug!("fish: #{:?}", tree);
}