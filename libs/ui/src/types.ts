// TODO: add globally available interfaces for your elements

import { EntryHashB64, AgentPubKeyB64 } from "@holochain-open-dev/core-types";
import { EntryRecord, serializeHash } from "@holochain-open-dev/utils";
import { Action, ActionHash, ActionHashed, EntryHash, Record, Timestamp } from "@holochain/client";
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
  Content = "c",
}

export const SourceManual: string = "_manual"

export interface Section {
  name: string,
  sectionType: SectionType,
  contentType: string,
  content: string,    
  sourcePath: string,
  sourceUnit?: EntryHash,
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
  documentHash: EntryHashB64 | undefined
  unitHash: EntryHash = new Uint8Array
  documentType: DocType = DocType.Document
  editors: Array<AgentPubKeyB64> = [] // people who can change this document, if empty anyone can
  content: Array<Section> = [] // semantically identified content components
  meta: Dictionary<string> = {} // semantically identified meta
  state: string = "define"
  marks: Array<Mark> = []
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
        if (section.content != "") {
          count += 1
        }
      } else if (section.sourcePath.indexOf(".soc_proto.process."+this.state) >= 0) {
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

  public canAddSection() : boolean {
    // TODO add stuff about Editors and Stewards
    return this.state === "define" || this.state === "refine"
  }

  public isEditable(sectionName:string) : Boolean {
    if (this.state == "define") {
      return true
    }
    const section = this.getSection(sectionName)
    return section.sourcePath.indexOf(".soc_proto.process."+this.state) >= 0
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

  // return a list of controls enabled by state
  public enabledControls() : Array<string> {
    const controls = this.content.filter((section) => section.contentType.startsWith("control/"))
    const enabled: Array<string> = []
    controls.forEach((section)=>{
      try {
        const control = JSON.parse(section.content)
        if (control.enabled) {
          enabled.push(section.contentType.split('/')[1])
        }
      } catch(e) {}
    }
    )
    return enabled
  }

  public getStats() : DocumentStats {
    let emptySections = 0
    this.content.forEach(section=>{if(section.content=="") emptySections+=1})
    return {emptySections}
  }
}

export type DocumentStats = {
  emptySections: number
}

export interface DocumentInput {
  path: string,
  document: Document,
}

export interface Mark {
  markType: number,
  mark: String,
  author: AgentPubKeyB64,
}

export interface DocumentOutput {
  hash: EntryHashB64,
  updatedBy: Array<EntryHash>,
  deletedBy: Array<ActionHash>,
  content: Document,
  actions: Array<ActionHashed>,
  marks: Array<Mark>,
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

export interface MarkDocumentInput {
  hash: EntryHashB64,
  markType: number,
  mark: String,
}

export type Signal =
  | {
    unitHash: EntryHashB64, message: {type: "NewUnit", content:  Unit}
  }

export type UnitInfo = {
    hash: EntryHash,
    version: string,
    state: string,
}

export type UnitOutput = {
  info: UnitInfo,
  record: Record,
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

export type RequirementInfo = {
  description: string,
}

export const parseRequirementInfo =  (section: Section) : RequirementInfo => {
  return JSON.parse(section.content)
} 

// TODO refactor control states into interface and their own types
export type CommentControlState = {
  enabled: boolean,
}

export const parseCommentControlState =  (section: Section) : CommentControlState => {
  if (section.content == "") {
    return {enabled: false}
  }
  return JSON.parse(section.content)
} 

export type VotingControlState = {
  enabled: boolean,
}

export const parseVotingControlState =  (section: Section) : VotingControlState => {
  if (section.content == "") {
    return {enabled: false}
  }
  return JSON.parse(section.content)
} 

export type HilightRange = {
  sectionName: string,
  startOffset: number,
  endOffset: number,
  comments: Array<EntryHashB64> | undefined,
  replacement: string | undefined,  // undefined = no replacement.  empty string = delete
}

export type CommentInfo = {
  commentText: string,
  suggestion: string | undefined
}

export enum CommentStatus {
  Pending = "pending",
  Approved = "approved",
  Rejected = "rejected",
  Modified = "modified",
}

export enum MarkTypes {
  CommentStatus = 1,
  Vote = 2,
}

export type Offsets = {
  startOffset: number,
  endOffset: number
}
export const offsetsOverlap = (x:Offsets,y:Offsets) : boolean => {
  return Math.max(x.startOffset,y.startOffset) <= Math.min(x.endOffset,y.endOffset)
}

export type CommentAction = {
  action: string,
  comment: Comment,
}

export class Comment {
  status: CommentStatus = CommentStatus.Pending
  constructor(
    public documentOutput: DocumentOutput,
    public commentingOn: Document ) {
    const mark = this.documentOutput.marks.find(m => m.markType==MarkTypes.CommentStatus)
    // TODO check that the mark was made by a steward
    if (mark) {
      // @ts-ignore
      this.status = mark.mark
    }
  }
  overlaps(comment: Comment) : boolean {
    const x = this.getOffsets()
    const y = comment.getOffsets()
    return offsetsOverlap(x,y)
  }
  getOffsets() : Offsets {
    return {startOffset: this.startOffset(),
     endOffset: this.endOffset()
    }
  }
  startOffset() : number {
    return parseInt(this.documentOutput.content.meta["startOffset"])
  }
  endOffset() : number {
    return parseInt(this.documentOutput.content.meta["endOffset"])
  }
  getSectionName() : string {
    return this.documentOutput.content.meta["section"]
  }
  getSection() : Section | undefined {
    return this.commentingOn.getSection(this.getSectionName())
  }
  getCommentingOnText(prune: boolean) : string | undefined{
    const section = this.getSection()
    if (section) {
      let text = section.content.substring(this.startOffset(),this.endOffset())
      return prune && text.length> 140 ? text.substring(0,65)+' ... '+text.substring(text.length - 65, text.length) : text
    }
    return undefined
  }
  getDocumentHash() : EntryHashB64 {
    return this.documentOutput.content.meta["document"]
  }
  hash() : EntryHashB64 {
    return this.documentOutput.hash
  }
  author() : AgentPubKeyB64 {
    return serializeHash(this.documentOutput.actions[0].content.author)
  }
  created() : Date {
    return new Date(this.documentOutput.actions[0].content.timestamp/1000)
  }
  suggestion() : string | undefined {
    const suggestionSection = this.documentOutput.content.getSection("suggestion")
    return suggestionSection ? suggestionSection.content : undefined
  }
}

export type CommentStats = {
  total: number
  pending: number
  approved: number
  rejected: number
  modified: number
  suggestions: number
}

export const applyApprovedComments = (text: string, comments: Array<Comment>) : string => {
  for (let i= comments.length-1; i >=0 ; i-=1) {
    const c: Comment = comments[i]
    if (c.status == CommentStatus.Approved) {
      const suggestion = c.suggestion()
      if (suggestion != undefined) {
        text = text.substring(0,c.startOffset())+suggestion+text.substring(c.endOffset())
      }
    }
  }
  return text
}