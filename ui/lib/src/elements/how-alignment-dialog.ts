import {css, html, LitElement} from "lit";
import {property, query, state} from "lit/decorators.js";

import {sharedStyles} from "../sharedStyles";
import {contextProvided} from "@lit-labs/context";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {HowStore} from "../how.store";
import {Alignment, howContext} from "../types";
import {EntryHashB64} from "@holochain-open-dev/core-types";
import {
  Button,
  Dialog,
  TextField
} from "@scoped-elements/material-web";
import {Profile} from "@holochain-open-dev/profiles";

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

  @state() _parent?: Alignment;

  /**
   *
   */
  open(parentEh: EntryHashB64) {
    this._parent = this._store.alignment(parentEh);
    const dialog = this.shadowRoot!.getElementById("alignment-dialog") as Dialog
    dialog.open = true
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
    const alignment: Alignment = {
      parents: [this.parentPath()], // full paths to parent nodes (remember it's a DAG)
      path_abbreviation: this._nameField.value, // max 10 char
      short_name: this._nameField.value,
      title: "specification of the holochain conductor api for application access",
      summary: "blah blah",
      stewards: [],  // people who can change this document
      processes: ["soc_proto.self.proposal"], // paths to process template to use
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

  render() {
    return html`
<mwc-dialog id="alignment-dialog" heading="New alignment" @closing=${this.handleDialogClosing} @opened=${this.handleDialogOpened}>
  Parent: ${this.parentPath()}
  <mwc-textfield dialogInitialFocus type="text"
                 @input=${() => (this.shadowRoot!.getElementById("name-field") as TextField).reportValidity()}
                 id="name-field" minlength="3" maxlength="64" label="Name" autoValidate=true required></mwc-textfield>
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
