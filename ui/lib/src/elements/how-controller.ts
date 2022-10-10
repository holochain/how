import { html, css, LitElement } from "lit";
import { state, property, query } from "lit/decorators.js";

import { contextProvided } from "@lit-labs/context";
import { StoreSubscriber } from "lit-svelte-stores";
import { Unsubscriber, Readable, get } from "svelte/store";

import { sharedStyles } from "../sharedStyles";
import {howContext, Alignment, Dictionary, Initialization, DocumentOutput} from "../types";
import { HowStore } from "../how.store";
import { HowAlignment } from "./how-alignment";
import { HowTree } from "./how-tree";
import { initialTree } from "../init";
import { HowAlignmentDialog } from "./how-alignment-dialog";
import { SlAvatar } from '@scoped-elements/shoelace';
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import {HowDocument } from "./how-document";

import {
  ListItem,
  Select,
  IconButton,
  Button, TextField, TopAppBar, Drawer, List, Icon, Switch, Formfield,
} from "@scoped-elements/material-web";
import {
  profilesStoreContext,
  ProfilesStore,
  Profile,
} from "@holochain-open-dev/profiles";
import {EntryHashB64} from "@holochain-open-dev/core-types";

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
  _alignments = new StoreSubscriber(this, () => this._store.alignments);
  _alignmentsPath = new StoreSubscriber(this, () => this._store.alignmentsPath);
  _documentPaths = new StoreSubscriber(this, () => this._store.documentPaths);

  /** Private properties */

  @query('#my-drawer')
  private _drawer!: Drawer;

  @query('#tree')
  private _tree!: HowTree;
  @query('#document')
  private _document!: HowDocument;

  @state() _currentAlignmentEh = "";
  @state() _currentDocumentEh = "";
  @state() _treeType = "tree";

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
    if (!this._currentAlignmentEh) {
      return ""
    }
    const alignment: Alignment = this._alignments.value[this._currentAlignmentEh];
    return alignment.parents.length > 0 ? `${alignment.parents[0]}.${alignment.pathAbbreviation}` : alignment.pathAbbreviation
  }

  private async subscribeProfile() {

    this._myProfile = await this._profiles.fetchMyProfile()
      if (this._myProfile) {
        await this.checkInit();
      }
  }

  async firstUpdated() {
    if (this.canLoadDummy) {
      await this.createDummyProfile()
    }
    this.subscribeProfile()
  }
 
  private _getFirst(alignments: Dictionary<Alignment>): EntryHashB64 {
    if (Object.keys(alignments).length == 0) {
      return "";
    }
    for (let alignmentEh in alignments) {
//      const alignment = alignments[alignmentEh]
//      if (alignment.visible) {
        return alignmentEh
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
    let alignments = await this._store.pullAlignments();
    await this._store.pullTree();

    /** load up a alignment if there are none */
    if (Object.keys(alignments).length == 0) {
      console.log("no alignments found, initializing")
      await this.addHardcodedAlignments();
      alignments = await this._store.pullAlignments();
      await this._store.pullTree();
    }
    if (Object.keys(alignments).length == 0) {
      console.error("No alignments found")
    }
   // this._currentAlignmentEh = this._getFirst(alignments);

    //console.log("   current alignment: ",  alignments[this._currentAlignmentEh].shortName, this._currentAlignmentEh);

    // request the update so the drawer will be findable
    await this.requestUpdate();

    /** Drawer */
    if (this._drawer) {
      const container = this._drawer.parentNode!;
      container.addEventListener('MDCTopAppBar:nav', () => {
        this._drawer.open = !this._drawer.open;
      });
    }
    // - Done
    this.initializing = false
    this.initialized = true
  }

  async addHardcodedAlignments() {
    const init:Initialization = initialTree(this._store.myAgentPubKey)
    await this._store.initilize(init);
    this._store.pullDocuments("soc_proto.process.define.declaration")
  }

  async refresh() {
    console.log("refresh: Pulling data from DHT")
    await this._store.pullAlignments();
    await this._store.pullTree();
    await this._profiles.fetchAllProfiles()
  }

  get alignmentElem(): HowAlignment {
    return this.shadowRoot!.getElementById("how-alignment") as HowAlignment;
  }

  async openAlignmentDialog(parent?: any) {
    this.alignmentDialogElem.open(parent);
  }

  get alignmentDialogElem() : HowAlignmentDialog {
    return this.shadowRoot!.getElementById("alignment-dialog") as HowAlignmentDialog;
  }

  private async handleAlignmentSelect(alignmentEh: string): Promise<void> {
    if (this._alignments.value[alignmentEh]) {
      this._currentAlignmentEh = alignmentEh;
      this.alignmentElem.currentAlignmentEh = alignmentEh;
      this._tree.currentNode = alignmentEh;
      await this._store.pullDocuments(this.getCurrentPath())
      let docs = this.getAlignmentDocuments()
      if (docs) {
        docs = docs.filter(doc => !doc.updated)
        if (docs.length > 0) {
          this._currentDocumentEh = docs[docs.length-1].hash
        }
      }
      else {
        this._currentDocumentEh = ""
      }
    }
  }

  getAlignmentDocuments(): Array<DocumentOutput> {
    const docs = this._documentPaths.value[this.getCurrentPath()]
    return docs
  }

  handleNodeSelected(event: any) {
    this.handleAlignmentSelect(event.detail)
  }

  handleAddChild(event: any) {
    const alignmentEh = event.detail
    this.openAlignmentDialog(alignmentEh)
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
    console.log("calling handDocUpdate")
    await this._store.pullDocuments(this.getCurrentPath())
    this._currentDocumentEh = e.detail
  }
  render() {

    const tree = html`      
      <how-tree id="tree"
        .treeType=${this._treeType}
        @node-selected=${this.handleNodeSelected}
        @add-child=${this.handleAddChild}>
      </how-tree>`
    const alignment = html`
    <how-alignment id="how-alignment" .currentAlignmentEh=${this._currentAlignmentEh}
        @document-updated=${this.handleDocumentUpdated}
        @select-document=${(e:any)=>{this._currentDocumentEh = e.detail}}
        @select-node=${(e: any)=>{const hash = this._alignmentsPath.value[e.detail]; this.handleAlignmentSelect(hash)}}>
      </how-alignment>`
     const document = this._currentDocumentEh ? 
     html`<how-document id="document" .currentDocumentEh=${this._currentDocumentEh}
          @document-updated=${this.handleDocumentUpdated}
          .path=${this.getCurrentPath()}
     >
    </how-document>` : ""
    return html`


  <div>
    <div id="top-bar" class="row">
      <div id="top-bar-title">How ${this._currentAlignmentEh ? ` - ${this._alignments.value[this._currentAlignmentEh].shortName}` : ''}</div>
      <mwc-icon-button icon="view_module"  @click=${this.toggleTreeType}></mwc-icon-button>
      <mwc-icon-button icon="account_circle" @click=${() => {alert("TBD: edit account")}}></mwc-icon-button>
      <mwc-icon-button icon="settings" @click=${() => {alert("TBD: settings")}}></mwc-icon-button>
    </div>

    <div class="appBody column">
      <div class="row"> 
      ${tree}
      ${alignment}
      </div>
      ${document}    
    </div>
    <how-alignment-dialog id="alignment-dialog"
                        .myProfile=${get(this._myProfile)}
                        @alignment-added=${(e:any)=>{this.handleNodeSelected(e); this.refresh();}}>
    </how-alignment-dialog>
  </div>

`;
  }


  static get scopedElements() {
    return {
      "mwc-switch": Switch,
      "mwc-top-app-bar": TopAppBar,
      "mwc-textfield": TextField,
      "mwc-select": Select,
      "mwc-list": List,
      "mwc-list-item": ListItem,
      "mwc-icon": Icon,
      "mwc-icon-button": IconButton,
      "mwc-button": Button,
      "how-alignment-dialog" : HowAlignmentDialog,
      "how-alignment": HowAlignment,
      "how-tree": HowTree,
      "mwc-formfield": Formfield,
      "how-document": HowDocument,
      'sl-avatar': SlAvatar,
    };
  }

  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          margin: 10px;
          font-family: Roboto,'Open Sans','Helvetica Neue',sans-serif;
        }

        #top-bar {
          background-color: lightgray;
          align-items: center;
          justify-content: flex-end;
        }
        #top-bar-title {
          font-size: 1.5em;
          font-weight: bold;
          margin-right: auto;
        }

        .appBody {
          width: 100%;
          margin-top: 2px;
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
