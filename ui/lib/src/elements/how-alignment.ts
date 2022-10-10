import {css, html, LitElement} from "lit";
import {property, query} from "lit/decorators.js";

import { contextProvided } from "@lit-labs/context";
import {StoreSubscriber} from "lit-svelte-stores";
import { Unsubscriber, Readable, get } from "svelte/store";

import {sharedStyles} from "../sharedStyles";
import {EntryHashB64, AgentPubKeyB64} from "@holochain-open-dev/core-types";
import { deserializeHash } from "@holochain-open-dev/utils";
import {Alignment, DocType, howContext} from "../types";
import {HowStore} from "../how.store";
import {HowDocumentDialog } from "./how-document-dialog";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {ProfilesStore, profilesStoreContext, Profile} from "@holochain-open-dev/profiles";
import {
  Button,
  Dialog,
  TextField,
  TextArea,
} from "@scoped-elements/material-web";

/**
 * @element how-alignment
 */
export class HowAlignment extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  @property() currentAlignmentEh = "";

  @contextProvided({ context: howContext })
  _store!: HowStore;

  @contextProvided({ context: profilesStoreContext })
  _profiles!: ProfilesStore;

  _myProfile!: Readable<Profile | undefined> ;
  _alignments = new StoreSubscriber(this, () => this._store.alignments);
  _documents = new StoreSubscriber(this, () => this._store.documents);
  _documentPaths = new StoreSubscriber(this, () => this._store.documentPaths);

  @query('#document-dialog')
  _documentDialogElem!: HowDocumentDialog;

  get myNickName(): string {
    const p = get(this._myProfile)
    return p ? p.nickname : "";
  }

  handleNodelink(path: string) {
    console.log("clicked on aligment:", path)
    this.dispatchEvent(new CustomEvent('select-node', { detail: path, bubbles: true, composed: true }));
  }

  handleDocumentClick(hash: string) {
    console.log("clicked on document", hash)
    this.dispatchEvent(new CustomEvent('select-document', { detail: hash, bubbles: true, composed: true }));
  }

  getPath() : string {
    if (!this.currentAlignmentEh) {
      return ""
    }
    const alignment: Alignment = this._alignments.value[this.currentAlignmentEh];
    return alignment.parents.length > 0 ? `${alignment.parents[0]}.${alignment.pathAbbreviation}` : alignment.pathAbbreviation
  }

  addDoc(documentType: DocType ) {
    this._documentDialogElem.new(this.getPath(), documentType);
  }

  openDoc(documentEh: EntryHashB64, editable: boolean ) {
    this._documentDialogElem.open(this.getPath(), documentEh, editable);
  }

  renderType(type: String, content: String) : String {
    return content
  }
  render() {
    if (!this.currentAlignmentEh) {
      return;
    }
    /** Get current alignment*/
    const alignment: Alignment = this._alignments.value[this.currentAlignmentEh]

    /** the list of documents for this alignment */
    const path = this.getPath()
    const docs = this._documentPaths.value[path]
    const documents = docs ? docs.filter(doc => !doc.updated).map(docOutput => {
      const doc = docOutput.content
      const title = doc.getSection("title")
      return html`
      <div class="document" @click=${()=>this.handleDocumentClick(docOutput.hash)}>
        <div class="document-title">${title ? this.renderType(title.contentType,title.content):docOutput.hash}</div>
    </div>`
    }) : ""

    const processes = []
     for (const [procType, procName] of alignment.processes) {
        const path = `${procType}.${procName}`
        const elems = procType.split(".")
        const typeName = elems[elems.length-1]
        processes.push(html`<p>${typeName}: <span class="node-link" @click=${()=>this.handleNodelink(path)}>${procName}</span></p>`)
      }

    return html`
      <div class="alignment row">
        <div class="column">
         <h2>${alignment.shortName}</h2>
         <div class="alignment-info">${alignment.pathAbbreviation}<div class="alignment-info-name">path</div></div>
         <div class="alignment-info">10/22/2022<div class="alignment-info-name">created</div></div>
         <div class="alignment-info">1 month ago<div class="alignment-info-name">modified</div></div>
         <div class="alignment-info">${alignment.stewards.map((agent: string)=>html`<span class="agent" title="${agent}">${this._store.getProfileSync(agent)!.nickname}</span>`)}
         <div class="alignment-info-name">stweards</div></div>
        </div>
       <div class="node-element">${processes}</div>
      </div>
    `;
  }


  static get scopedElements() {
    return {
      "mwc-button": Button,
      "how-document-dialog": HowDocumentDialog,
    };
  }
  static get styles() {
    return [
      sharedStyles,
      css`
      .alignment {
        padding: 10px;
      }
      .alignment-info {
        font-size: 1.1em;
        font-weight: bold;
        margin-bottom: 12px;
      }
      .alignment-info-name {
        font-size: .9em;
        color: #999;
        font-weight: normal;  
      }
      .alignment h4 {
        margin-top: 0px;
        margin-bottom: 5px;
      }
      .alignment p {
        line-height: 1.5em;
        margin: 0;
      }
      .alignment div {
        margin-right: 20px;
      }
      .node-link {
        cursor: pointer;
        background-color: white;
        border: solid .1em #666;
        border-radius: .2em;
        padding: 0 6px 0 6px;
      }
      `,
    ];
  }
}
