import {css, html, LitElement} from "lit";
import {property, query, state} from "lit/decorators.js";

import {sharedStyles} from "../sharedStyles";
import {contextProvided} from "@lit-labs/context";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {HowStore} from "../how.store";
import {Alignment, howContext, Dictionary, Node} from "../types";
import {EntryHashB64, AgentPubKeyB64} from "@holochain-open-dev/core-types";
import {
  Button,
  Dialog,
  TextField,
  TextArea,
  Select,
  ListItem,
} from "@scoped-elements/material-web";
import {Profile, SearchAgent} from "@holochain-open-dev/profiles";
import { StoreSubscriber } from "lit-svelte-stores";

const PROCESS_TYPES = ['align', 'define', 'refine'] as const;
type ProcessType = typeof PROCESS_TYPES[number];

/**
 * @element how-alignment-dialog
 */
export class HowAlignmentDialog extends ScopedElementsMixin(LitElement) {

  @property() myProfile: Profile| undefined = undefined;

  /** Dependencies */
  @contextProvided({ context: howContext })
  _store!: HowStore;

  @query('#name-field')
  _nameField!: TextField;
  @query('#title-field')
  _titleField!: TextField;
  @query('#summary-field')
  _summaryField!: TextArea;

  @query('#align-process-select')
  _alignProcessSelect!: Select;

  @query('#define-process-select')
  _defineProcessSelect!: Select;

  @query('#refine-process-select')
  _refineProcessSelect!: Select;
  
  @property() _stewards: Dictionary<string> = {};

  @state() _parent?: Alignment;

  private static readonly NONE = 'none'; // we need a default value for the mwc-selects because if an empty string is provided, the UI gets broken
  private static readonly PROCESS_PATH = 'soc_proto.process';

  private _processes: Dictionary<StoreSubscriber<Node[]>> = {
    align: new StoreSubscriber(this, () => this._store.alignProcesses),
    define: new StoreSubscriber(this, () => this._store.defineProcesses),
    refine: new StoreSubscriber(this, () => this._store.refineProcesses)
  };

  /**
   *
   */
  open(parentEh: EntryHashB64) {
    this._parent = this._store.alignment(parentEh);
    const dialog = this.shadowRoot!.getElementById("alignment-dialog") as Dialog
    dialog.open = true
    this._store.pullProfiles() // TODO, this won't scale
  }

  private getProcessSelect(type: ProcessType) {
    const selects = {
      align: this._alignProcessSelect,
      define: this._defineProcessSelect,
      refine: this._refineProcessSelect
    }

    return selects[type]
  }

  private getProcessesValue(): [string, string][] {
    const processes = PROCESS_TYPES
      .map((processType: ProcessType) => {
        const { value } = this.getProcessSelect(processType)

        return value !== HowAlignmentDialog.NONE ? [`${HowAlignmentDialog.PROCESS_PATH}.${processType}`, value] : null
      })
      .filter(process => !!process)

    return (processes.length ? processes : [['', '']]) as [string, string][]
  }

  /**
   *
   */
  private async handleOk(e: any) {
    /** Check validity */
    // nameField
    let isValid = this._nameField.validity.valid
    if (!this._nameField.validity.valid) {
      this._nameField.reportValidity()
    }
    if (!this._titleField.validity.valid) {
      this._titleField.reportValidity()
    }
    if (!this._summaryField.validity.valid) {
      this._summaryField.reportValidity()
    }

    const processes = this.getProcessesValue()

    const alignment: Alignment = {
      parents: [this.parentPath()], // full paths to parent nodes (remember it's a DAG)
      path_abbreviation: this._nameField.value, // max 10 char
      short_name: this._nameField.value,
      title: this._titleField.value,
      summary: this._summaryField.value,
      stewards: Object.keys(this._stewards).map((agent)=> agent),  // people who can change this document
      processes,
      history: {},
      meta: {},
    };

    // - Add alignment to commons
    const newAlignment = await this._store.addAlignment(alignment);
    this.dispatchEvent(new CustomEvent('alignment-added', { detail: newAlignment, bubbles: true, composed: true }));
    // - Clear all fields
    // this.resetAllFields();
    // - Close dialog
    const dialog = this.shadowRoot!.getElementById("alignment-dialog") as Dialog;
    dialog.close()
  }

  resetAllFields() {
    this._parent = undefined
    this._nameField.value = ''
    this._titleField.value = ''
    this._summaryField.value = ''
    this._alignProcessSelect.value = HowAlignmentDialog.NONE
    this._defineProcessSelect.value = HowAlignmentDialog.NONE
    this._refineProcessSelect.value = HowAlignmentDialog.NONE
    this._stewards = {}
  }

  private async handleDialogOpened(e: any) {
    // if (false) {
    //   const alignment = this._store.alignment(this._alignmentToPreload);
    //   if (alignment) {
        
    //   }
    //   this._alignmentToPreload = undefined;
    // }
   // this.requestUpdate()
  }

  private async handleDialogClosing(e: any) {
    this.resetAllFields();
  }

  private parentPath() {
    if (!this._parent) return ``
    let path = ""
    if (this._parent.parents.length > 0) path +=  `${this._parent?.parents[0]}.`
    path += this._parent?.path_abbreviation
    return path
  }

  private addSteward(e:any) {
    const nickname = e.detail.agent.profile.nickname
    const pubKey = e.detail.agent.agent_pub_key
    this._stewards[pubKey] = nickname
    this._stewards = this._stewards
    this.requestUpdate()
  }

  render() {
    return html`
<mwc-dialog id="alignment-dialog" heading="New alignment" @closing=${this.handleDialogClosing} @opened=${this.handleDialogOpened}>
  Parent: ${this.parentPath()}
  <mwc-textfield dialogInitialFocus type="text"
                 @input=${() => (this.shadowRoot!.getElementById("name-field") as TextField).reportValidity()}
                 id="name-field" minlength="3" maxlength="64" label="Name" autoValidate=true required></mwc-textfield>
  <mwc-textfield type="text"
                 @input=${() => (this.shadowRoot!.getElementById("title-field") as TextField).reportValidity()}
                 id="title-field" minlength="3" maxlength="64" label="Title" autoValidate=true required></mwc-textfield>
  <mwc-textarea 
                 @input=${() => (this.shadowRoot!.getElementById("summary-field") as TextArea).reportValidity()}
                 id="summary-field" minlength="3" maxlength="64" cols="73" rows="10" label="Summary" autoValidate=true required></mwc-textarea>
  
  ${PROCESS_TYPES.map(processType => 
    html`
      <mwc-select
        id="${processType}-process-select" 
        label="Select ${processType} process" 
        @closing=${(e: any) => e.stopPropagation()}
      >
        <mwc-list-item selected value=${HowAlignmentDialog.NONE}>
          &ltnone&gt
        </mwc-list-item>

        ${
          this._processes[processType].value.map((process) =>
            html`<mwc-list-item value=${process?.val.name}>${process?.val.name}</mwc-list-item>`
          )
        }
      </mwc-select>
    `
  )}
  
  Stewards: ${Object.keys(this._stewards).length} ${Object.entries(this._stewards).map(([agent, nickname])=>html`<span class="agent" title="${agent}">${nickname}</span>`)}
  <search-agent
  @closing=${(e:any)=>e.stopPropagation()}
  @agent-selected="${this.addSteward}"
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
      "search-agent": SearchAgent,
    };
  }
  static get styles() {
    return [
      sharedStyles,
      css`
        mwc-dialog div {
          display: flex;
        }
        #alignment-dialog {
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
