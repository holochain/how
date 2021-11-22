import { EntryHashB64, HeaderHashB64, AgentPubKeyB64, serializeHash } from '@holochain-open-dev/core-types';
import { CellClient } from '@holochain-open-dev/cell-client';
import { writable, Writable, derived, Readable, get } from 'svelte/store';

import { HowService } from './how.service';
import {
  Dictionary,
  Alignment,
  RustNode,
  Node,
  Initialization,
  Document,
  DocumentOutput,
} from './types';
import {
  ProfilesStore,
} from "@holochain-open-dev/profiles";

const areEqual = (first: Uint8Array, second: Uint8Array) =>
      first.length === second.length && first.every((value, index) => value === second[index]);

export class HowStore {
  /** Private */
  private service : HowService
  private profiles: ProfilesStore
  
  /** AlignmentEh -> Alignment */
  private alignmentsStore: Writable<Dictionary<Alignment>> = writable({});
  private documentsStore: Writable<Dictionary<Document>> = writable({});
  private alignmentsPathStore: Writable<Dictionary<string>> = writable({});
  private treeStore: Writable<Node> = writable({val:{name:"T", alignments: [], documents: []}, children:[], id:"0"});
  private documentPathStore: Writable<Dictionary<Array<DocumentOutput>>> = writable({});

  /** Static info */
  myAgentPubKey: AgentPubKeyB64;

  /** Readable stores */
  public alignments: Readable<Dictionary<Alignment>> = derived(this.alignmentsStore, i => i)
  public documents: Readable<Dictionary<Document>> = derived(this.documentsStore, i => i)
  public alignmentsPath: Readable<Dictionary<string>> = derived(this.alignmentsPathStore, i => i)
  public tree: Readable<Node> = derived(this.treeStore, i => i)
  public documentPaths: Readable<Dictionary<Array<DocumentOutput>>> = derived(this.documentPathStore, i => i)
  public processes: Readable<Node|undefined> = derived(this.treeStore, i => this.find(i,"soc_proto.self".split(".")))
  
  constructor(
    protected cellClient: CellClient,
  profilesStore: ProfilesStore,
  zomeName = 'how'
  ) {
    this.myAgentPubKey = serializeHash(cellClient.cellId[1]);
    this.profiles = profilesStore;
    this.service = new HowService(cellClient, zomeName);

    cellClient.addSignalHandler( signal => {
      if (! areEqual(cellClient.cellId[0],signal.data.cellId[0]) || !areEqual(cellClient.cellId[1], signal.data.cellId[1])) {
        return
      }
      console.log("SIGNAL",signal)
      const payload = signal.data.payload
      switch(payload.message.type) {
      case "NewAlignment":
        if (!get(this.alignments)[payload.alignmentHash]) {
          this.updateAlignmentFromEntry(payload.alignmentHash, payload.message.content)
        }
        break;
      }
    })
  }

  private others(): Array<AgentPubKeyB64> {
    return Object.keys(get(this.profiles.knownProfiles)).filter((key)=> key != this.myAgentPubKey)
  }

  private updateAlignmentFromEntry(hash: EntryHashB64, alignment: Alignment) {
    this.alignmentsPathStore.update(alignments => {
      const path = alignment.parents.length>0 ? `${alignment.parents[0]}.${alignment.path_abbreviation}` : alignment.path_abbreviation
      alignments[path] = hash
      return alignments
    })
    this.alignmentsStore.update(alignments => {
      alignments[hash] = alignment
      return alignments
    })
  }

  async pullAlignments() : Promise<Dictionary<Alignment>> {
    const alignments = await this.service.getAlignments();
    for (const s of alignments) {
      this.updateAlignmentFromEntry(s.hash, s.content)
    }
    return get(this.alignmentsStore)
  }

  private updateDocuments(path: string, doc: DocumentOutput)  {
    this.documentPathStore.update(documents => {
      if (!documents[path]) {
        documents[path] = [doc]
      }
      else {
        if (documents[path].find(e=>e.hash == doc.hash) == undefined) {
          documents[path].push(doc)
        }
      }
      return documents
    })
    this.documentsStore.update(documents => {
      documents[doc.hash] = doc.content
      return documents
    })
  }
  
  async pullDocuments(path: string) : Promise<Array<DocumentOutput>> {
    const documents = await this.service.getDocuments(path)
    for (const s of documents) {
      this.updateDocuments(path, s)
    }
    return get(this.documentPathStore)[path]
  }

  buildTree(tree: Array<RustNode>, node: RustNode): Node {
    let t: Node = {val: node.val, children: [], id: `${node.idx}`}
    for (const n of node.children) {
      t.children.push(this.buildTree(tree, tree[n]))
    }
    return t
  }

  private find(tree: Node, path: Array<string>): Node | undefined {
    const node = tree.children.find(n=> {console.log(path[0], n.val.name); return path[0]==n.val.name})
    if (!node) return undefined
    path.shift()
    if (path.length == 0) return node
    return this.find(node, path)
  }

  findInTree(path: string): Node | undefined {
    return this.find(get(this.treeStore), path.split("."))
  }

  async pullProfiles() : Promise<void> {
    this.profiles.fetchAllProfiles()
  }

  async pullTree() : Promise<Node> {
    const rtree: Array<RustNode> = await this.service.getTree();
    const node: Node = this.buildTree(rtree, rtree[0])
    this.treeStore.update(tree => {
      tree = node
      return tree
    })
    return get(this.treeStore)
  }

  async addAlignment(alignment: Alignment) : Promise<EntryHashB64> {
    const alignmentEh: EntryHashB64 = await this.service.createAlignment(alignment)
    this.alignmentsStore.update(alignments => {
      alignments[alignmentEh] = alignment
      return alignments
    })
    this.service.notify({alignmentHash:alignmentEh, message: {type:"NewAlignment", content:alignment}}, this.others());
    return alignmentEh
  }

  async initilize(input: Initialization) : Promise<void> {
    await this.service.initialize(input)
  }

  alignment(alignmentEh: EntryHashB64): Alignment {
    return get(this.alignmentsStore)[alignmentEh];
  }

  async addDocument(path: string, document: Document) : Promise<EntryHashB64> {
    return await this.service.createDocument({path, document})
  }
}
