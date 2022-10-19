import { css, html, LitElement } from "lit";
import { property, query, state } from "lit/decorators.js";
import { sharedStyles } from "../sharedStyles";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import {
  howContext,
  Dictionary,
  Section,
  DocType,
  DocumentOutput,
  SectionType,
} from "../types";
import {
  Button,
  Dialog,
  TextField,
  Select,
  ListItem,
} from "@scoped-elements/material-web";
import { sectionValue } from "./utils";

/**
 * @element how-new-section-dialog
 */
export class HowNewSectionDialog extends ScopedElementsMixin(LitElement) {
    constructor() {
      // Always call super() first
      super();
      this.sectionType = 'Hello World';
    }
    
    @property()
    takenNames: Array<string> = []
    @property() 
    sectionType: string = SectionType.Content;

    @query('#name-field')
    _nameField!: TextField;
      @query('#section-type-select')
    _sectionTypeSelect!: Select;  
    @query('#content-type-select')
    _contentTypeSelect!: Select;

  open() {
    this._nameField.value = ""
    const dialog = this.shadowRoot!.getElementById("new-section-dialog") as Dialog
    dialog.open = true
  }

  firstUpdated() {
    this._nameField.validityTransform = (newValue: string) => {
      this.requestUpdate();
      if (this.takenNames.includes(this._nameField.value)) {
        this._nameField.setCustomValidity(`Name already exists`);
        return {
          valid: false,
        };
      } 

      return {
        valid: true,
      };
    };
  }

  private async handleOk(e: any) {
    let isValid = this._nameField.validity.valid
    if (!this._nameField.validity.valid) {
      this._nameField.reportValidity()
    }
    if (!isValid) {
        return
    }
    this.dispatchEvent(new CustomEvent('add-section', { detail: {name: this._nameField.value, contentType: this._contentTypeSelect.value, sectionType: this.sectionType ? this.sectionType : this._sectionTypeSelect.value}, bubbles: true, composed: true }));
    const dialog = this.shadowRoot!.getElementById("new-section-dialog") as Dialog;
    dialog.close()

  }
  render() {
    let sectionTypeHTML
    if (!this.sectionType) {
      sectionTypeHTML = html`
    <mwc-select
      id="section-type-select" 
      label="Section Type" 
      @closing=${(e: any) => e.stopPropagation()}
    >
      <mwc-list-item selected value=${SectionType.Content}>Content</mwc-list-item>
      <mwc-list-item selected value=${SectionType.Process}>Process Template</mwc-list-item>
      <mwc-list-item selected value=${SectionType.Requirement}>Required Section Template</mwc-list-item>
    </mwc-select>
    `
    }
    return html`
      <mwc-dialog id="new-section-dialog" heading="New Section">
      <div class="spacer"></div>
      <mwc-textfield dialogInitialFocus type="text"
            @input=${() => (this.shadowRoot!.getElementById("name-field") as TextField).reportValidity()}
            id="name-field" minlength="3" maxlength="64" label="Name" autoValidate=true required></mwc-textfield>
      ${sectionTypeHTML}
      <mwc-select
        id="content-type-select" 
        label="Content Type" 
        @closing=${(e: any) => e.stopPropagation()}
      >
        <mwc-list-item selected value="text/plain">Plain text (short)</mwc-list-item>
        <mwc-list-item selected value="text/plain:long">Plain text (long)</mwc-list-item>
        <mwc-list-item selected value="text/markdown">Markdown</mwc-list-item>
        <mwc-list-item selected value="text/json">JSON</mwc-list-item>
      </mwc-select>


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
      "mwc-select": Select,
      "mwc-list-item": ListItem,

    };
  }
  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          --mdc-dialog-max-width: 1000px;
        }
        mwc-select {
            margin-top: 10px;
            width: 300px;
            display: block;
        }
        .spacer {
            float:left;
            height: 350px;
        }
      `,
    ];
  }
}
