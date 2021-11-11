use std::collections::BTreeMap;

use futures::future;
use hdk::prelude::*;
// use holochain::sweettest::SweetConductor;
use holochain::sweettest::*;
use holochain::test_utils::consistency_10s;
use holo_hash::EntryHashB64;

use how::alignment::*;
//use how::tree::*;

const DNA_FILEPATH: &str = "../../workdir/dna/how.dna";

#[tokio::test(flavor = "multi_thread")]
pub async fn test_basics() {
    let (conductors, _agents, apps) = setup_conductors(2).await;

    let conductor_alice = &conductors[0];
    let _conductor_bob = &conductors[1];

    let cells = apps.cells_flattened();
    let cell_alice = cells[0];
    let cell_bob = cells[1];

    /*
    let tree: Tree<(String, String)> = Tree::new_from

    let _ = conductor_alice
    .call(&cell_alice.zome("how"), "init", tree)
    .await;

    let tree_result: Tree = conductor_alice
    .call(&cell_alice.zome("how"), "get_tree", ())
    .await;
 */
    let input = Alignment {
        parents: vec!["hc_system.conductor.api".into()], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "app".into(), // max 10 char
        short_name: "application".into(), // max 25 char
        title: "specification of the holochain conductor api for application access".into(),
        summary: "blah blah".into(),
        stewards: vec![],  // people who can change this document
        procesess: vec!["soc_proto/self/proposal".into()], // paths to process template to use
        history: BTreeMap::new(),
        meta: BTreeMap::new(),
    };

    let hash: EntryHashB64 = conductor_alice
        .call(&cell_alice.zome("how"), "create_alignment", input.clone())
        .await;
    consistency_10s(&[&cell_alice, &cell_bob]).await; 

    let alignments : Vec<AlignmentOutput> = conductor_alice
        .call(
            &cell_alice.zome("how"),
            "get_alignments",
            (),
        )
        .await;
    assert_eq!(alignments[0].hash, hash);
    debug!("{:#?}", alignments)
}

// UTILS:

async fn setup_conductors(n: usize) -> (SweetConductorBatch, Vec<AgentPubKey>, SweetAppBatch) {
    let dna = SweetDnaFile::from_bundle(std::path::Path::new(DNA_FILEPATH))
        .await
        .unwrap();

    let mut conductors = SweetConductorBatch::from_standard_config(n).await;

    let all_agents: Vec<AgentPubKey> =
        future::join_all(conductors.iter().map(|c| SweetAgents::one(c.keystore()))).await;
    let apps = conductors
        .setup_app_for_zipped_agents("app", &all_agents, &[dna])
        .await
        .unwrap();

    conductors.exchange_peer_info().await;
    (conductors, all_agents, apps)
}