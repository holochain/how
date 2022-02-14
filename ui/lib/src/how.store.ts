import { EntryHashB64, HeaderHashB64, AgentPubKeyB64, serializeHash } from '@holochain-open-dev/core-types';
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

  // gather together all of the required sections by walking the tree from the root
  getRequiredSectionsForPath(path: string): Array<Section> {
    let sections: Array<Section> = []
    path = `.${path}` // so we also search the root
    let walk = ""
    for (const segment of path.split(".") ) {
      if (walk != "") { walk += "."}
      walk += segment
      const alignmentHash = get(this.alignmentsPath)[walk]
      const alignment = this.alignment(alignmentHash)
      sections = sections.concat(alignment.required_sections)
    }
    return sections
  }

  // get all of the sections needed for a specific process by getting the template contents
  // for that proccess hierarchy
  async getSectionsForProcess(path: string): Promise<Array<Section>> {
    let sections: Array<Section> = []
    let segments = path.split(".")
    let walk = segments.shift()!
    for (const segment of segments) {
      walk += "." + segment
      // find the templates at this level and add them into the sections
      await this.pullDocuments(walk)
      const docs = get(this.documentPaths)[walk]
      if (docs) {
        for (const doc of docs) {
          if (doc.content.document_type == DocType.Document) {
            sections = sections.concat(doc.content.getTemplates())
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
  
  async pullDocuments(path: string) : Promise<Array<DocumentOutput>> {
    let documents = await this.service.getDocuments(path)
    documents.forEach(doc => {
      doc.content = new Document(doc.content)
    })
    documents = documents.filter(doc => doc.updated)
    console.log("pull got", documents)
    for (const s of documents) {
      this.updateDocumentStores(path, s)
    }
    return get(this.documentPathStore)[path]
  }

  async updateDocument(hash: EntryHashB64, document: Document) {
    const path = this.getDocumentPath(hash)
    if (path) {
      this.service.updateDocument({hash, document, path})
      this.pullDocuments(path)
    }
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
          const doc  = docs.find(doc=>doc.content.document_type == DocType.Document)
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
    const doc = new Document({document_type: DocType.Document})

    doc.content = this.getRequiredSectionsForPath(alignment.parents[0])
    await this.pullDocuments(processPath)
    doc.content = doc.content.concat(await this.getSectionsForProcess(processPath))

    doc.setSection("title", alignment.short_name)
    const path = `${alignment.parents[0]}.${alignment.path_abbreviation}`
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
    Object.entries(get(this.documentPaths)).forEach(([path, docOutputs]) => 
    docOutputs.forEach((docO) => {if (docO.hash == hash) {return path}}))
    return null;
  }
}
