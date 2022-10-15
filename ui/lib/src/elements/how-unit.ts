import {css, html, LitElement} from "lit";
import {property, query} from "lit/decorators.js";

import { contextProvided } from "@lit-labs/context";
import {StoreSubscriber} from "lit-svelte-stores";
import { Unsubscriber, Readable, get } from "svelte/store";

import {sharedStyles} from "../sharedStyles";
import {EntryHashB64, AgentPubKeyB64} from "@holochain-open-dev/core-types";
import { deserializeHash, serializeHash } from "@holochain-open-dev/utils";
import {Unit, DocType, howContext, SysState, Document} from "../types";
import {HowStore} from "../how.store";
import {HowDocumentDialog } from "./how-document-dialog";
import { HowUnitDetails } from "./how-unit-details";
import { SvgButton } from "./svg-button";
import { HowNode } from "./how-node";

import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {ProfilesStore, profilesStoreContext, Profile, AgentAvatar} from "@holochain-open-dev/profiles";
import {
  Button,
} from "@scoped-elements/material-web";
import { Action } from "@holochain/client";
import { InfoItem } from "./info-item";

const getCurrentStateName  = (unit:Unit, documentState:string ): string => {
  for (const [procType, procName] of unit.processes) {
      const elems = procType.split(".")
      const typeName = elems[elems.length-1]
      if (documentState == typeName) {
         return procName
      }
  } 
  return documentState
}

/**
 * @element how-unit
 */
export class HowUnit extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  @property() currentUnitEh = "";

  @contextProvided({ context: howContext })
  _store!: HowStore;

  @contextProvided({ context: profilesStoreContext })
  _profiles!: ProfilesStore;

  _myProfile!: Readable<Profile | undefined> ;
  _units = new StoreSubscriber(this, () => this._store.units);
  _unitsActions = new StoreSubscriber(this, () => this._store.unitsAction);
  _documents = new StoreSubscriber(this, () => this._store.documents);
  _documentPaths = new StoreSubscriber(this, () => this._store.documentPaths);

  @query('#document-dialog')
  _documentDialogElem!: HowDocumentDialog;

  @query('how-unit-details')
  _detailsElem!: HowUnitDetails;

  get myNickName(): string {
    const p = get(this._myProfile)
    return p ? p.nickname : "";
  }

  handleNodelink(path: string) {
    this.dispatchEvent(new CustomEvent('select-node', { detail: path, bubbles: true, composed: true }));
  }

  handleDocumentClick(hash: string) {
    console.log("clicked on document", hash)
    this.dispatchEvent(new CustomEvent('select-document', { detail: hash, bubbles: true, composed: true }));
  }

  getPath() : string {
    if (!this.currentUnitEh) {
      return ""
    }
    const unit: Unit = this._units.value[this.currentUnitEh];
    return unit.path()
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

  private async advanceState(unitHash: EntryHashB64, newState: string) {
    const newDocumentHash = await this._store.advanceState(unitHash, newState)
    this.dispatchEvent(new CustomEvent('document-updated', { detail: newDocumentHash, bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent('unit-updated', { detail: newDocumentHash, bubbles: true, composed: true }));
  }

  render() {
    if (!this.currentUnitEh) {
      return;
    }
    /** Get current unit*/
    const unit: Unit = this._units.value[this.currentUnitEh]
    const action: Action = this._unitsActions.value[this.currentUnitEh]

    const path = this.getPath()
    const docInfo = this._store.getCurrentDocument(path)


    // const documents = docs ? docs.filter(doc => !doc.updated).map(docOutput => {
    //   const doc = docOutput.content
    //   const title = doc.getSection("title")
    //   return html`
    //   <div class="document" @click=${()=>this.handleDocumentClick(docOutput.hash)}>
    //     <div class="document-title">${title ? this.renderType(title.contentType,title.content):docOutput.hash}</div>
    // </div>`
    // }) : ""
    let stewards = []
    for (const agentHash of unit.stewards) {
      const agent = this._store.getProfileSync(agentHash)
      if (agent) {
        stewards.push(html`<agent-avatar agent-pub-key="${agentHash}"></agent-avatar>`)
      } else {
        html`<span class="agent" title="${agentHash}">${agentHash}</span>`
      }
    }
    const created = new Date(action.timestamp)
    const creatorHash = serializeHash(action.author)
    const creator = this._store.getProfileSync(creatorHash)
    let stateHTML
    let controlsHTML

    let updated: Date |undefined
    if (docInfo) {
      updated = new Date(docInfo.updated)
      const document = docInfo.content
      controlsHTML = unit
          .nextStatesFrom(document.state)
          .map(
            (nextState) =>
              html`<svg-button 
                @click=${async () => this.advanceState(this.currentUnitEh, nextState)}
                .info=${`move to ${nextState}`}
                .button=${"move"}>
                </svg-button>`
          )
      if (document.state == SysState.Alive) {
        controlsHTML.push(html`
            <svg-button
              .click=${() => this.dispatchEvent(new CustomEvent('add-child', { detail: this.currentUnitEh, bubbles: true, composed: true }))} 
              .info=${"add child"}
              .button=${"plus"}>
            </svg-button> 
          </div>
        `)
        stateHTML = html`<div class="info-item">4/18/22<div class="info-item-name">completion time</div></div>`
      } else if (document.state == SysState.Defunct) {
        stateHTML = html`<div class="info-item">Defunct</div>`
      } else {
        controlsHTML.unshift(
          html`<svg-button
                      button="edit"
                      @click=${() => this.openDoc(docInfo.hash, true)}
                      .info=${"edit"}
                      ></svg-button
                    >`
        )
        stateHTML = html`<div class="info-item">${getCurrentStateName(unit, document.state)}<div class="info-item-name">state: ${document.state}</div></div>`
      }
    } else {
      stateHTML ="Not started.."
    }
    const stateName = docInfo ? docInfo.content.state : ""
    return html`
      <div class="unit row">
        <div class="column">
        <info-item size="26px" .item=${unit.shortName} name="short name"></info-item>
        <info-item .item=${unit.version.slice(4)} .name=${`version (${unit.version.substring(1,4)})`}></info-item>
        <info-item .item=${unit.pathAbbreviation} name="path"></info-item>
        <info-item 
          .title=${`Created on ${created} by ${creator ? creator.nickname : creatorHash}`}
          .item=${created.toLocaleDateString('en-us', { year:"numeric", month:"short", day:"numeric"})} name="created">
        </info-item>
        ${ updated ? html`<info-item title=${`Last modified ${updated}`} .item=${updated.toLocaleDateString('en-us', { year:"numeric", month:"short", day:"numeric"})} name="modified"</info-item>`:''}
        <div class="info-item">${stewards}
        <div class="info-item-name">stewards</div></div>
        </div>
        <div class="column">
          <svg-button class="question-button"
              .click=${() => this._detailsElem!.open()} 
              .button=${"question"}>
            </svg-button> 
          <div class="progress">
            <how-node .unit=${unit} .state=${stateName}> </how-node>
          </div>
          ${stateHTML}
          <div class="column unit-controls">
            ${controlsHTML}
          </div>
        </div>
      </div>
      <how-unit-details id="details-dialog" .state=${stateName}> </how-unit-details>
      <how-document-dialog id="document-dialog"> </how-document-dialog>

    `;
  }


  static get scopedElements() {
    return {
      "mwc-button": Button,
      "how-document-dialog": HowDocumentDialog,
      "how-unit-details": HowUnitDetails,
      "how-node": HowNode,
      "agent-avatar": AgentAvatar,
      "svg-button": SvgButton,
      "info-item": InfoItem,
    };
  }
  static get styles() {
    return [
      sharedStyles,
      css`
      svg-button {
        align-self: flex-end;
      }
      .unit {
        padding: 10px;
      }
      .unit-name {
        font-size: 30px;
        font-weight: bold;
      }
      .unit-controls {
        justify-content: flex-end;
      }
      .progress {
        width: 200px;
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
