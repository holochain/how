// TODO: add globally available interfaces for your elements

import { EntryHashB64, AgentPubKeyB64 } from "@holochain-open-dev/core-types";
import { EntryHash, Timestamp } from "@holochain/client";
import { createContext } from "@lit-labs/context";
import { HowStore } from "./how.store";

export const howContext = createContext<HowStore>('how/service');

export type Dictionary<T> = { [key: string]: T };

export interface Initialization {
  units: Array<Unit>,
  documents: Array<DocumentInput>,
}

export type ProcessName = string
export type ProcessType = string

export interface Unit {
  parents: Array<string>,
  pathAbbreviation: string,
  shortName: string,
  stewards: Array<AgentPubKeyB64>,
  processes: Array<[ProcessType, ProcessName]>,
  history: Dictionary<EntryHashB64>,
  meta?: Dictionary<string>;
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

export class Document {
  documentType: DocType = DocType.Document
  editors: Array<AgentPubKeyB64> = [] // people who can change this document, if empty anyone can
  content: Array<Section> = [] // semantically identified content components
  meta: Dictionary<string> = {} // semantically identified meta
  state: string = "define"
  machine: Dictionary<Array<string>> =  {
    define:["refine", SysState.Defunct],
    refine: ["align", SysState.Defunct],
    align: [SysState.Alive, SysState.Defunct],
    [SysState.Defunct]: [],
    [SysState.Alive]: [SysState.Defunct]
   }
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

  public setSection(sectionName: string, content: string ) {
    const section = this.getSection(sectionName)
    if (section != null) {
      console.log("SETTING", sectionName, content)
      section.content = content
    }
  }

  public isAlive() : boolean {
    return this.state == SysState.Alive
  }
  public nextStates() : Array<string> {
    return Object.values(this.machine[this.state])
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
}

export interface UpdateDocumentInput {
  hash: EntryHashB64,
  path: string,
  document: Document,
}


export type Signal =
  | {
    unitHash: EntryHashB64, message: {type: "NewUnit", content:  Unit}
  }
  
export type Content = {
  name: string,
  units: Array<EntryHashB64>,
  documents: Array<EntryHashB64>
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
