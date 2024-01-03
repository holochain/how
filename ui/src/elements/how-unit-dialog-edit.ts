import {css, html, LitElement} from "lit";
import {property, query, state} from "lit/decorators.js";

import {sharedStyles} from "../sharedStyles";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {HowStore} from "../how.store";
import {Unit, howContext, Dictionary, Node, VersioningType, SysState, UnitInfo} from "../types";
import {AgentPubKeyB64, encodeHashToBase64, EntryHashB64} from "@holochain/client";
import {
  Button,
  Dialog,
  TextField,
  TextArea,
  Select,
  ListItem,
} from "@scoped-elements/material-web";
import '@holochain-open-dev/profiles/dist/elements/search-agent.js';
import { consume } from '@lit/context';
import { ProfilesStore, profilesStoreContext } from "@holochain-open-dev/profiles";
import { StoreSubscriber, toPromise } from "@holochain-open-dev/stores";
import SlDropdown from '@shoelace-style/shoelace/dist/components/dropdown/dropdown.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import "@shoelace-style/shoelace/dist/components/dropdown/dropdown.js";
import "@shoelace-style/shoelace/dist/components/menu-item/menu-item.js";
import "@shoelace-style/shoelace/dist/components/menu/menu.js";
import {SVG} from "./svg-icons"
import {unsafeHTML} from "lit/directives/unsafe-html.js";
import { AgentAvatar } from "@holochain-open-dev/profiles/dist/elements/agent-avatar";

/**
 * @element how-unit-dialog-edit
 */
export class HowUnitDialogEdit extends ScopedElementsMixin(LitElement) {

  /** Dependencies */
  @consume({ context: howContext, subscribe: true })
  _store!: HowStore;

  @consume({ context: profilesStoreContext, subscribe: true })
  _profiles!: ProfilesStore;

  @query('#name-field')
  _nameField!: TextField;

  @query('#version-field')
  _versionField!: TextField;

  @query('#versioning-type-select')
  _versioningTypeSelect!: Select;

  @query('#title-field')
  _titleField!: TextField;
  
  @query('#units-menu')
  private _unitsMenu!: SlDropdown;
  @state() _reparentingToUnitHash: EntryHashB64 | undefined

  @state() _stewards: Dictionary<string> = {};

  @state() _currentUnit?: Unit;
  @state() _currentUnitInfo?: UnitInfo;
  @state() _currentUnitEh?: EntryHashB64;

  _units = new StoreSubscriber(this, () => this._store.units);

  private static readonly NONE = 'none'; // we need a default value for the mwc-selects because if an empty string is provided, the UI gets broken

  private takenNames: Array<string> = []

  firstUpdated() {
    this._nameField.validityTransform = (newValue: string) => {
      this.requestUpdate();
      if (this.takenNames.includes(this._nameField.value)) {
        this._nameField.setCustomValidity(`Path abbreviation already exists`);
        return {
          valid: false,
        };
      } 

      return {
        valid: true,
      };
    };
  }

  async open(currentUnitEh:EntryHashB64) {
    this._currentUnitEh = currentUnitEh
    this._currentUnit = this._store.unit(currentUnitEh)

    if (this._currentUnit) {
      const parentPath = this.currentParentPath()

      for (const [key,unit] of Object.entries(this._units.value)) {
        const unitPath = unit.path()
        if (unitPath === parentPath) {
          this._reparentingToUnitHash = key
          break;
        }
      }
    }

    this._currentUnitInfo = this._store.unitInfo(currentUnitEh)
    if (this._currentUnit) {  
      const [vType,version] = this._currentUnit.version.split(":")
      this._nameField.value = this._currentUnit.pathAbbreviation
      this._versioningTypeSelect.value = vType
      this._versionField.value = version
      this._titleField.value = this._currentUnit.shortName

      const profiles = await toPromise(this._profiles.allProfiles)
      Array.from(profiles.entries()).forEach(([agent, profile]) => {
        this._stewards[encodeHashToBase64(agent)] = profile.entry.nickname
      });
      this.requestUpdate()
      const dialog = this.shadowRoot!.getElementById("unit-dialog") as Dialog
      dialog.open = true
  
    } else {
      console.log("Unit not found")
    }
  }

  private unitsEqual(u1: Unit, u2:Unit) : boolean {
    if (u1.pathAbbreviation != u1.pathAbbreviation) return false
    if (u1.path() != u2.path()) return false
    if (u1.shortName != u2.shortName) return false
    if (u1.version != u2.version) return false
    if (u1.stewards.length != u2.stewards.length) return false
    for (const s of u1.stewards) {
      if (!u2.stewards.includes(s)) return false
    }
    return true 
  }

  /**
   *
   */
  private async handleOk(e: any) {
    /** Check validity */
    if (!this._nameField.validity.valid) {
      this._nameField.reportValidity()
    }

    if (!this._titleField.validity.valid) {
      this._titleField.reportValidity()
    }
    if (!this._versionField.validity.valid) {
      this._versionField.reportValidity()
    }

    const stewards = Object.keys(this._stewards)
    if (stewards.length == 0) {
      stewards.push(this._store.myAgentPubKey)
    }
    const unit = new Unit({
      parents: this._currentUnit?.parents, // full paths to parent nodes (remember it's a DAG)
      version: `${this._versioningTypeSelect.value}:${this._versionField.value}`, // max 100 chars
      pathAbbreviation: this._nameField.value,
      shortName: this._titleField.value,
      stewards,  // people who can change this document
      processes: this._currentUnit?.processes,
      });

      if (this._reparentingToUnitHash) {
        const reparentPath = this._units.value[this._reparentingToUnitHash].path()
        unit.parents = [reparentPath]
      }
    // - Add unit to commons
    if (this._currentUnitEh && this._currentUnitInfo) {

      // TODO integrate reparent with update Unit.
      if (this._currentUnit && !this.unitsEqual(unit, this._currentUnit)) {
        const newUnitHash = await this._store.updateUnit(this._currentUnitEh, unit, this._currentUnitInfo.state);
        this.dispatchEvent(new CustomEvent('unit-updated', { detail: newUnitHash, bubbles: true, composed: true }));
      }
      // if (this._reparentingToUnitHash) {
      //   const reparentPath = this._units.value[this._reparentingToUnitHash].path()
      //   if (reparentPath != unit.path()) {
      //     await this._store.reparent(unit.path(),reparentPath)
      //   }
      // }
    }
    // - Clear all fields
    // this.resetAllFields();
    // - Close dialog
    const dialog = this.shadowRoot!.getElementById("unit-dialog") as Dialog;
    dialog.close()
  }

  resetAllFields() {
    this._nameField.value = ''
    this._titleField.value = ''
    this._versionField.value = ''
    this._stewards = {}
  }

  private async handleDialogOpened(e: any) {
    // if (false) {
    //   const unit = this._store.unit(this._unitToPreload);
    //   if (unit) {
        
    //   }
    //   this._unitToPreload = undefined;
    // }
   // this.requestUpdate()
  }

  private async handleDialogClosing(e: any) {
    this.resetAllFields();
  }

  private addSteward(nickname: string, pubKey: AgentPubKeyB64) {
    this._stewards[pubKey] = nickname
    this._stewards = this._stewards
    this.requestUpdate()
  }

  private currentParentPath() {
    if (this._currentUnit) {
      const currentPath = this._currentUnit.path()
      let curentParentPath =""
      if (currentPath) {
        const p = currentPath.split(".")
        p.pop()
        curentParentPath = p.join(".")
      }
      return curentParentPath
    } else {
      return ""
    }
  }

  private filteredUnits() {
    if (this._currentUnit) {

      const currentPath = this._currentUnit.path()
      const currentParentPath = this.currentParentPath()
    

      return Object.entries(this._units.value).filter(([_,unit])=>{
        const unitPath = unit.path()
        if (unitPath === currentParentPath) return true
        return !unitPath.startsWith(currentPath) && (unitPath != currentParentPath)
      })
    }
    return []
  }

  render() {
    return html`
<mwc-dialog id="unit-dialog" heading="Edit Unit" @closing=${this.handleDialogClosing} @opened=${this.handleDialogOpened}>

  Parent: <sl-dropdown id="units-menu">
    <sl-button slot="trigger"
      @click=${(e:any)=>{
        e.stopPropagation()
        this._unitsMenu.show()
      }}
    >
    ${this._reparentingToUnitHash ? this._units.value[this._reparentingToUnitHash].path() : "Select new parent"}
    ${unsafeHTML(SVG["chevron"])}
    </sl-button>

    <sl-menu  style="max-width: 100px;"
      @mouseleave=${()=> this._unitsMenu.hide()}
      @click=${(e:any)=>e.stopPropagation()}
      @sl-select=${(e:any)=>{
        this._reparentingToUnitHash = e.detail.item.value
        this._unitsMenu.hide()
      }}>
      ${
        this.filteredUnits().map(([key, unit]) => html`
      <sl-menu-item value=${key}>
        ${unit.path() == "" ? "<Root>" : unit.path()}
      </sl-menu-item>
        `)
        }
    </sl-menu>
  </sl-dropdown>  
  <mwc-textfield dialogInitialFocus type="text"
    @input=${() => this._nameField.reportValidity()}
    id="name-field" minlength="3" maxlength="10" label="Path Abbreviation" autoValidate=true required></mwc-textfield>

  <mwc-select
        id="versioning-type-select" 
        label="Select version type" 
        @closing=${(e: any) => e.stopPropagation()}
      >
        <mwc-list-item selected value=${VersioningType.Semantic}>Semantic</mwc-list-item>
        <mwc-list-item value=${VersioningType.Indexed}>Indexed</mwc-list-item>
  </mwc-select>
  <mwc-textfield type="text"
                 @input=${() => (this.shadowRoot!.getElementById("version-field") as TextField).reportValidity()}
                 id="version-field" minlength="1" maxlength="100" label="Version" autoValidate=true required></mwc-textfield>



  <mwc-textfield type="text"
                 @input=${() => (this.shadowRoot!.getElementById("title-field") as TextField).reportValidity()}
                 id="title-field" minlength="3" maxlength="64" label="Title" autoValidate=true required></mwc-textfield>
  
  Stewards:  ${Object.keys(this._stewards).length} ${Object.entries(this._stewards).map(([agent, nickname])=>html`
    <div style="display:flex;flex-direction:row"><span class="agent" title="${nickname}"><agent-avatar disable-tooltip="true" agent-pub-key=${agent}> </agent-avatar> ${nickname} </span>
      <svg-button
          button="trash"
          .click=${() => {
            delete this._stewards[agent]
            this.requestUpdate()
          }}
          ></svg-button>
    </div>
    `)}
  <search-agent
  @closing=${(e:any)=>e.stopPropagation()}
  @agent-selected="${(e:any)=> {
      const nickname = e.detail.profile.nickname
      const pubKey = encodeHashToBase64(e.detail.agentPubKey)
      this.addSteward(nickname, pubKey)
    }}"
  clear-on-select
  style="margin-bottom: 16px;"
  include-myself></search-agent>

  <mwc-button id="primary-action-button" slot="primaryAction" @click=${this.handleOk}>ok</mwc-button>
  <mwc-button slot="secondaryAction"  dialogAction="cancel">cancel</mwc-button>
</mwc-dialog>
`
  }


  static get scopedElements() {
    return {
      "mwc-button": Button,
      "mwc-dialog": Dialog,
      "mwc-textfield": TextField,
      "mwc-textarea": TextArea,
      "mwc-select": Select,
      "mwc-list-item": ListItem,
      "agent-avatar": AgentAvatar,
    };
  }
  static get styles() {
    return [
      sharedStyles,
      css`
        mwc-dialog div {
          display: flex;
        }
        #unit-dialog {
          --mdc-dialog-min-width: 600px;
        }
        mwc-textfield {
          margin-top: 10px;
          display: flex;
        }
        mwc-textarea {
          margin-top: 10px;
          display: flex;
        }
        mwc-select {
          display: flex;
          margin: 10px 0;
        }
        .ui-item {
          position: absolute;
          pointer-events: none;
          text-align: center;
          flex-shrink: 0;
        }
`,
    ];
  }
}
