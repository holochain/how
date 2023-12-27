import { html, css, LitElement } from "lit";
import { state, property, query } from "lit/decorators.js";

import { get } from "svelte/store";

import { sharedStyles } from "../sharedStyles";
import {howContext, Unit, Dictionary, Initialization, DocumentOutput, Document, DocType, Node, Section, DocumentInitializer, UnitFlags} from "../types";
import { HowStore } from "../how.store";
import { HowUnit } from "./how-unit";
import { HowTree } from "./how-tree";
import { initialTreeHolochain } from "../initHolochain";
import { initialTreeSimple } from "../initSimple";
import { HowUnitDialog } from "./how-unit-dialog";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import {HowDocument } from "./how-document";
import { AsyncReadable, AsyncStatus, StoreSubscriber } from '@holochain-open-dev/stores';
import { aliveImage } from "../images";
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import "@shoelace-style/shoelace/dist/components/dropdown/dropdown.js";
import "@shoelace-style/shoelace/dist/components/menu-item/menu-item.js";
import "@shoelace-style/shoelace/dist/components/menu/menu.js";
import SlDropdown from '@shoelace-style/shoelace/dist/components/dropdown/dropdown.js';

import SlDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import sanitize from "sanitize-filename";

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
import { consume } from '@lit/context';
import { HowMyProfileDialog } from "./how-my-profile-dialog";
import { EntryRecord } from "@holochain-open-dev/utils";
import { isWeContext } from "@lightningrodlabs/we-applet";
//import { HowSettings } from "./how-settings";
//import './how-settings.js';

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

  @consume({ context: howContext, subscribe: true })
  _store!: HowStore;

  @consume({ context: profilesStoreContext, subscribe: true })
  _profiles!: ProfilesStore;


  _myProfile!: StoreSubscriber<AsyncStatus<EntryRecord<Profile> | undefined>>;
  @query("how-my-profile")
  _myProfileDialog!:HowMyProfileDialog


  @query("#file-input")
  _fileInput!: HTMLElement

  _units = new StoreSubscriber(this, () => this._store.units);
  _unitsPath = new StoreSubscriber(this, () => this._store.unitsPath);
  _documentPaths = new StoreSubscriber(this, () => this._store.documentPaths);

  /** Private properties */

  @query('#tree')
  private _tree!: HowTree;
  @query('#document')
  private _document!: HowDocument;
  @query('#settings')
  private _settings!: SlDialog;
  @query('#reparent')
  private _reparentDialog!: SlDialog;
  @state() _reparentingToUnitHash: EntryHashB64 | undefined
  @query('#units-menu')
  private _unitsMenu!: SlDropdown;

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
      await this._profiles.client.createProfile({
        nickname,
        fields,
      });

    } catch (e) {
      //this._existingUsernames[nickname] = true;
      //this._nicknameField.reportValidity();
    }
  }


  get myNickName(): string {
    if (this._myProfile.value.status == "complete") {
      const profile = this._myProfile.value.value;
      if (profile)
        return profile.entry.nickname
    }
    return ""
  }
  get myAvatar(): string {
    if (this._myProfile.value.status == "complete") {
      const profile = this._myProfile.value.value;
      if (profile)
        return profile.entry.fields.avatar
    }
    return ""
  }

  getCurrentPath() : string {
    if (!this._currentUnitEh) {
      return ""
    }
    const unit: Unit = this._units.value[this._currentUnitEh];
    return unit.path()
  }

  private async subscribeProfile() {

    this._myProfile = new StoreSubscriber(
      this,
      () => this._profiles.myProfile
    );
  }

  async firstUpdated() {
    if (this.canLoadDummy) {
      await this.createDummyProfile()
    }
    this.subscribeProfile()
    this.checkInit()
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

  async refresh() {
    console.log("refresh: Pulling data from DHT")
    await this._store.pullUnits();
    await this._store.pullTree();
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
  clickCount = 0
  @state() showInit = false
  adminCheck = () => { 
    this.clickCount += 1
    if (this.clickCount == 5) {
      this.clickCount = 0
      this.showInit = true
    }
  }

  download = (filename: string, text: string) => {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  serializeSection(section:Section) : any {
    const s = {
      name: section.name,
      sectionType: section.sectionType,
      contentType: section.contentType,
      content: section.content,    
      sourcePath: section.sourcePath,
    }
    if (section.sourceUnit) {
      // @ts-ignore
      s.sourceUnit = encodeHashToBase64(section.sourceUnit)
    }
    return s
  }

  serializeDocument(doc: Document) : any {
    return {
      hash: doc.documentHash,
      type: doc.documentType,
      editors: doc.editors,
      sections: doc.content.map(s=>this.serializeSection(s)),
      meta: doc.meta,
      state: doc.state,
      marks: doc.marks
    }
  }

  serializeUnit(hash:string, unit:Unit) :any  {
    return {
        hash,
        parents: unit.parents,
        version: unit.version,
        pathAbbreviation: unit.pathAbbreviation,
        shortName: unit.shortName,
        stewards: unit.stewards,
        processes: unit.processes,
        history: unit.history,
        meta: unit.meta,
      }
  }

  async pullAllDocs(parentPath: string, node:Node):Promise<void> {
    const path = parentPath == "" ? node.val.name : `${parentPath}.${node.val.name}`
    const _docs = await this._store.pullDocuments(path)
    for (const c of node.children) {
      await this.pullAllDocs(path, c)
    }
  }

  serializeNode(path: string, node:Node, units:Dictionary<Unit> ) : any  {
    const docs = get(this._store.documents)

    return {
      id: node.id,
      val: {
        name: node.val.name,
        units: node.val.units.map(u=>{
          const unitHash = encodeHashToBase64(u.hash)
          return { 
            unit: this.serializeUnit(unitHash, units[unitHash]),
            version: u.version,
            state: u.state,
          }}),
        documents: node.val.documents.map(h=>{
          const d = docs[encodeHashToBase64(h)]
          if (!d) {
            return {error:"not found",hash:encodeHashToBase64(h)}
          }
          return this.serializeDocument(d)
         }),
        children: node.children.map(c=> this.serializeNode(path == "" ? node.val.name : `${path}.${node.val.name}`, c, units))
      }
    }
  }

  async doReparent() {
    if (this._reparentingToUnitHash) {
      const newParent = this._units.value[this._reparentingToUnitHash].path()
      const path = this._units.value[this._currentUnitEh].path()
      console.log("Move ", path, "->", newParent)
      await this._store.reparent(path, newParent)
    }
    // cleanup
    this._reparentDialog.hide()
    this._reparentingToUnitHash = undefined
  }

  async handleReparent(event: any) {
    await this._store.pullUnits()
    this._reparentDialog.show()
  }

  async doExport() {
    const rawTree = await this._store.pullTree()
    await this.pullAllDocs("", rawTree)
    const rawUnits = await this._store.pullUnits()
    const tree = this.serializeNode("", rawTree, rawUnits)
    const exportJSON= JSON.stringify(
      {
        tree,
      //  documents,
       // units,
      }
      )
    const fileName = sanitize(`how.json`)
    this.download(fileName, exportJSON)
    alert(`exported as: ${fileName}`)
  }
  async doInitializeDHT(init:Initialization) {
    if (this.initializing || this.initialized) {
      console.log("initialization allready started")
      return;
    }
    console.log("starting initialization")
    this.initializing = true  // because checkInit gets call whenever profiles changes...
    await this._store.initilize(init);
    this.initializing = false
    console.log("initialization complete")
    this.checkInit()
  }

  async addInitialHolochain() {
    const init  = initialTreeHolochain(this._store.myAgentPubKey)

    await this.doInitializeDHT(init)
  }

  async addInitialSimple() {
    const init  = initialTreeSimple(this._store.myAgentPubKey)

    await this.doInitializeDHT(init)
  }

  async checkInit() {
    let units = await this._store.pullUnits();
    await this._store.pullTree();

    if (Object.keys(units).length > 0) {
      this.initialized = true
    }
  }

  dataFromImport(parentPath:string, node:any ): [Array<[string,Unit]>, Array<DocumentInitializer>] {
    let units: Array<[string,Unit]> = []
    let documents: Array<DocumentInitializer> = []

    for (const unitInfo of node.val.units) {
      const unit:any = unitInfo.unit
      units.push([unitInfo.state, new Unit({
        parents: unit.parents, // full paths to parent nodes (remember it's a DAG)
        version: unitInfo.version,
        pathAbbreviation: unit.pathAbbreviation, // max 10 char
        shortName: unit.shortName, // max 25 char
        stewards: [this._store.myAgentPubKey], // people who can change this document
        processes: unit.processes,
      })])
    }
    const path = parentPath == "" ? node.val.name : `${parentPath}.${node.val.name}`
    console.log("importing:", path)
    for (const doc of node.val.documents) {
      documents.push(
        {
          path,
          documentType: doc.type,
          content:doc.sections,
          editors:[this._store.myAgentPubKey],
          meta: doc.meta
        }
      )
    }
    for (const n of node.val.children) {
      const [u,d] = this.dataFromImport(path, n)
      units = units.concat(u)
      documents = documents.concat(d)
    }
    return [units,documents]
  }

  initializationFromImport(importData: any) : Initialization {
    console.log("creating initialization structs..")
    const [units, documents] = this.dataFromImport("", importData.tree)
    const init: Initialization = {
      units,
      documents,
    }
    return init
  }

  onFileSelected = (e:any)=>{
    let file = e.target.files[0];
    let reader = new FileReader();

    reader.addEventListener("load", async () => {
        console.log("import file loaded, parsing...")
        const b = JSON.parse(reader.result as string)
        const init:Initialization  = this.initializationFromImport(b)
        await this.doInitializeDHT(init)
    }, false);
    reader.readAsText(file);
  }

  render() {
    if (!this.initialized) {
      return html`

      <div class="initializing">
        <input id="file-input" style="display:none" type="file" accept=".json" @change=${(e:any)=>{console.log("FISH");this.onFileSelected(e)}} >
        <div class="wrapper">
          <div class="about-event"/>
            <img class="how-welcome" src=${aliveImage}
            @click=${()=>this.adminCheck()}>
            <h3>Welcome to How!</h3>
            <p>Either your node hasn't synchronized yet with the network, or you are the first one here! 
            ${this.showInit ? html`
            <h3>Initialize with: </h3>
            <mwc-button
              id="primary-action-button"
              slot="primaryAction"
              @click=${()=>this.addInitialSimple()}
              >Default Tree</mwc-button
            > 
            or<br />
            <mwc-button
              id="primary-action-button"
              slot="primaryAction"
              @click=${()=>this.addInitialHolochain()}
              >Holochain Community Standards</mwc-button
            > 
            or<br />
            <mwc-button
              id="primary-action-button"
              slot="primaryAction"
              @click=${()=>this._fileInput.click()}
              >Import JSON File</mwc-button
            > 
            
            ` : html`
            <mwc-button
              id="primary-action-button"
              slot="primaryAction"
              @click=${()=>this.checkInit()}
              >Reload</mwc-button
            > 
            `}
            </p>
          </div>
        </div>
      </div>
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
        @reparent=${this.handleReparent}
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

  <how-my-profile></how-my-profile>
  <sl-dialog id="settings" label="Settings">
      <sl-button
      @click=${async ()=>{await this.doExport()}}>Export</sl-button>
      </sl-dialog>

  ${this._currentUnitEh ? html`
    <sl-dialog id="reparent" label="Reparent">
      <sl-dropdown id="units-menu">
          <sl-button slot="trigger"
            @click=${(e:any)=>{
              e.stopPropagation()
              this._unitsMenu.show()
            }}
          >
          ${this._reparentingToUnitHash ? this._units.value[this._reparentingToUnitHash].path() : "Select new parent"}
          </sl-button>

          <sl-menu  style="max-width: 100px;"
            @mouseleave=${()=> this._unitsMenu.hide()}
            @click=${(e:any)=>e.stopPropagation()}
            @sl-select=${(e:any)=>{
              this._reparentingToUnitHash = e.detail.item.value
              this._unitsMenu.hide()
            }}>
            ${
              Object.entries(this._units.value).filter(([_,unit])=>{
                const currentUnit = this._units.value[this._currentUnitEh]
                const currentPath = currentUnit.path()
                const unitPath = unit.path()
                let current_path_parent = ""
                if (currentUnit) {
                  const p = currentPath.split(".")
                  p.pop()
                  current_path_parent = p.join(".")
                }
                return !unitPath.startsWith(currentPath) && (unitPath != current_path_parent)
              }).map(([key, unit]) => html`
            <sl-menu-item value=${key}>
              ${unit.path() == "" ? "<Root>" : unit.path()}
            </sl-menu-item>
              `)
             }
          </sl-menu>
        </sl-dropdown>
      <sl-button
      @click=${async ()=>{await this.doReparent()}}>Do it!</sl-button>
    </sl-dialog>
    ` : ""}
  <div>

    <div id="top-bar" class="row">
      <div id="top-bar-title">How ${this._currentUnitEh ? ` - ${this._units.value[this._currentUnitEh].shortName}` : ''}</div>
      <mwc-icon-button icon="view_module"  @click=${this.toggleTreeType}></mwc-icon-button>
      ${!isWeContext() ? html`<mwc-icon-button icon="account_circle" @click=${() => {this._myProfileDialog.open()}}></mwc-icon-button>`:''}
      <mwc-icon-button icon="settings" @click=${() => {this._settings.show()}}></mwc-icon-button>
    </div>

    <div class="appBody column">
      <div class="row"> 
      ${tree}
      ${unit}
      </div>
      ${document}    
    </div>
    <how-unit-dialog id="unit-dialog"
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
      'how-my-profile': HowMyProfileDialog,
//      'how-settings': HowSettings,
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
        .initializing {
          width: 100vw;
          display: block;
          height: 100vh;
          background-image: url(/images/dweb-background.jpg);
          background-size: cover;
          overflow-y: scroll;
        }

        .initializing .wrapper {
          display: block;
          height: 100%;
          max-width: 320px;
          margin: 0 auto;
        }


        .about-event {
          padding: 20px;
          
        }
        .about-event h3 {
          text-align: center;
        }

        .about-event p {
          font-size: 14px;
          text-align: center;
          margin-top: 15px;
          margin-bottom: 0;
        }
        .how-welcome {
          width: 200px;
          margin: 0 auto;
          display: block;
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
