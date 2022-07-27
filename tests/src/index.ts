import { ActionHash, DnaSource } from "@holochain/client";
import { pause, runScenario, Scenario  } from "@holochain/tryorama";

import test from "tape-promise/tape.js";

import path from 'path'
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dnaPath = path.join(__dirname, "../../dna/workdir/dna/how.dna")

import * as _ from 'lodash'
import { Base64 } from "js-base64";

function serializeHash(hash: Uint8Array): string {
  return `u${Base64.fromUint8Array(hash, true)}`;
}

test("how basic tests", async (t) => {
  await runScenario(async (scenario: Scenario) => {

    const dnas: DnaSource[] = [{ path: dnaPath }];
    const [alice, bobbo] = await scenario.addPlayersWithHapps([dnas, dnas]);
    await scenario.shareAllAgents();

    const [alice_how] = alice.cells;
    const [bobbo_how] = bobbo.cells;
    const boboAgentKey = serializeHash(bobbo.agentPubKey);
    const aliceAgentKey = serializeHash(alice.agentPubKey);

    // Create a alignment
    let alignment1 = {
      parents: ["hc_system.conductor.api"], // full paths to parent nodes (remember it's a DAG)
      shortName: "API",
      pathAbbreviation: "app", // max 10 char
      stewards: [],  // people who can change this document
      processes: [["soc_proto.procs.define","petition"]], // state-machine definition
      history: {},
      meta: {}
    };

    let root = {
      parents: [], // full paths to parent nodes (remember it's a DAG)
      shortName: "Holochain Community Standards",
      pathAbbreviation: "", // max 10 char
      stewards: [],  // people who can change this document
      processes: [["soc_proto.procs.define","petition"]], // state-machine definition
      history: {},
      meta: {}
    };

    const rootDoc = {  
      documentType: "_document",
      content: [
        {name: "title", content: "ROOT NODE DOC", source: "", sectionType:"", contentType:"text/plain"},
        {name: "summary", content: "{}", source: "", sectionType:"", contentType:"text/plain"}
      ],
      state: "define",
      editors: [],
      meta: {}
    }

    const documentSpec = {
      path: "",
      document: rootDoc
    }
 //   a_and_b_conductor.setSignalHandler((signal) => {
 //     console.log("Received Signal:",signal)
//      t.deepEqual(signal.data.payload.message, { type: 'NewAlignment', content: alignment1})
 //   })

    await alice_how.callZome({zome_name:'how', fn_name:'initialize', payload: {alignments: [root], documents:[documentSpec]}} );

    const alignment1_hash = await alice_how.callZome({zome_name:'how', fn_name:'create_alignment', payload: alignment1} );
    t.ok(alignment1_hash)
    console.log("alignment1_hash", alignment1_hash);

    const alignments :Array<any> = await alice_how.callZome({zome_name:'how', fn_name:'get_alignments'} );
    t.deepEqual(alignments, [{hash: alignments[0].hash, content: root}, {hash: alignment1_hash, content: alignment1}]);

    try {
    let tree:any = await alice_how.callZome({zome_name:'how', fn_name:'get_tree'} );
    console.log("Rust tree", tree);
    let jsTree = buildTree(tree.tree,tree.tree[0])
    console.log("JS tree", jsTree)

    const rootDocHash = jsTree.val.documents[0]
    const newData = "Update Root node content"
    rootDoc.content[0].content = newData
    const newDocHash = await alice_how.callZome({zome_name:'how', fn_name:'update_document', payload: {hash: rootDocHash, document: rootDoc, path: ""}} );
    tree = await alice_how.callZome({zome_name:'how', fn_name:'get_tree',} );
    jsTree = buildTree(tree.tree,tree.tree[0])
    t.equal(newDocHash, jsTree.val.documents[1])
    } catch(e) {console.log("error in get_tree", e)}

    let docs = await alice_how.callZome({zome_name:'how',fn_name:'get_documents', payload:""} );
    console.log("DOCS:", docs)

  })
})


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