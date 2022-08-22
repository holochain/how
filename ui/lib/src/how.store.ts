import { EntryHashB64, AgentPubKeyB64 } from '@holochain-open-dev/core-types';
import { serializeHash, deserializeHash, AgentPubKeyMap } from '@holochain-open-dev/utils';
import { CellClient } from '@holochain-open-dev/cell-client';
import { writable, Writable, derived, Readable, get } from 'svelte/store';
import cloneDeep from 'lodash/cloneDeep';
import { HowService } from './how.service';
import {
  Dictionary,
  Alignment,
  RustNode,
  Node,
  Initialization,
  Document,
  DocumentOutput,
  Process,
  DocType,
  Section,
  SectionType,
} from './types';
import {
  ProfilesStore,
  Profile,
} from "@holochain-open-dev/profiles";

const areEqual = (first: Uint8Array, second: Uint8Array) =>
      first.length === second.length && first.every((value, index) => value === second[index]);

export class HowStore {
  /** Private */
  private service : HowService
  private profiles: ProfilesStore
  private knownProfiles: Readable<AgentPubKeyMap<Profile>> | undefined

  /** AlignmentEh -> Alignment */
  private alignmentsStore: Writable<Dictionary<Alignment>> = writable({});   // maps alignment hash to alignment
  private documentsStore: Writable<Dictionary<Document>> = writable({});
  private alignmentsPathStore: Writable<Dictionary<string>> = writable({});  // maps alignment hash to path
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
  public processes: Readable<Array<Process>> = derived(this.documents, d => this.getProcesses(get(this.treeStore)))

  private processTypes: Readable<Array<Node>> = derived(
    this.tree, 
    $tree => {
      const { children = [] } = this.find($tree, ['soc_proto', 'process']) || {};
      return children || []
    }
  )

  public alignProcesses: Readable<Array<Node>> = this.getProcessesStoreForType('align');
  public defineProcesses: Readable<Array<Node>> = this.getProcessesStoreForType('define');
  public refineProcesses: Readable<Array<Node>> = this.getProcessesStoreForType('refine');
  
  constructor(
    protected cellClient: CellClient,
  profilesStore: ProfilesStore,
  zomeName = 'how'
  ) {
    this.myAgentPubKey = serializeHash(cellClient.cell.cell_id[1]);
    this.profiles = profilesStore;
    this.service = new HowService(cellClient, zomeName);

    cellClient.addSignalHandler( signal => {
      if (! areEqual(cellClient.cell.cell_id[0],signal.data.cellId[0]) || !areEqual(cellClient.cell.cell_id[1], signal.data.cellId[1])) {
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

  // get all of the sections needed for a specific process by getting the template contents
  // for that proccess hierarchy
  async getSectionsFromHierarcy(path: string, start: number, sectionType: SectionType): Promise<Array<Section>> {
    console.log(`looking for ${sectionType} in ${path}`)
    path = `.${path}`
    let sections: Array<Section> = []
    let segments = path.split(".")
    let i = start+1
    while (i <= segments.length) {
      const walk = segments.slice(0,i).join(".")
      i += 1
      // find the sections of the given type at this level and add them into the sections
      await this.pullDocuments(walk)
      const docs = get(this.documentPaths)[walk]
      if (docs) {
        for (const doc of docs) {
          if (doc.content.documentType == DocType.Document) {
            let newSections = doc.content.getSectionsByType(sectionType)
            for (const section of newSections) {
              section.sectionType = SectionType.Content
              section.source = walk
            }
            sections = sections.concat(newSections)
          } 
        }
      }
    }
    return sections
  }

  private getProcessesStoreForType(type: string): Readable<Array<Node>> {
    return derived(
      this.processTypes,
      $processTypes => $processTypes.find(processType => processType.val.name === type)?.children || []
    )
  }

  private others(): Array<AgentPubKeyB64> {
    if (this.knownProfiles) {
      const map : AgentPubKeyMap<Profile> = get(this.knownProfiles)
      const x: Array<AgentPubKeyB64>  = map.keys().map((key) => serializeHash(key))
      return x.filter((key) => key != this.myAgentPubKey)
    }
    else {
      return []
    }
  }

  private updateAlignmentFromEntry(hash: EntryHashB64, alignment: Alignment) {
    this.alignmentsPathStore.update(alignments => {
      const path = alignment.parents.length>0 ? `${alignment.parents[0]}.${alignment.pathAbbreviation}` : alignment.pathAbbreviation
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

  private updateDocumentStores(path: string, doc: DocumentOutput)  {
    console.log("updating doc for ",path, "to", doc)
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

  private markDocumentUpdated(path: string, hash: EntryHashB64) {
    const docs = get(this.documentPathStore)[path]
    if (docs) {
      let doc = docs.find(e=>e.hash == hash)
      if (doc) {
        doc.updated = true
      }
    }
  }
  
  async pullDocuments(path: string) : Promise<Array<DocumentOutput>> {
    let documents = await this.service.getDocuments(path)
    documents.forEach(doc => {
      doc.content = new Document(doc.content)
    })
    documents = documents.filter(doc => !doc.updated)
    console.log("pull got", documents)
    for (const s of documents) {
      this.updateDocumentStores(path, s)
    }
    return get(this.documentPathStore)[path]
  }

  async updateDocument(hash: EntryHashB64, document: Document) : Promise<EntryHashB64> {
    const path = this.getDocumentPath(hash)
    let newHash: EntryHashB64 = ""
    if (path) {
      newHash = await this.service.updateDocument({hash, document, path})
      this.markDocumentUpdated(path, hash)
      this.pullDocuments(path)
    }
    return newHash

  }
  async changeDocumentState(hash: EntryHashB64, state: string) : Promise<EntryHashB64> {
    let newHash: EntryHashB64 = ""
    let doc = cloneDeep(get(this.documents)[hash])
    doc.state = state

    const processPath = this.getProcessPathForState(hash, state)
    doc.appendSections(await this.getSectionsFromHierarcy(processPath, 2, SectionType.Process))
    const newDocumentHash = await this.updateDocument(hash, doc);

    return newDocumentHash
  }


  buildTree(tree: Array<RustNode>, node: RustNode): Node {
    let t: Node = {val: node.val, children: [], id: `${node.idx}`}
    for (const n of node.children) {
      t.children.push(this.buildTree(tree, tree[n]))
    }
    return t
  }

  private getProcesses(tree: Node) : Array<Process> {
    console.log("GET PROCS", tree)
    const node = this.find(tree,"soc_proto.process".split("."))
    let processes : Array<Process> = []
    if (node) {
      for (const n of node.children) {
        const docs = get(this.documentPathStore)[`soc_proto.process.${n.val.name}`]         
        console.log("docs", get(this.documentPathStore), docs, `soc_proto.process.${n.val.name}`)

        if (docs) {
          const doc  = docs.find(doc=>doc.content.documentType == DocType.Document)
          console.log("doc", doc)
          if (doc) {
            processes.push({path: `soc_proto.process.${n.val.name}`, name: n.val.name})
          }
        }
      }
    }
    return processes
  }

  private find(tree: Node, path: Array<string>): Node | undefined {
    const node = tree.children.find(n=> {return path[0]==n.val.name})
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


  async getProfile(agent: AgentPubKeyB64) : Promise<Profile|undefined> {
    return get(await this.profiles.fetchAgentProfile(deserializeHash(agent)))  
  }

  getProfileSync(agent: AgentPubKeyB64) : Profile|undefined {
    if (this.knownProfiles) {
      const map : AgentPubKeyMap<Profile> = get(this.knownProfiles)
      return map.get(deserializeHash(agent))
    } else {
      return undefined
    }
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

  async initializeAlignment(algnmentEh: EntryHashB64) : Promise<void>  {
    const alignment = this.alignment(algnmentEh)
    const proc = alignment.processes[0]
    const processPath = `${proc[0]}.${proc[1]}`
    const doc = new Document({documentType: DocType.Document})

    doc.appendSections(await this.getSectionsFromHierarcy(alignment.parents[0], 0, SectionType.Requirement))
    await this.pullDocuments(processPath)
    doc.appendSections(await this.getSectionsFromHierarcy(processPath, 2, SectionType.Process))

    doc.setSection("title", alignment.shortName)
    console.log("ADDING DOC", doc)
    const path = `${alignment.parents[0]}.${alignment.pathAbbreviation}`
    await this.addDocument(path, doc)
  }

  async addAlignment(alignment: Alignment) : Promise<EntryHashB64> {
    const alignmentEh: EntryHashB64 = await this.service.createAlignment(alignment)
    this.alignmentsStore.update(alignments => {
      alignments[alignmentEh] = alignment
      return alignments
    })
    await this.initializeAlignment(alignmentEh)

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

  getDocumentPath(hash: EntryHashB64) : string | null {
    for (let [path, docOutputs] of Object.entries(get(this.documentPaths))) {
      for (const docO of docOutputs) {
        if (docO.hash == hash) {return path}
      }
    }
    return null;
  }

  private getDocumentAligment(hash: string) : Alignment | null {
    // TODO this will break once we get versions because there will be
    // more that one aligment per path
    const path = this.getDocumentPath(hash)
    for (let [alignmentPath, alignmentEh] of Object.entries(get(this.alignmentsPath))) {
      if (alignmentPath == path) {
        return this.alignment(alignmentEh)
      }
    }
    return null
  }

  private getProcessPathForState(hash: EntryHashB64, state: string) : string {
    const alignment = this.getDocumentAligment(hash)
    // TODO: convert to use state machine...
    let idx = 0;
    switch (state) {
      case "refine": idx = 1; break;
      case "align": idx = 2; break;
      default: return ""
    }
    let proc = alignment?.processes[idx]
    if (proc) {
      return `${proc[0]}.${proc[1]}`
    }
    return ""
  }

}
