import { html, css, LitElement } from "lit";
import { state, property, query } from "lit/decorators.js";

import { contextProvided } from "@lit-labs/context";
import { StoreSubscriber } from "lit-svelte-stores";
import { Unsubscriber, Readable, get } from "svelte/store";

import { sharedStyles } from "../sharedStyles";
import {howContext, Unit, Dictionary, Initialization, DocumentOutput, Document, DocType} from "../types";
import { HowStore } from "../how.store";
import { HowUnit } from "./how-unit";
import { HowTree } from "./how-tree";
import { initialTree } from "../init";
import { HowUnitDialog } from "./how-unit-dialog";
import { SlAvatar } from '@scoped-elements/shoelace';
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import {HowDocument } from "./how-document";

import {
  ListItem,
  Select,
  IconButton,
  Button, TextField, List, Icon,
} from "@scoped-elements/material-web";
import {
  profilesStoreContext,
  ProfilesStore,
  Profile,
} from "@holochain-open-dev/profiles";
import {EntryHashB64, encodeHashToBase64} from "@holochain/client";

/**
 * @element how-controller
 */
export class HowController extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  /** Public attributes */
  @property({ type: Boolean, attribute: 'dummy' })
  canLoadDummy = false;

  /** Dependencies */

  @contextProvided({ context: howContext })
  _store!: HowStore;

  @contextProvided({ context: profilesStoreContext })
  _profiles!: ProfilesStore;

  _myProfile!: Readable<Profile | undefined> ;
  _units = new StoreSubscriber(this, () => this._store.units);
  _unitsPath = new StoreSubscriber(this, () => this._store.unitsPath);
  _documentPaths = new StoreSubscriber(this, () => this._store.documentPaths);

  /** Private properties */

  @query('#tree')
  private _tree!: HowTree;
  @query('#document')
  private _document!: HowDocument;

  @state() _currentUnitEh = "";
  @state() _currentDocumentEh = "";
  @state() _documentReadOnly = false;
  @state() _treeType = "tree";

  @state()
  private initialized = false;
  private initializing = false;


  async createDummyProfile() {
    const nickname = "Cam";
    const avatar = "https://cdn3.iconfinder.com/data/icons/avatars-9/145/Avatar_Cat-512.png";

    try {
      const fields: Dictionary<string> = {};
       if (avatar) {
         fields['avatar'] = avatar;
       }
      await this._profiles.createProfile({
        nickname,
        fields,
      });

    } catch (e) {
      //this._existingUsernames[nickname] = true;
      //this._nicknameField.reportValidity();
    }
  }


  get myNickName(): string {
    const p = get(this._myProfile)
    return p ? p.nickname : "";
  }
  get myAvatar(): string {
    const p = get(this._myProfile)
    return p ? p.fields.avatar : "";
  }

  getCurrentPath() : string {
    if (!this._currentUnitEh) {
      return ""
    }
    const unit: Unit = this._units.value[this._currentUnitEh];
    return unit.path()
  }

  private async subscribeProfile() {

    this._myProfile = await this._profiles.fetchMyProfile()
  }

  async firstUpdated() {
    if (this.canLoadDummy) {
      await this.createDummyProfile()
    }
    this.subscribeProfile()
  }
 
  private _getFirst(units: Dictionary<Unit>): EntryHashB64 {
    if (Object.keys(units).length == 0) {
      return "";
    }
    for (let unitEh in units) {
//      const unit = units[unitEh]
//      if (unit.visible) {
        return unitEh
//      }
    }
    return "";
  }

  async checkInit() {
    if (this.initialized || this.initializing) {
      this.initialized = true;
      return;
    }
    this.initializing = true  // because checkInit gets call whenever profiles changes...
    let units = await this._store.pullUnits();
    await this._store.pullTree();

    /** load up a unit if there are none */
    if (Object.keys(units).length == 0) {
      console.log("no units found, initializing")
      await this.addHardcodedUnits();
      units = await this._store.pullUnits();
      await this._store.pullTree();
    }
    if (Object.keys(units).length == 0) {
      console.error("No units found")
    }
   // this._currentUnitEh = this._getFirst(units);

    //console.log("   current unit: ",  units[this._currentUnitEh].shortName, this._currentUnitEh);

    // - Done
    this.initializing = false
    this.initialized = true
  }

  async addHardcodedUnits() {
    const init:Initialization = initialTree(this._store.myAgentPubKey)
    await this._store.initilize(init);
    this._store.pullDocuments("soc_proto.process.define.declaration")
  }

  async refresh() {
    console.log("refresh: Pulling data from DHT")
    await this._store.pullUnits();
    await this._store.pullTree();
    await this._profiles.fetchAllProfiles()
  }

  get unitElem(): HowUnit {
    return this.shadowRoot!.getElementById("how-unit") as HowUnit;
  }

  async openUnitDialog(parent?: any) {
    this.unitDialogElem.open(parent);
  }

  get unitDialogElem() : HowUnitDialog {
    return this.shadowRoot!.getElementById("unit-dialog") as HowUnitDialog;
  }

  private async handleUnitSelect(unitEh: EntryHashB64): Promise<void> {
    if (this._units.value[unitEh]) {
      this._currentUnitEh = unitEh;
      this.unitElem.currentUnitEh = unitEh;
      this._tree.currentNode = unitEh;
      await this._store.pullDocuments(this.getCurrentPath())
      let docs = this._store.getDocumentsFiltered(this.getCurrentPath(), unitEh,DocType.Document, true)
      if (docs.length > 0) {
        this._currentDocumentEh = docs[docs.length-1].hash
        this._documentReadOnly = false
      }
      else {
        this._currentDocumentEh = ""
      }
    }
  }

  getUnitDocuments(unitEh: EntryHashB64, docType: DocType): Array<DocumentOutput> {
    const path = this.getCurrentPath()
    const docs = this._documentPaths.value[path]
    if (!docs) {
      return []
    }
    return docs
        .filter(d=>d.content.documentType==docType && encodeHashToBase64(d.content.unitHash) ==unitEh)
  }

  handleNodeSelected(event: any) {
    this.handleUnitSelect(event.detail)
  }

  handleAddChild(event: any) {
    const unitEh = event.detail
    this.openUnitDialog(unitEh)
  }

  private isTreeType() : boolean {
    if (!this._tree) return false
    return this._treeType == "tree"
  }
  toggleTreeType() {
    this._tree.treeType = this._tree.treeType == "tree"?"file-tree":"tree"
    this._treeType = this._tree.treeType
  }
  async handleDocumentUpdated(e:any) {
    await this._store.pullDocuments(this.getCurrentPath())
    await this._store.pullTree()

    this._currentDocumentEh = e.detail
    this._documentReadOnly = false
  }
  async handleUnitUpdated(e:any) {
    await this._store.pullTree()
  }
  selectDocumentVersion(hash: EntryHashB64, readOnly: boolean) {
    this._currentDocumentEh = hash
    this._documentReadOnly = readOnly
  }
  render() {
    if (!this.initialized) {
      return html`
      <mwc-button
          id="primary-action-button"
          slot="primaryAction"
          @click=${()=>this.checkInit()}
          >Initialize</mwc-button
        > 
      `
    }
    const tree = html`
      <how-tree id="tree"
        .treeType=${this._treeType}
        @node-selected=${this.handleNodeSelected}
        @add-child=${this.handleAddChild}>
      </how-tree>`
    const unit = html`
    <how-unit id="how-unit" .currentUnitEh=${this._currentUnitEh}
        @document-updated=${this.handleDocumentUpdated}
        @unit-updated=${this.handleUnitUpdated}
        @select-document=${(e:any)=>this.selectDocumentVersion(e.detail.hash, e.detail.readOnly)}
        @select-node=${(e: any)=>{const hash = this._unitsPath.value[e.detail]; this.handleUnitSelect(hash)}}
        @add-child=${this.handleAddChild}
     />`
     const document = this._currentDocumentEh ? 
     html`<how-document id="document" 
          .currentDocumentEh=${this._currentDocumentEh}
          .readOnly=${this._documentReadOnly}
          @document-updated=${this.handleDocumentUpdated}
          .path=${this.getCurrentPath()}
     >
    </how-document>` : ""
    return html`


  <div>
    <div id="top-bar" class="row">
      <div id="top-bar-title">How ${this._currentUnitEh ? ` - ${this._units.value[this._currentUnitEh].shortName}` : ''}</div>
      <mwc-icon-button icon="view_module"  @click=${this.toggleTreeType}></mwc-icon-button>
      <mwc-icon-button icon="account_circle" @click=${() => {alert("TBD: edit account")}}></mwc-icon-button>
      <mwc-icon-button icon="settings" @click=${() => {alert("TBD: settings")}}></mwc-icon-button>
    </div>

    <div class="appBody column">
      <div class="row"> 
      ${tree}
      ${unit}
      </div>
      ${document}    
    </div>
    <how-unit-dialog id="unit-dialog"
                        .myProfile=${get(this._myProfile)}
                        @unit-added=${(e:any)=>{this.handleNodeSelected(e); this.refresh();}}>
    </how-unit-dialog>
  </div>

`;
  }


  static get scopedElements() {
    return {
      "mwc-textfield": TextField,
      "mwc-select": Select,
      "mwc-list": List,
      "mwc-list-item": ListItem,
      "mwc-icon": Icon,
      "mwc-icon-button": IconButton,
      "mwc-button": Button,
      "how-unit-dialog" : HowUnitDialog,
      "how-unit": HowUnit,
      "how-tree": HowTree,
      "how-document": HowDocument,
    };
  }

  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          font-family: Roboto,'Open Sans','Helvetica Neue',sans-serif;
        }

        #top-bar {
          margin: 10px;
          align-items: center;
          justify-content: flex-end;
        }
        #top-bar-title {
          font-size: 1.5em;
          font-weight: bold;
          margin-right: auto;
        }
        #document {
          border-top: solid .1em #888;
        }
        .appBody {
          margin-top: 10px;
          margin-left: 20px;
          margin-right: 20px;
          margin-bottom: 20px;
          display:flex;
        }

        mwc-textfield.rounded {
          --mdc-shape-small: 20px;
          width: 7em;
          margin-top:10px;
        }

        mwc-textfield label {
          padding: 0px;
        }

        @media (min-width: 640px) {
          main {
            max-width: none;
          }
        }
      `,
    ];
  }
}
