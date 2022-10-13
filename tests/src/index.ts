import { ActionHash, DnaSource } from "@holochain/client";
import { pause, runScenario, Scenario  } from "@holochain/tryorama";
import { RecordBag, EntryRecord } from '@holochain-open-dev/utils';

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

    // Create a unit
    let unit1 = {
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
//      t.deepEqual(signal.data.payload.message, { type: 'NewUnit', content: unit1})
 //   })

    await alice_how.callZome({zome_name:'how', fn_name:'initialize', payload: {units: [root], documents:[documentSpec]}} );

    const unit1_hash = await alice_how.callZome({zome_name:'how', fn_name:'create_unit', payload: unit1} );
    t.ok(unit1_hash)
    console.log("unit1_hash", unit1_hash);

    const units :Array<any> = await alice_how.callZome({zome_name:'how', fn_name:'get_units'} );
    const bag = new RecordBag(units);
    const entries = bag.entryMap.entries().map(([hash, value])=> {return {hash: serializeHash(hash),value}})
    t.deepEqual(entries, [{hash: entries[0].hash, value: root}, {hash: unit1_hash, value: unit1}]);


    let docs:any = await alice_how.callZome({zome_name:'how',fn_name:'get_documents', payload:""} );
    t.equal(docs[0].updatedBy.length, 0)
    t.equal(docs.length, 1)

    let newDocHash
    try {
    let tree:any = await alice_how.callZome({zome_name:'how', fn_name:'get_tree'} );
    console.log("Rust tree", tree);
    let jsTree = buildTree(tree.tree,tree.tree[0])
    console.log("JS tree", jsTree)

    const rootDocHash = jsTree.val.documents[0]
    const newData = "Update Root node content"
    rootDoc.content[0].content = newData
    newDocHash = await alice_how.callZome({zome_name:'how', fn_name:'update_document', payload: {hash: rootDocHash, document: rootDoc, path: ""}} );
    tree = await alice_how.callZome({zome_name:'how', fn_name:'get_tree',} );
    jsTree = buildTree(tree.tree,tree.tree[0])
    t.equal(newDocHash, jsTree.val.documents[1])
    } catch(e) {console.log("error in get_tree", e)}

    docs = await alice_how.callZome({zome_name:'how',fn_name:'get_documents', payload:""} );
    console.log("DOCS:", docs)
    t.equal(docs[0].updatedBy.length, 1)
    t.equal(serializeHash(docs[0].updatedBy[0]), newDocHash)
    t.equal(docs[1].updatedBy.length, 0)

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