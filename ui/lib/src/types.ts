// TODO: add globally available interfaces for your elements

import { EntryHashB64, AgentPubKeyB64 } from "@holochain-open-dev/core-types";
import { createContext, Context } from "@lit-labs/context";
import { HowStore } from "./how.store";

export const howContext : Context<HowStore> = createContext('how/service');

export type Dictionary<T> = { [key: string]: T };

export interface Initialization {
  alignments: Array<Alignment>,
  documents: Array<DocumentInput>,
}

export interface Alignment {
  parents: Array<string>,
  path_abbreviation: string,
  short_name: string,
  title: string,
  summary: string,
  stewards: Array<AgentPubKeyB64>,
  processes: Array<string>,
  history: Dictionary<EntryHashB64>,
  meta?: Dictionary<string>;
}

export interface AlignmentOutput {
  hash: EntryHashB64,
  content: Alignment,
}

export const DOC_TEMPLATE="_template"
export const DOC_COMMENT="_comment"

export interface Document {
  document_type: string, // template path (i.e. a process template) or "_comment" "_reply", "_template"(or other reserved types which start with _)
  editors: Array<AgentPubKeyB64>,  // people who can change this document, if empty anyone can
  content: Array<[string, string]>, // semantically identified content components
  meta: Dictionary<string>, // semantically identified meta
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
