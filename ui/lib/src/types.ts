// TODO: add globally available interfaces for your elements

import { EntryHashB64, AgentPubKeyB64 } from "@holochain-open-dev/core-types";
import { createContext, Context } from "@lit-labs/context";
import { HowStore } from "./how.store";

export const howContext : Context<HowStore> = createContext('how/service');

export type Dictionary<T> = { [key: string]: T };

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

export type Signal =
  | {
    alignmentHash: EntryHashB64, message: {type: "NewAlignment", content:  Alignment}
  }
  
export type RustNode = {
    idx: number,
    val: string,
    parent: null | number,
    children: Array<number>
  }

export type Node = {
    val: string,
    children: Array<Node>
  }
