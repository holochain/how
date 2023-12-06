import {css, html, LitElement} from "lit";
import {property} from "lit/decorators.js";

import {sharedStyles} from "../sharedStyles";
import { consume } from '@lit/context';
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {HowStore} from "../how.store";
import {Unit, howContext, Dictionary, Node} from "../types";
import {
  Button,
  Dialog,
} from "@scoped-elements/material-web";
import {Profile} from "@holochain-open-dev/profiles";
// @ts-ignore
import {WcMermaid} from "wc-mermaid"

/**
 * @element how-unit-details
 */
export class HowUnitDetails extends ScopedElementsMixin(LitElement) {

    @property() myProfile: Profile| undefined = undefined;
    @property() state = "";

  /** Dependencies */
  @consume({ context: howContext })
  _store!: HowStore;
  
  open() {
    const dialog = this.shadowRoot!.getElementById("unit-details") as Dialog
    dialog.open = true
  }

  /**
   *
   */
  private async handleOk(e: any) {

    const dialog = this.shadowRoot!.getElementById("unit-details") as Dialog;
    dialog.close()
  }

  private async handleDialogOpened(e: any) {
  }


  render() {
    if (!this.state) {
        return
    }
    const define = "define"
    const refine = "refine"
    const align = "align"
    const graph  = `graph LR;
    ${define} --> ${refine} --> ${align} --> _alive;
    ${define} --> _defunct;
    ${refine} --> _defunct;
    ${align} --> _defunct;        
    _alive --> _defunct;

    style ${this.state}  fill:#f9f,stroke:#333,stroke-width:4px`

    return html`
<mwc-dialog id="unit-details" heading="Unit Details" @opened=${this.handleDialogOpened}>
    <div class="column" style="padding:5px">
        <wc-mermaid>
            ${graph}
        </wc-mermaid>
    </div>
    <mwc-button id="primary-action-button" slot="primaryAction" @click=${this.handleOk}>ok</mwc-button>
</mwc-dialog>
`
  }


  static get scopedElements() {
    return {
      "mwc-button": Button,
      "mwc-dialog": Dialog,
      "wc-mermaid": WcMermaid,
    };
  }
  static get styles() {
    return [
      sharedStyles,
      css`
        mwc-dialog div {
          display: flex;
        }
        #unit-details {
          --mdc-dialog-min-width: 600px;
        }
`,
    ];
  }
}
