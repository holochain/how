// TODO: add globally available interfaces for your elements

import { EntryHashB64, AgentPubKeyB64 } from "@holochain-open-dev/core-types";
import { Action, EntryHash, Timestamp } from "@holochain/client";
import { createContext } from "@lit-labs/context";
import { HowStore } from "./how.store";

export const howContext = createContext<HowStore>('how/service');

export type Dictionary<T> = { [key: string]: T };

export interface Initialization {
  units: Array<[string,Unit]>,
  documents: Array<DocumentInitializer>,
}

export type ProcessName = string
export type ProcessType = string

export class Unit {
  parents: Array<string> = []
  version: string = ""
  pathAbbreviation: string = ""
  shortName: string =""
  stewards: Array<AgentPubKeyB64> = []
  processes: Array<[ProcessType, ProcessName]> = []
  history: Dictionary<EntryHashB64> = {}
  meta: Dictionary<string> = {};
  machine: Dictionary<Array<string>> =  {
    define:["refine", SysState.Defunct],
    refine: ["align", SysState.Defunct],
    align: [SysState.Alive, SysState.Defunct],
    [SysState.Defunct]: [],
    [SysState.Alive]: [SysState.Defunct]
  }
  constructor(init?: Partial<Unit> ) {
    Object.assign(this, init);
  }
  public path() : string {
    return this.parents.length > 0 ? `${this.parents[0]}.${this.pathAbbreviation}` : this.pathAbbreviation
  }
  public nextStatesFrom(state:string) : Array<string> {
    return Object.values(this.machine[state])
  }
  public processNameForState(state: string) : string {
    // TODO: convert to use state machine...
    let idx = 0;
    switch (state) {
      case "define": idx = 0; break;
      case "refine": idx = 1; break;
      case "align": idx = 2; break;
      default: return ""
    }
    let proc = this.processes[idx]
    if (proc) {
      return proc[1]
    }
    return ""
  }
  public processPathForState(state: string) : string {
    // TODO: convert to use state machine...
    let idx = 0;
    switch (state) {
      case "define": idx = 0; break;
      case "refine": idx = 1; break;
      case "align": idx = 2; break;
      default: return ""
    }
    let proc = this.processes[idx]
    if (proc) {
      return `${proc[0]}.${proc[1]}`
    }
    return ""
  }
}

export enum VersioningType {
  Semantic = "vsem",
  Indexed = "vidx"
}

export enum DocType {
  Document = "_document",
  Comment = "_comment"
}

export enum SectionType {
  Process = "p",
  Requirement = "r",
  Content = "",
}

export const SourceManual: string = "_manual"

export interface Section {
  name: string,
  sectionType: SectionType,
  contentType: string,
  source: string,
  content: string,    
}

export enum SysState {
  Alive = "_alive",
  Defunct = "_defunct"
}

export interface DocumentInitializer {
  path: string,
  documentType: DocType
  editors: Array<AgentPubKeyB64>
  content: Array<Section>
  meta: Dictionary<string>
}

export class Document {
  unitHash: EntryHash = new Uint8Array
  documentType: DocType = DocType.Document
  editors: Array<AgentPubKeyB64> = [] // people who can change this document, if empty anyone can
  content: Array<Section> = [] // semantically identified content components
  meta: Dictionary<string> = {} // semantically identified meta
  state: string = "define"
  protected sectionsMap: Dictionary<number> = {}

  constructor(init?: Partial<Document> ) {
    Object.assign(this, init);
    if (init && init.content) {
      init.content.forEach((section, index) =>this.sectionsMap[section.name] = index)
    }
  }

  public appendSections(sections: Array<Section>) {
    let sectionsCount = this.content.length
    this.content = this.content.concat(sections)
    for (const section of sections) {
      this.sectionsMap[section.name] = sectionsCount
      sectionsCount += 1
    }
  }

  public getSection(sectionName: string) : Section {
    return this.content[this.sectionsMap[sectionName]]
  }

  public getProgress() : Progress {
    let total = 1
    let count = 0
    for (const section of this.content) {
      if (this.state == "define") {
        total+=1
        if (section.content[0] != '{') {
          count += 1
        }
      } else if (section.source.indexOf(".soc_proto.process."+this.state) >= 0) {
        total+=1
        if (section.content[0] != '{') {
          count += 1
        }
      }  
    }
    return {
      total,
      count
    }
  }

  public isEditable(sectionName:string) : Boolean {
    if (this.state == "define") {
      return true
    }
    const section = this.getSection(sectionName)
    return section.source.indexOf(".soc_proto.process."+this.state) >= 0
  }

  public setSection(sectionName: string, content: string ) {
    const section = this.getSection(sectionName)
    if (section != null) {
      section.content = content
    }
  }

  public isAlive() : boolean {
    return this.state == SysState.Alive
  }

  public getSectionsByType(sectionType: SectionType) : Array<Section> {
    return this.content.filter((section) => section.sectionType == sectionType)
  }
}

export interface DocumentInput {
  path: string,
  document: Document,
}

export interface DocumentOutput {
  hash: EntryHashB64,
  updatedBy: Array<EntryHash>,
  content: Document,
  actions: Array<Action>,
}

export interface DocInfo {
  hash: EntryHashB64,
  content: Document,
  updated: Timestamp,
}

export interface UpdateDocumentInput {
  hash: EntryHashB64,
  path: string,
  document: Document,
}

export interface AdvanceStateInput {
  newState: string,
  unitHash: EntryHash,
  documentHash: EntryHashB64,
  document: Document,
}

export type Signal =
  | {
    unitHash: EntryHashB64, message: {type: "NewUnit", content:  Unit}
  }

export type UnitInfo = {
    hash: EntryHash,
    version: String,
    state: String,
}
export type Content = {
  name: string,
  units: Array<UnitInfo>,
  documents: Array<EntryHash>
}

export type RustNode = {
    idx: number,
    val: Content,
    parent: null | number,
    children: Array<number>
  }
export type RustTree = {
  tree: Array<RustNode>
}

export type Node = {
    val: Content,
    id: string,
    children: Array<Node>
}

export type Process = {
  path: string,
  name: string,
}

export type Progress = {
  total: number,
  count: number,
}
