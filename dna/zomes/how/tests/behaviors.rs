use std::collections::BTreeMap;

use futures::future;
use hdk::prelude::*;
// use holochain::sweettest::SweetConductor;
use holochain::sweettest::*;
use holochain::test_utils::consistency_10s;

use how::alignment::*;

const DNA_FILEPATH: &str = "../../workdir/dna/how.dna";

#[tokio::test(flavor = "multi_thread")]
pub async fn test_basics() {
    let (conductors, _agents, apps) = setup_conductors(2).await;

    let conductor_alice = &conductors[0];
    let _conductor_bob = &conductors[1];

    let cells = apps.cells_flattened();
    let cell_alice = cells[0];
    let cell_bob = cells[1];

    let input = Alignment {
        name: "fish".into(),
        meta: BTreeMap::new(),
    };

    let _: EntryHash = conductor_alice
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