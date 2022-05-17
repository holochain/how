// TODO: add globally available interfaces for your elements

import { EntryHashB64, AgentPubKeyB64 } from "@holochain-open-dev/core-types";
import { createContext, Context } from "@holochain-open-dev/context";
import { HowStore } from "./how.store";

export const howContext: Context<HowStore> = createContext('how/service');

export type Dictionary<T> = { [key: string]: T };

export interface Initialization {
  alignments: Array<Alignment>,
  documents: Array<DocumentInput>,
}

export type ProcessName = string
export type ProcessType = string

export interface Alignment {
  parents: Array<string>,
  path_abbreviation: string,
  short_name: string,
  stewards: Array<AgentPubKeyB64>,
  processes: Array<[ProcessType, ProcessName]>,
  history: Dictionary<EntryHashB64>,
  meta?: Dictionary<string>;
}

export interface AlignmentOutput {
  hash: EntryHashB64,
  content: Alignment,
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
  section_type: SectionType,
  content_type: string,
  source: string,
  content: string
}

export enum SysState {
  Alive = "_alive",
  Defunct = "_defunct"
}

export class Comment {
  documentHash: EntryHashB64 = ''
  section: string = ''
  start_index: number = 0
  end_index: number = 0
  authorHash: AgentPubKeyB64 = ''
  commentText: string = ''
  isResolved: boolean = false
  timestamp: Date = new Date()
  profileImg: string = ''
}

export class Document {
  document_type: DocType = DocType.Document
  editors: Array<AgentPubKeyB64> = [] // people who can change this document, if empty anyone can
  content: Array<Section> = [] // semantically identified content components
  meta: Dictionary<string> = {} // semantically identified meta
  state: string = "define"
  machine: Dictionary<Array<string>> = {
    define: ["refine", SysState.Defunct],
    refine: ["align", SysState.Defunct],
    align: [SysState.Alive, SysState.Defunct],
    [SysState.Defunct]: [],
    [SysState.Alive]: [SysState.Defunct]
  }
  protected sectionsMap: Dictionary<number> = {}

  constructor(init?: Partial<Document>) {
    Object.assign(this, init);
    if (init && init.content) {
      init.content.forEach((section, index) => this.sectionsMap[section.name] = index)
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

  public getSection(sectionName: string): Section {
    return this.content[this.sectionsMap[sectionName]]
  }

  public setSection(sectionName: string, content: string) {
    const section = this.getSection(sectionName)
    if (section != null) {
      console.log("SETTING", sectionName, content)
      section.content = content
    }
  }

  public isAlive(): boolean {
    return this.state == SysState.Alive
  }
  public nextStates(): Array<string> {
    return Object.values(this.machine[this.state])
  }

  public getSectionsByType(section_type: SectionType): Array<Section> {
    return this.content.filter((section) => section.section_type == section_type)
  }
}

export interface DocumentInput {
  path: string,
  document: Document,
}

export interface DocumentOutput {
  hash: EntryHashB64,
  updated: boolean,
  content: Document,
}

export interface UpdateDocumentInput {
  hash: EntryHashB64,
  path: string,
  document: Document,
}


export type Signal =
  | {
    alignmentHash: EntryHashB64, message: { type: "NewAlignment", content: Alignment }
  }

export type Content = {
  name: string,
  alignments: Array<EntryHashB64>,
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
