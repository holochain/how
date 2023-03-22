import {css, html, LitElement} from "lit";
import {property} from "lit/decorators.js";

import {sharedStyles} from "../sharedStyles";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {
  Button,
  Dialog,
} from "@scoped-elements/material-web";


/**
 * @element how-section-details
 */
export class HowSectionDetails extends ScopedElementsMixin(LitElement) {
  @property() name = "";
  @property() source = "";
  @property() description = "";
  @property() contentType = "";
  open(name: string, source: string, contentType: string, description:string ) {
    this.name = name
    this.source = source
    this.contentType = contentType
    this.description = description
    const dialog = this.shadowRoot!.getElementById("details") as Dialog
    dialog.open = true
  }

  /**
   *
   */
  private async handleOk(e: any) {

    const dialog = this.shadowRoot!.getElementById("details") as Dialog;
    dialog.close()
  }

  private async handleDialogOpened(e: any) {
  }


  render() {
    return html`
<mwc-dialog id="details" heading="Section Details" @opened=${this.handleDialogOpened}>
    <div class="column" style="padding:5px">
        <div class="detail">
          <div class="name">Name: </div>
          ${this.name}
        </div>
        <div class="detail">
          <div class="name">Source: </div>
          ${this.source}
        </div>
        <div class="detail">
          <div class="name">Content Type: </div>
          ${this.contentType}
        </div>
        <div class="detail column">
          <div class="name">Description: </div>
          ${this.description}
        </div>
    </div>
    <mwc-button id="primary-action-button" slot="primaryAction" @click=${this.handleOk}>ok</mwc-button>
</mwc-dialog>
`
  }

  static get scopedElements() {
    return {
      "mwc-button": Button,
      "mwc-dialog": Dialog,
    };
  }
  static get styles() {
    return [
      sharedStyles,
      css`
        mwc-dialog div {
          display: flex;
        }
        #details {
          --mdc-dialog-min-width: 600px;
        }
        .detail {
          align-items: baseline;
        }
        .name {
          font-weight: bold;
          margin-right: 10px;
        }
`,
    ];
  }
}
