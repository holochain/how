import {css, html, LitElement} from "lit";
import {property, query, state} from "lit/decorators.js";

import { StoreSubscriber } from '@holochain-open-dev/stores';

import {sharedStyles} from "../sharedStyles";
import {Unit, DocType, howContext, SysState, Document, UnitInfo, UnitFlags, SectionType, Section} from "../types";
import {HowStore} from "../how.store";
import { HowUnitDetails } from "./how-unit-details";
import { SvgButton } from "./svg-button";
import { HowNode } from "./how-node";

import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {
  Button,
} from "@scoped-elements/material-web";
import { Action, EntryHashB64, decodeHashFromBase64, encodeHashToBase64 } from "@holochain/client";
import { InfoItem } from "./info-item";
import { HowConfirm } from "./how-confirm";
import { HowCollect } from "./how-collect";
import { consume } from '@lit/context';
import { Profile, ProfilesStore, profilesStoreContext } from "@holochain-open-dev/profiles";
import { underConstructionImage } from "../images";

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

  @query('how-collect')
  _collectElem!: HowCollect;

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
    } else if (newState == SysState.Alive && this._unitsInfos.value[this.currentUnitEh].state == SysState.UnderConstruction) {
      message = "Are you sure you want to move this under construction unit to Alive?"
    } else if (newState == SysState.UnderConstruction) {
      message = "Are you sure you want to move this unit to under construction?"
    }
    else {
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

  private async handleConfirmAdvance(confirmation:any) {
    const unitHash: EntryHashB64 = confirmation.unitHash
    const nextState: string = confirmation.newState
    this.advanceState(unitHash, nextState)
  }

  private async advanceState(unitHash: EntryHashB64, newState: string) {
    const newDocumentHash = await this._store.advanceState(unitHash, newState)
    this.dispatchEvent(new CustomEvent('document-updated', { detail: newDocumentHash, bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent('unit-updated', { detail: newDocumentHash, bubbles: true, composed: true }));
  }

  private async confirmCollect(def: Section) {
    this._collectElem!.open(def)
  }

  private async handleConfirmCollect(version:string, def:Section) {
    const path = this.getPath()
    const sections = await this._store.getCollectionSections(path)
    sections.unshift({
      name: "title",
      sourcePath: path,
      sectionType: SectionType.Content,
      contentType: "text/plain",
      content: def.name,
    })
    if (sections.length > 0) {
      const collection = new Document({
        unitHash: decodeHashFromBase64(this.currentUnitEh), 
        documentType: DocType.Collection,
        content: sections,
        meta: {version}
      })
      this._store.addDocument(path, collection)
    }
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
    let collections = this._store.getDocumentsFiltered(path, this.currentUnitEh , DocType.Collection, false)

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
      if (state != SysState.UnderConstruction && isSteward  && document.getStats().emptySections == 0) {
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
        controlsHTML.push(html`
            <svg-button
              .click=${() => this.confirmAdvance(this.currentUnitEh, SysState.UnderConstruction)}
              .info=${"move to construction"}
              .button=${"move"}>
            </svg-button> 
          </div>
        `)
  
        }
    } else {
      state = unitInfo.state
    }
    if ( (state == SysState.UnderConstruction || state == SysState.Alive) && isSteward) {
      controlsHTML.push(html`
          <svg-button
            .click=${() => this.dispatchEvent(new CustomEvent('add-child', { detail: this.currentUnitEh, bubbles: true, composed: true }))} 
            .info=${"add child"}
            .button=${"plus"}>
          </svg-button>
        </div>
      `)
      if (state == SysState.UnderConstruction  && isSteward) {
        controlsHTML.push(html`
          <svg-button
            .click=${() => this.dispatchEvent(new CustomEvent('edit', { detail: this.currentUnitEh, bubbles: true, composed: true }))} 
            .info=${"edit"}
            .button=${"edit"}>
          </svg-button>
          <svg-button
            .click=${() => this.confirmAdvance(this.currentUnitEh, SysState.Alive)}
            .info=${"make alive"}
            .button=${"move"}>
          </svg-button> 
        </div>
      `)
      }
      if (isSteward && docInfo && docInfo.content) {
        const collectionDefs = docInfo.content.getSectionsByType(SectionType.CollectionDef)
        collectionDefs.forEach(def => {
          controlsHTML.push(html`
              <svg-button
                .click=${() => this.confirmCollect(def)} 
                .info=${"collect "+def.name}
                .button=${"collect"}>
              </svg-button>
            </div>
          `)
        }); 
      }
      if (state != SysState.UnderConstruction ) {
        if (updated) {
          stateHTML = html`<info-item title=${`Alive as of ${updated}`} item="Alive" .name=${`as of ${updated.toLocaleDateString('en-us', { year:"numeric", month:"short", day:"numeric"})}`}></info-item>`
        } else {
          stateHTML = html`<info-item item="Alive"></info-item>`
        }
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

    let collectionsHTML
    if (collections.length > 0) {
      const collectionItemsHTML = []
      for (let i=collections.length-1; i>= 0;i-=1){
        const date = new Date(collections[i].actions[0].content.timestamp/1000)
        const docOutput = collections[i]
        const doc = docOutput.content
        let title = doc.getSection("title")

        collectionItemsHTML.push(html`
          <mwc-list-item value=${i} @click=${()=>this.handleDocumentClick(docOutput.hash, true)}>
          ${title ? title.content : ""} version: ${doc.meta.version}
          </mwc-list-item>`) 
      }
      collectionsHTML = html`
      <div class="history row">
        <mwc-select
          class="history-item" 
          label="Collections" 
          @closing=${(e: any) => e.stopPropagation()}
          >
        ${collectionItemsHTML}
        </mwc-select>
      </div>`
    } 

    return html`
      <div class="unit row">
        <div class="column">
          <info-item size="26px" .item=${unit.shortName} name="short name"></info-item>
          <info-item .item=${unit.version.split(":")[1]} .name=${`version (${unit.version.split(":")[0]})`}></info-item>
          <info-item .item=${unit.pathAbbreviation} name="path"></info-item>
          <info-item 
            .title=${`Created on ${created} by ${creator ? creator.nickname : creatorHash}`}
            .item=${created.toLocaleDateString('en-us', { year:"numeric", month:"short", day:"numeric"})} name="created">
          </info-item>
          ${ updated ? html`<info-item title=${`Last modified ${updated}`} .item=${updated.toLocaleDateString('en-us', { year:"numeric", month:"short", day:"numeric"})} name="modified"></info-item>`:''}
          <div class="info-item">${stewardsHTML}
            <div class="info-item-name">stewards</div>
          </div>
        </div>
        <div class="column">
          <svg-button class="question-button"
              .click=${() => this._detailsElem!.open()} 
              .button=${"question"}>
          </svg-button> 
          <div class="progress">
            ${ state == SysState.UnderConstruction  ?
             html`<img style="width: 100%;" src=${underConstructionImage}>` :
             html`<how-node .unit=${unit} .state=${stateName} .progress=${docInfo?.content.getProgress()}> </how-node>`}
          </div>
          ${state == SysState.UnderConstruction ? html`<span style="margin:auto;background:yellow;border: 1px solid;padding:5px">Under Construction</span>` : ""}
          ${stateHTML}
          <div class="column unit-controls">
            ${controlsHTML}
          </div>
        </div>
      </div>
      ${historyHTML}
      ${collectionsHTML}
      <how-unit-details id="details-dialog" .state=${stateName}> </how-unit-details>
      <how-confirm @confirmed=${(e:any) => this.handleConfirmAdvance(e.detail)}></how-confirm>
      <how-collect @collect=${(e:any) => this.handleConfirmCollect(e.detail.version, e.detail.def)}></how-collect>
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
      "how-collect": HowCollect,
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
