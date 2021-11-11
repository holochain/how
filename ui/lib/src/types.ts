// TODO: add globally available interfaces for your elements

import { EntryHashB64 } from "@holochain-open-dev/core-types";
import { createContext, Context } from "@lit-labs/context";
import { HowStore } from "./how.store";

export const howContext : Context<HowStore> = createContext('how/service');

export type Dictionary<T> = { [key: string]: T };


export interface AlignmentEntry {
  name: string;
  meta?: Dictionary<string>;
}

export interface Alignment  {
  name: string;
  meta?: Dictionary<string>;
}


export type Signal =
  | {
    alignmentHash: EntryHashB64, message: {type: "NewAlignment", content:  AlignmentEntry}
  }
  
