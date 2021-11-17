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
  private treeStore: Writable<Node> = writable({val:{name:"T", alignments: []}, children:[], id:"0"});

  /** Static info */
  myAgentPubKey: AgentPubKeyB64;

  /** Readable stores */
  public alignments: Readable<Dictionary<Alignment>> = derived(this.alignmentsStore, i => i)
  public tree: Readable<Node> = derived(this.treeStore, i => i)
  
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

  private async updateAlignmentFromEntry(hash: EntryHashB64, alignment: Alignment): Promise<void>   {
    this.alignmentsStore.update(alignments => {
      alignments[hash] = alignment
      return alignments
    })
  }

  async pullAlignments() : Promise<Dictionary<Alignment>> {
    const alignments = await this.service.getAlignments();
    //console.log({alignments})
    for (const s of alignments) {
      await this.updateAlignmentFromEntry(s.hash, s.content)
    }
    return get(this.alignmentsStore)
  }

  buildTree(tree: Array<RustNode>, node: RustNode): Node {
    let t: Node = {val: node.val, children: [], id: `${node.idx}`}
    for (const n of node.children) {
      t.children.push(this.buildTree(tree, tree[n]))
    }
    return t
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
}
