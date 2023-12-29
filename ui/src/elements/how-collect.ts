import { css, html, LitElement } from "lit";
import { query } from "lit/decorators.js";
import { sharedStyles } from "../sharedStyles";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import {
  Button,
  Dialog,
  TextField,
} from "@scoped-elements/material-web";
import { Section } from "../types";

/**
 * @element how-collect-dialog
 */
export class HowCollect extends ScopedElementsMixin(LitElement) {

  @query('#collect-dialog')
  _dialogElem!: Dialog;
  @query('#version-field')
  _versionField!: TextField;

  private collectionDef: Section | undefined

  open(def: Section) {
    this._versionField.value = ""
    this.collectionDef = def
    this._dialogElem!.open = true
  }

  private async handleOk(e: any) {
    if (!this._versionField.validity.valid) {
      this._versionField.reportValidity()
      return
    }

    this.dispatchEvent(new CustomEvent('collect', { detail: {version: this._versionField.value, def:this.collectionDef}, bubbles: true, composed: true }));
    this._dialogElem!.close()
  }
  render() {
    return html`
      <mwc-dialog id="collect-dialog" heading="Collect">

      <mwc-textfield dialogInitialFocus type="text"
                 @input=${() => (this.shadowRoot!.getElementById("version-field") as TextField).reportValidity()}
                 id="version-field" minlength="1" maxlength="64" label="Version" autoValidate=true required></mwc-textfield>
      <mwc-button
          id="primary-action-button"
          slot="primaryAction"
          @click=${this.handleOk}
          >ok</mwc-button
        >
        <mwc-button slot="secondaryAction" dialogAction="cancel"
          >cancel</mwc-button
        >
      </mwc-dialog>
    `;
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
        :host {
          --mdc-dialog-max-width: 1000px;
        }
        .message {
          max-width: 300px;
        }
      `,
    ];
  }
}
