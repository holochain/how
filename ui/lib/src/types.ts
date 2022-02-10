// TODO: add globally available interfaces for your elements

import { EntryHashB64, AgentPubKeyB64 } from "@holochain-open-dev/core-types";
import { createContext, Context } from "@holochain-open-dev/context";
import { HowStore } from "./how.store";

export const howContext : Context<HowStore> = createContext('how/service');

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
  required_sections: Array<Section>,
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
  Template = "Template",
  Document = "Document",
  Comment = "Comment"
}

export interface Section {
  name: string,
  content_type: string,
  content: string,    
}

export enum SysState {
  Alive = "_alive",
  Defunct = "_defunct"
}

export class Document {
  document_type: string = "" // template path (i.e. a process template) or "_comment" "_reply", "_template"(or other reserved types which start with _)
  editors: Array<AgentPubKeyB64> = [] // people who can change this document, if empty anyone can
  content: Array<Section> = [] // semantically identified content components
  meta: Dictionary<string> = {} // semantically identified meta
  state: string = "define"
  machine: Object =  {
    define:["refine", SysState.Defunct],
    refine: ["align", SysState.Defunct],
    align: [SysState.Alive, SysState.Defunct]
   }
  constructor(init?: Partial<Document> ) {
    Object.assign(this, init);
  }
  public getDocumentSection(sectionName: string) : Section {
    return this.content.filter(({name, content, content_type})=>name == sectionName)[0]
  }
  public setDocumentSection(sectionName: string, content: string ) {
    const section = this.content.filter(({name, content, content_type})=>name == sectionName)[0]
    if (section != null) {
      console.log("SETTING", sectionName, content)
      section.content = content
    }
  }
  public isAlive() : boolean {
    return this.state == SysState.Alive
  }
}

export interface DocumentInput {
  path: string,
  document: Document,
}

export interface DocumentOutput {
  hash: EntryHashB64,
  content: Document,
}

export type Signal =
  | {
    alignmentHash: EntryHashB64, message: {type: "NewAlignment", content:  Alignment}
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
