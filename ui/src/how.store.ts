import { EntryHashB64, AgentPubKeyB64, AppAgentClient, RoleName, encodeHashToBase64, decodeHashFromBase64, AgentPubKey } from '@holochain/client';
import { AgentPubKeyMap, EntryRecord } from '@holochain-open-dev/utils';
import { writable, Writable, derived, Readable, get } from 'svelte/store';
import cloneDeep from 'lodash/cloneDeep';
import { HowService } from './how.service';
import {
  Dictionary,
  Unit,
  RustNode,
  Node,
  Initialization,
  Document,
  DocumentOutput,
  Process,
  DocType,
  Section,
  SectionType,
  DocInfo,
  UnitOutput,
  UnitInfo,
  Mark,
  MarkDocumentInput,
  HowSignal,
  Progress,
} from './types';
import { Action, ActionHash } from '@holochain/client';

export type HowConfig = {
  processRoot: string
}

const areEqual = (first: Uint8Array, second: Uint8Array) =>
      first.length === second.length && first.every((value, index) => value === second[index]);

export class HowStore {
  /** Private */
  private service : HowService

  /** UnitEh -> Unit */
  private unitsStore: Writable<Dictionary<Unit>> = writable({});   // maps unit hash to unit
  private unitsActionStore: Writable<Dictionary<Action>> = writable({});   // maps unit hash to unit
  private unitsInfoStore: Writable<Dictionary<UnitInfo>> = writable({});   // maps unit hash to unit
  private documentsStore: Writable<Dictionary<Document>> = writable({});
  private unitsPathStore: Writable<Dictionary<string>> = writable({});  // maps unit hash to path
  private treeStore: Writable<Node> = writable({val:{name:"T", units: [], documents: []}, children:[], id:"0"});
  private documentPathStore: Writable<Dictionary<Array<DocumentOutput>>> = writable({});

  /** Static info */
  myAgentPubKey: AgentPubKeyB64;
  treeName: string = ""
  config: HowConfig = {processRoot: ""}
  processRootPath: string[] = []

  /** Readable stores */
  public units: Readable<Dictionary<Unit>> = derived(this.unitsStore, i => i)
  public documents: Readable<Dictionary<Document>> = derived(this.documentsStore, i => i)
  public unitsPath: Readable<Dictionary<string>> = derived(this.unitsPathStore, i => i)
  public unitsAction: Readable<Dictionary<Action>> = derived(this.unitsActionStore, i => i)
  public unitsInfo: Readable<Dictionary<UnitInfo>> = derived(this.unitsInfoStore, i => i)
  public tree: Readable<Node> = derived(this.treeStore, i => i)
  public documentPaths: Readable<Dictionary<Array<DocumentOutput>>> = derived(this.documentPathStore, i => i)
  public processes: Readable<Array<Process>> = derived(this.documents, d => this.getProcesses(get(this.treeStore)))

  private processTypes: Readable<Array<Node>> = derived(
    this.tree, 
    $tree => {
      const { children = [] } = this.find($tree, this.processRootPath) || {};
      return children || []
    }
  )

  constructor(
    protected client: AppAgentClient,
    roleName: RoleName,
    zomeName = 'how'
  ) {
    this.myAgentPubKey = encodeHashToBase64(client.myPubKey);
    this.service = new HowService(client, roleName, zomeName);

    client.on( 'signal', signal => {
      console.log("SIGNAL",signal.payload)
      const payload  = signal.payload as HowSignal
      switch(payload.message.type) {
      case "NewUnit":
        if (!get(this.units)[payload.unitHash]) {
        //  this.updateUnitFromEntry(new EntryRecord<Unit>(payload.message.content))
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
            let newSections = doc.content.getSectionsByType(sectionType).map(s => cloneDeep(s))
            for (const section of newSections) {
              section.content = ""
              section.sectionType = SectionType.Content
              section.sourcePath = walk
              section.sourceUnit = doc.content.unitHash
            }
            sections = sections.concat(newSections)
          } 
        }
      }
    }
    return sections
  }

  public getProcessesStoreForType(type: string): Readable<Array<Node>> {
    return derived(
      this.processTypes,
      $processTypes => $processTypes.find(processType => processType.val.name === type)?.children || []
    )
  }

  private updateUnitFromEntry(unitOutput: UnitOutput) {
    const record: EntryRecord<Unit> = new EntryRecord<Unit>(unitOutput.record)
    const unit = new Unit(record.entry)
    const hash = encodeHashToBase64(record.entryHash)
    this.unitsPathStore.update(units => {
      const path = unit.path()
      units[path] = hash
      return units
    })
    this.unitsStore.update(units => {
      units[hash] = unit
      return units
    })
    this.unitsActionStore.update(units => {
      const a = record.action
      //@ts-ignore
      units[hash] = a
      return units
    })
    this.unitsInfoStore.update(units => {
      units[hash] = unitOutput.info
      return units
    })
  }

  async pullUnits() : Promise<Dictionary<Unit>> {
    await this.pullMeta()
    const units = await this.service.getUnits();
    for (const unitOutput of units) {
      this.updateUnitFromEntry(unitOutput)
    }
    return get(this.unitsStore)
  }

  private updateDocumentStores(path: string, doc: DocumentOutput)  {
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

  private markDocumentUpdated(path: string, hash: EntryHashB64, newHash: EntryHashB64) {
    const docs = get(this.documentPathStore)[path]
    if (docs) {
      let doc = docs.find(e=>e.hash == hash)
      if (doc) {
        doc.updatedBy.push(decodeHashFromBase64(newHash)); 
      }
    }
  }

  private markDocumentDeleted(path: string, hash: EntryHashB64, actionHash: ActionHash) {
    const docs = get(this.documentPathStore)[path]
    if (docs) {
      let doc = docs.find(e=>e.hash == hash)
      if (doc) {
        doc.deletedBy.push(actionHash); 
      }
    }
  }

  private markDocumentMarked(path: string, hash: EntryHashB64, mark: Mark) {
    const docs = get(this.documentPathStore)[path]
    if (docs) {
      let doc = docs.find(e=>e.hash == hash)
      if (doc) {
        doc.marks.push(mark); 
      }
    }
  }

  async pullMeta() {
    const docs = await this.pullDocuments("")
    const meta = docs.find(d=>d.content.documentType == DocType.TreeMeta)
    if (meta) {
      this.treeName = meta.content.content[0].name
      this.config = JSON.parse(meta.content.content[0].content) as HowConfig
      this.processRootPath = this.config.processRoot.split(".")
      Document.processRoot = this.config.processRoot
    }
   // await this.pullDocuments("soc_proto.process.define.declaration")

  }
  
  async pullDocuments(path: string) : Promise<Array<DocumentOutput>> {
    let documents = await this.service.getDocuments(path)
    documents.forEach(doc => {
      doc.content = new Document(doc.content)
      doc.content.documentHash = doc.hash
      doc.content.marks = doc.marks
    })
    for (const doc of documents) {
      this.updateDocumentStores(path, doc)
    }
    return get(this.documentPathStore)[path]
  }

  async updateDocument(hash: EntryHashB64, document: Document) : Promise<EntryHashB64> {
    const path = this.getDocumentPath(hash)
    let newHash: EntryHashB64 = ""
    if (path) {
      newHash = await this.service.updateDocument({hash, document, path})
      this.markDocumentUpdated(path, hash, newHash)
      this.pullDocuments(path)
    }
    return newHash
  }

  async deleteDocument(path: string, document: DocumentOutput) : Promise<ActionHash> {
    const actionHash = await this.service.deleteDocument(document.actions[0].hash)
    this.markDocumentDeleted(path, document.hash, actionHash)
    this.pullDocuments(path)
    return actionHash
  }

  async markDocument(path: string, input: Array<MarkDocumentInput>) : Promise<ActionHash> {
    const actionHash = await this.service.markDocument(input)
    for (const mark of input) {
      this.markDocumentMarked(path, mark.hash, {mark: mark.mark, markType: mark.markType, author: this.myAgentPubKey})
    }
    this.pullDocuments(path)
    return actionHash
  }

  getDocumentForUnit(unitHash: EntryHashB64) : DocumentOutput | undefined {
    const unit = this.unit(unitHash)
    const path = unit.path()
    const documents = get(this.documentPaths)[path]
    return documents.find(d => d.updatedBy.length==0 && d.deletedBy.length==0)
  }

  async advanceState(unitHash: EntryHashB64, state: string) : Promise<EntryHashB64|undefined> {
    const unit = this.unit(unitHash)
    if (unit) {
      const documentOutput = this.getDocumentForUnit(unitHash)
      if (documentOutput) {
        let doc = cloneDeep(documentOutput.content)
        doc.state = state

        const processPath = unit.processPathForState(state)
        doc.appendSections(await this.getSectionsFromHierarcy(processPath, 2, SectionType.Process))
  
        const newDocumentHash = await this.service.advanceState({
            newState: state,
            unitHash: decodeHashFromBase64(unitHash),
            documentHash: documentOutput.hash,
            document: doc,
            }
          );
        return newDocumentHash
      }
    }
    return undefined
  }


  buildTree(tree: Array<RustNode>, node: RustNode): Node {
    let t: Node = {val: node.val, children: [], id: `${node.idx}`}
    for (const n of node.children) {
      t.children.push(this.buildTree(tree, tree[n]))
    }
    return t
  }

  private getProcesses(tree: Node) : Array<Process> {
    const node = this.find(tree,this.config!.processRoot.split("."))
    let processes : Array<Process> = []
    if (node) {
      for (const n of node.children) {
        const docs = get(this.documentPathStore)[`${this.config.processRoot}.${n.val.name}`]         
        console.log("docs", get(this.documentPathStore), docs, `${this.config.processRoot}.${n.val.name}`)

        if (docs) {
          const doc  = docs.find(doc=>doc.content.documentType == DocType.Document)
          console.log("doc", doc)
          if (doc) {
            processes.push({path: `${this.config.processRoot}.${n.val.name}`, name: n.val.name})
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

  async pullTree() : Promise<Node> {
    const rtree: Array<RustNode> = await this.service.getTree();
    const node: Node = this.buildTree(rtree, rtree[0])
    this.treeStore.update(tree => {
      tree = node
      return tree
    })
    return get(this.treeStore)
  }

  async initializeUnit(unitEh: EntryHashB64) : Promise<void>  {
    const unit = this.unit(unitEh)
    const proc = unit.processes[0]
    const processPath = `${proc[0]}.${proc[1]}`
    const doc = new Document({unitHash: decodeHashFromBase64(unitEh), documentType: DocType.Document})
    // TODO 
    doc.editors = unit.stewards

    doc.appendSections(await this.getSectionsFromHierarcy(unit.parents[0], 0, SectionType.Requirement))
    await this.pullDocuments(processPath)
    doc.appendSections(await this.getSectionsFromHierarcy(processPath, 2, SectionType.Process))

    doc.setSection("title", unit.shortName)
    console.log("ADDING DOC", doc)
    const path = `${unit.parents[0]}.${unit.pathAbbreviation}`
    await this.addDocument(path, doc)
  }

  async addUnit(unit: Unit) : Promise<EntryHashB64> {
    const unitOutput: UnitOutput = await this.service.createUnit(unit)
    this.updateUnitFromEntry(unitOutput)
    await this.initializeUnit(encodeHashToBase64(unitOutput.info.hash))

    //this.service.notify({unitHash:unitEh, message: {type:"NewUnit", content:unit}}, this.others());
    return encodeHashToBase64(unitOutput.info.hash)
  }

  async initilize(input: Initialization) : Promise<void> {
    await this.service.initialize(input)
  }

  unit(unitEh: EntryHashB64): Unit {
    return get(this.unitsStore)[unitEh];
  }

  async addDocument(path: string, document: Document) : Promise<EntryHashB64> {
    document.documentHash = await this.service.createDocument({path, document})
    
    await this.pullDocuments(path)
    return document.documentHash
  }

  async getCurrentDocumentPull(path:string, unitHash: EntryHashB64|undefined) : Promise<DocInfo | undefined> {
    if (!get(this.documentPaths)[path]) {
      await this.pullDocuments(path)
    }
    return this.getCurrentDocument(path, unitHash)
  }

  getCurrentDocument(path:string, unitHash: EntryHashB64 | undefined ) : DocInfo | undefined {
    const documents = this.getDocumentsFiltered(path, unitHash, DocType.Document, true)
    if (documents.length> 0) {
      return {
        content: documents[documents.length-1].content,
        hash: documents[documents.length-1].hash,
        updated: documents[documents.length-1].actions[0].content.timestamp/1000
      }
    }
    return undefined
  }

  getDocumentsFiltered(path: string, unitEh: EntryHashB64 | undefined, docType: DocType, latestOnly: boolean) : Array<DocumentOutput> {
    let docs = get(this.documentPaths)[path]
    if (docs) {
      if (latestOnly) {
        docs = docs.filter(doc => doc.updatedBy.length==0 && doc.deletedBy.length==0)
      }
      docs = docs.filter(d=>d.content.documentType==docType && (unitEh == undefined || encodeHashToBase64(d.content.unitHash) == unitEh))
      return docs
    }
    return []
  }

  getDocumentPath(hash: EntryHashB64) : string | null {
    for (let [path, docOutputs] of Object.entries(get(this.documentPaths))) {
      for (const docO of docOutputs) {
        if (docO.hash == hash) {return path}
      }
    }
    return null;
  }

  public getDocumentProgress(doc: Document) : Progress {
    let total = 1
    let count = 0
    for (const section of doc.content) {
      if (doc.state == "define") {
        total+=1
        if (section.content != "") {
          count += 1
        }
      } else if (section.sourcePath.indexOf(`.${this.config.processRoot}.${doc.state}`) >= 0) {
        total+=1
        if (section.content != "") {
          count += 1
        }
      }  
    }
    return {
      total,
      count
    }
  }

  async reparent(path: string, newParent: string): Promise<void> {
    this.service.reparent(path,newParent);
  }
}
