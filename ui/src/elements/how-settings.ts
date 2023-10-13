import { css, html, LitElement } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { sharedStyles } from "../sharedStyles";

import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import SlDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import { ScopedElementsMixin } from "@open-wc/scoped-elements";

/**
 * @element how-my-profile-dialog
 */
export class HowSettings extends ScopedElementsMixin(LitElement) {
  @query('sl-dialog')
  _dialog!: SlDialog


  
  public xxy = () => {
    this._dialog.show()
  }

  render() {
    return html`
      <sl-dialog label="Settings">
      <sl-button>Thing</sl-button>
      </sl-dialog>
    `;
  }

  static get styles() {
    return [
      sharedStyles,
      css`
       
      `,
    ];
  }
}
