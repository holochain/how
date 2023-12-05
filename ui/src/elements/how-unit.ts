import {css, html, LitElement} from "lit";
import {property, query, state} from "lit/decorators.js";

import {StoreSubscriber} from "lit-svelte-stores";

import {sharedStyles} from "../sharedStyles";
import {Unit, DocType, howContext, SysState, Document, UnitInfo} from "../types";
import {HowStore} from "../how.store";
import { HowUnitDetails } from "./how-unit-details";
import { SvgButton } from "./svg-button";
import { HowNode } from "./how-node";

import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {
  Button,
} from "@scoped-elements/material-web";
import { Action, EntryHashB64, encodeHashToBase64 } from "@holochain/client";
import { InfoItem } from "./info-item";
import { HowConfirm } from "./how-confirm";
import { consume } from '@lit-labs/context';
import { Profile, ProfilesStore, profilesStoreContext } from "@holochain-open-dev/profiles";

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
  @state() versionIndex: number | undefined = undefined;

  @consume({ context: howContext, subscribe: true })
  _store!: HowStore;

  @consume({ context: profilesStoreContext, subscribe: true })
  _profiles!: ProfilesStore;

  _allProfiles  = new StoreSubscriber(this, () =>
    this._profiles.allProfiles
  );
  
  _units = new StoreSubscriber(this, () => this._store.units);
  _unitsActions = new StoreSubscriber(this, () => this._store.unitsAction);
  _unitsInfos = new StoreSubscriber(this, () => this._store.unitsInfo);
  _documents = new StoreSubscriber(this, () => this._store.documents);
  _documentPaths = new StoreSubscriber(this, () => this._store.documentPaths);

  @query('how-unit-details')
  _detailsElem!: HowUnitDetails;

  @query('how-confirm')
  _confirmElem!: HowConfirm;

  handleNodelink(path: string) {
    this.dispatchEvent(new CustomEvent('select-node', { detail: path, bubbles: true, composed: true }));
  }

  handleDocumentClick(hash: EntryHashB64, readOnly: boolean) {
    this.dispatchEvent(new CustomEvent('select-document', { detail: {hash, readOnly}, bubbles: true, composed: true }));
  }

  getPath() : string {
    if (!this.currentUnitEh) {
      return ""
    }
    const unit: Unit = this._units.value[this.currentUnitEh];
    return unit.path()
  }

  renderType(type: String, content: String) : String {
    return content
  }

  private async confirmAdvance(unitHash: EntryHashB64, newState: string) {
    let message = ""
    if (newState == SysState.Defunct) {
      message = "Are you sure you want to move this item to Defunct?  This can not be undone."
    } else {
      const unit: Unit = this._units.value[this.currentUnitEh]
      const unitInfo: UnitInfo = this._unitsInfos.value[this.currentUnitEh]
      const process_path = unit.processPathForState(unitInfo.state)
      // TODO we should be using a unitHash, not a process path to prevent dups
      const docInfo = await this._store.getCurrentDocumentPull(process_path, undefined)
      const threshold = docInfo?.content.getSection("threshold")
      if (threshold) {
        message = threshold.content
      }
    }
    this._confirmElem!.open(message, {unitHash, newState})
  }

  private async handleConfirm(confirmation:any) {
    const unitHash: EntryHashB64 = confirmation.unitHash
    const nextState: string = confirmation.newState
    this.advanceState(unitHash, nextState)
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
    const unitInfo: UnitInfo = this._unitsInfos.value[this.currentUnitEh]
    const action: Action = this._unitsActions.value[this.currentUnitEh]

    const path = this.getPath()
    const docInfo = this._store.getCurrentDocument(path, this.currentUnitEh)
    let allDocs = this._store.getDocumentsFiltered(path, this.currentUnitEh , DocType.Document, false)

    const isSteward = unit.stewards.includes(this._store.myAgentPubKey)
    let stewardsHTML = html`<how-agent-list .agents=${unit.stewards}></how-agent-list>`

    
    const created = new Date(action.timestamp)
    const creatorHash = encodeHashToBase64(action.author)
    let creator: Profile |undefined = undefined
    if (this._allProfiles.value.status == "complete") {
      const record = this._allProfiles.value.value.get(action.author)
      if (record) {
        creator = record.entry
      }
    }
    let stateHTML
    let controlsHTML:any[] = []

    let updated: Date |undefined
    let state 
    if (docInfo) {
      updated = new Date(docInfo.updated)
      const document = docInfo.content
      state = document.state
      if (isSteward  && document.getStats().emptySections == 0) {
        controlsHTML = controlsHTML.concat(unit
            .nextStatesFrom(document.state)
            .map(
              (nextState) =>
                html`<svg-button 
                  .click=${() => this.confirmAdvance(this.currentUnitEh, nextState)}
                  .info=${`move to ${nextState}`}
                  .button=${nextState == SysState.Defunct ? "defunct" : "move"}>
                  </svg-button>`
            ))
      }
    } else {
      state = unitInfo.state
    }
    if (state == SysState.Alive && isSteward) {
      controlsHTML.push(html`
          <svg-button
            .click=${() => this.dispatchEvent(new CustomEvent('add-child', { detail: this.currentUnitEh, bubbles: true, composed: true }))} 
            .info=${"add child"}
            .button=${"plus"}>
          </svg-button> 
        </div>
      `)
      if (updated) {
        stateHTML = html`<info-item title=${`Alive as of ${updated}`} item="Alive" .name=${`as of ${updated.toLocaleDateString('en-us', { year:"numeric", month:"short", day:"numeric"})}`}></info-item>`
      } else {
        stateHTML = html`<info-item item="Alive"></info-item>`
      }
    } else if (state == SysState.Defunct) {
      stateHTML = html`<info-item item="Defunct"></info-item >`
    } else {
      stateHTML = html`<div class="info-item">${getCurrentStateName(unit, state)}<div class="info-item-name">state: ${state}</div></div>`
    }
    const stateName = docInfo ? docInfo.content.state : unitInfo.state

    let historyHTML
    if (allDocs.length > 1) {
      const historyItemsHTML = []
      for (let i=allDocs.length-1; i>= 0;i-=1){
        const date = new Date(allDocs[i].actions[0].content.timestamp/1000)
        historyItemsHTML.push(html`
          <mwc-list-item value=${i} @click=${()=>this.handleDocumentClick(allDocs[i].hash, i!=allDocs.length-1)}>
          ${i==allDocs.length-1 ? "Current:":''} ${date.toLocaleDateString('en-us', { year:"numeric", month:"short", day:"numeric"})} ${date.toLocaleTimeString('en-US')}
          </mwc-list-item>`) 
      }
      historyHTML = html`
      <div class="history row">
        <mwc-select
          class="history-item" 
          label="Change History" 
          @closing=${(e: any) => e.stopPropagation()}
          >
        ${historyItemsHTML}
        </mwc-select>
      </div>`
    } 
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
        ${ updated ? html`<info-item title=${`Last modified ${updated}`} .item=${updated.toLocaleDateString('en-us', { year:"numeric", month:"short", day:"numeric"})} name="modified"></info-item>`:''}
        <div class="info-item">${stewardsHTML}
        <div class="info-item-name">stewards</div></div>
        </div>
        <div class="column">
          <svg-button class="question-button"
              .click=${() => this._detailsElem!.open()} 
              .button=${"question"}>
            </svg-button> 
          <div class="progress">
            <how-node .unit=${unit} .state=${stateName} .progress=${docInfo?.content.getProgress()}> </how-node>
          </div>
          ${stateHTML}
          <div class="column unit-controls">
            ${controlsHTML}
          </div>
        </div>
      </div>
      ${historyHTML}
      <how-unit-details id="details-dialog" .state=${stateName}> </how-unit-details>
      <how-confirm @confirmed=${(e:any) => this.handleConfirm(e.detail)}></how-confirm>
    `;
  }


  static get scopedElements() {
    return {
      "mwc-button": Button,
      "how-unit-details": HowUnitDetails,
      "how-node": HowNode,
      "svg-button": SvgButton,
      "info-item": InfoItem,
      "how-confirm": HowConfirm,
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
      .history-item {
        width: 340px;
      }
      `,
    ];
  }
}
