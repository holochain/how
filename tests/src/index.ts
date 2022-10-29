import { ActionHash, DnaSource, EntryHash } from "@holochain/client";
import { pause, runScenario, Scenario  } from "@holochain/tryorama";
import { RecordBag, EntryRecord, deserializeHash } from '@holochain-open-dev/utils';

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

    let rootUnit = {
      parents: [], // full paths to parent nodes (remember it's a DAG)
      shortName: "Holochain Community Standards",
      version: "vidx0",
      pathAbbreviation: "", // max 10 char
      stewards: [],  // people who can change this document
      processes: [["soc_proto.procs.define","petition"]], // state-machine definition
      history: {},
      meta: {}
    };

    const rootDoc = {  
      documentType: "_document",
      content: [
        {name: "title", content: "ROOT NODE DOC", sourcePath: "", sectionType:"c", contentType:"text/plain"},
        {name: "summary", content: "{}", sourcePath: "", sectionType:"c", contentType:"text/plain"}
      ],
      editors: [],
      meta: {}
    }

    const initializer = {
      path: "",
      documentType: "_document",
      content: [
        {name: "title", content: "ROOT NODE DOC", sourcePath: "", sectionType:"c", contentType:"text/plain"},
        {name: "summary", content: "{}", sourcePath: "", sectionType:"c", contentType:"text/plain"}
      ],
      editors: [],
      meta: {}
    }
 //   a_and_b_conductor.setSignalHandler((signal) => {
 //     console.log("Received Signal:",signal)
//      t.deepEqual(signal.data.payload.message, { type: 'NewUnit', content: unit1})
 //   })
    try {
      await alice_how.callZome({zome_name:'how', fn_name:'initialize', payload: {units: [["_alive", rootUnit]], documents:[initializer]}} );
    }
    catch (e) {
      console.log("Error in initialize", e)
    }

    let docs:any = await alice_how.callZome({zome_name:'how',fn_name:'get_documents', payload:""} );
    t.equal(docs[0].updatedBy.length, 0)
    t.equal(docs.length, 1)

    // Create a unit and a doc for that unit.
    let unit1 = {
      parents: ["hc_system.conductor.api"], // full paths to parent nodes (remember it's a DAG)
      shortName: "app API",
      version: "vidx1",
      pathAbbreviation: "app", // max 10 char
      stewards: [],  // people who can change this document
      processes: [["soc_proto.procs.define","petition"]], // state-machine definition
      history: {},
      meta: {}
    };
    
    const doc1Path = "hc_system.conductor.api.app"

    const unit1Output:any = await alice_how.callZome({zome_name:'how', fn_name:'create_unit', payload: unit1} );
    t.ok(unit1Output)
    const unit1Hash = serializeHash(unit1Output.info.hash)
    console.log("unit1Hash", unit1Hash);

    let document1 = {  
      unitHash: deserializeHash(unit1Hash),
      documentType: "_document",
      content: [
        {name: "title", content: "The Application API", sourcePath: "", sectionType:"c", contentType:"text/plain"},
        {name: "summary", content: "Some long dummary", sourcePath: "", sectionType:"c", contentType:"text/plain"}
      ],
      state: "define",
      editors: [],
      meta: {}
    }

    const document1Hash = await alice_how.callZome({zome_name:'how', fn_name:'create_document', payload: {path:doc1Path, document:document1}} );
    t.ok(document1Hash)
    console.log("document1Hash", document1Hash);

    docs = await alice_how.callZome({zome_name:'how',fn_name:'get_documents', payload: doc1Path} );
    t.equal(docs.length, 1)
    t.equal(docs[0].hash, document1Hash)

    const units :Array<any> = await alice_how.callZome({zome_name:'how', fn_name:'get_units'} );
    const bag = new RecordBag(units.map((u)=>u.record));
    const entries = bag.entryMap.entries().map(([hash, value])=> {return {hash: serializeHash(hash),value}})
    t.deepEqual(entries, [{hash: entries[0].hash, value: rootUnit}, {hash: unit1Hash, value: unit1}]);

    let newDocHash
    try {
    let tree:any = await alice_how.callZome({zome_name:'how', fn_name:'get_tree'} );
    console.log("Rust tree", tree);
    t.equal(tree.tree.length, 5)
    let jsTree = buildTree(tree.tree,tree.tree[0])
    console.log("JS tree", jsTree)

    const newData = "Update API node content"
    document1.content[0].content = newData
    console.log("document1Hash", document1Hash)
    newDocHash = await alice_how.callZome({zome_name:'how', fn_name:'update_document', payload: {hash: document1Hash, document: document1, path: doc1Path}} );
    tree = await alice_how.callZome({zome_name:'how', fn_name:'get_tree',} );
    console.log("Rust tree 2", tree)

    const node = tree.tree[4].val
    t.equal(newDocHash, serializeHash(node.documents[1]))
    } catch(e) {console.log("error in get_tree", e)}

    docs = await alice_how.callZome({zome_name:'how',fn_name:'get_documents', payload:doc1Path} );
    console.log("DOCS:", docs)
    t.equal(docs[0].updatedBy.length, 1)
    t.equal(serializeHash(docs[0].updatedBy[0]), newDocHash)
    t.equal(docs[1].updatedBy.length, 0)

    t.equal(docs[1].marks.length, 0)
    const markActionHashes = await alice_how.callZome({zome_name:'how', fn_name:'mark_document', payload: [{hash: newDocHash, markType: 1, mark:"good"}]} );
    docs = await alice_how.callZome({zome_name:'how',fn_name:'get_documents', payload:doc1Path} );
    console.log("MARKS:", docs[1].marks)

    t.deepEqual(docs[1].marks[0], {markType: 1, mark:"good", author:aliceAgentKey})

    document1.state= "align"
    try {
      newDocHash = await alice_how.callZome({zome_name:'how', fn_name:'advance_state', payload: {newState: "align", unitHash: unit1Hash, documentHash: document1Hash, document: document1}} );
      const tree:any = await alice_how.callZome({zome_name:'how', fn_name:'get_tree',} );
      t.equal(tree.tree[4].val.units[0].state, 'align')
      t.equal(tree.tree[4].val.documents.length, 3)
      console.log("Rust tree updated node", tree.tree[4].val)

    } catch(e) {console.log("error in advance_state", e)}

    docs = await alice_how.callZome({zome_name:'how',fn_name:'get_documents', payload:doc1Path} );

    const deleteActionHash : ActionHash = await alice_how.callZome({zome_name:'how', fn_name:'delete_document', payload: docs[2].actions[0].hash} );
    docs = await alice_how.callZome({zome_name:'how',fn_name:'get_documents', payload:doc1Path} );
    console.log("DOCS DELETED:", docs)
    t.equal(serializeHash(docs[2].deletedBy[0]),serializeHash(deleteActionHash))

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