import { Orchestrator, Config, InstallAgentsHapps } from '@holochain/tryorama'
import path from 'path'
import * as _ from 'lodash'
import { RETRY_DELAY, RETRY_COUNT, localConductorConfig, networkedConductorConfig, installAgents, awaitIntegration, delay } from './common'
import { Base64 } from "js-base64";

function serializeHash(hash: Uint8Array): string {
  return `u${Base64.fromUint8Array(hash, true)}`;
}
export default async (orchestrator) => {

  orchestrator.registerScenario('how basic tests', async (s, t) => {
    // Declare two players using the previously specified config, nicknaming them "alice" and "bob"
    // note that the first argument to players is just an array conductor configs that that will
    // be used to spin up the conductor processes which are returned in a matching array.
    const [a_and_b_conductor] = await s.players([localConductorConfig])


    // Create a alignment
    let alignment1 = {
      parents: ["hc_system.conductor.api"], // full paths to parent nodes (remember it's a DAG)
      short_name: "API",
      path_abbreviation: "app", // max 10 char
      stewards: [],  // people who can change this document
      required_sections: [],
      processes: [["soc_proto.procs.define","petition"]], // state-machine definition
      history: {},
      meta: {}
    };

    let root = {
      parents: [], // full paths to parent nodes (remember it's a DAG)
      short_name: "Holochain Community Standards",
      path_abbreviation: "", // max 10 char
      stewards: [],  // people who can change this document
      required_sections: [],
      processes: [["soc_proto.procs.define","petition"]], // state-machine definition
      history: {},
      meta: {}
    };

    const rootDoc = {  
      document_type: "_document",
      content: [
        {name: "title", content: "ROOT NODE DOC", content_type:"text/plain"},
        {name: "summary", content: "{}", content_type:"text/plain"}
      ],
      state: "define",
      editors: [],
      meta: {}
    }

    const documentSpec = {
      path: "",
      document: rootDoc
    }
    a_and_b_conductor.setSignalHandler((signal) => {
      console.log("Received Signal:",signal)
//      t.deepEqual(signal.data.payload.message, { type: 'NewAlignment', content: alignment1})
    })

    // install your happs into the conductors and destructuring the returned happ data using the same
    // array structure as you created in your installation array.
    let [alice_how_happ/*, bobbo_how_happ*/] = await installAgents(a_and_b_conductor, ["alice"/*, 'bobbo'*/])
    const [alice_how] = alice_how_happ.cells
//    const [bobbo_how] = bobbo_how_happ.cells

    await alice_how.call('how', 'initialize', {alignments: [root], documents:[documentSpec]} );

    const alignment1_hash = await alice_how.call('how', 'create_alignment', alignment1 );
    t.ok(alignment1_hash)
    console.log("alignment1_hash", alignment1_hash);

    const alignments = await alice_how.call('how', 'get_alignments', null );
    t.deepEqual(alignments, [{hash: alignments[0].hash, content: root}, {hash: alignment1_hash, content: alignment1}]);

    let tree = await alice_how.call('how', 'get_tree', null );
    console.log("Rust tree", tree);
    let jsTree = buildTree(tree.tree,tree.tree[0])
    console.log("JS tree", jsTree)

    const rootDocHash = jsTree.val.documents[0]
    const newData = "Update Root node content"
    rootDoc.content[0].content = newData
    const newDocHash = await alice_how.call('how', 'update_document', {hash: rootDocHash, document: rootDoc, path: ""} );

    tree = await alice_how.call('how', 'get_tree', null );
    jsTree = buildTree(tree.tree,tree.tree[0])
    t.equal(newDocHash, jsTree.val.documents[1])

    let docs = await alice_how.call('how', 'get_documents', "" );
    console.log("DOCS:", docs)

  })
}

type RustNode = {
  idx: number,
  val: any,
  parent: null | number,
  children: Array<number>
}
type Node = {
  val: any,
  children: Array<Node>
}

function buildTree(tree: Array<RustNode>, node: RustNode): Node {
  let t: Node = {val: node.val, children: []}
  for (const n of node.children) {
    t.children.push(buildTree(tree, tree[n]))
  }
  return t
}