import { css, html, LitElement } from "lit";
import { property, query, state } from "lit/decorators.js";
import { sharedStyles } from "../sharedStyles";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import {
  SectionType,
} from "../types";
import {
  Button,
  Dialog,
} from "@scoped-elements/material-web";
import '@holochain-open-dev/profiles/dist/elements/my-profile.js';

/**
 * @element how-my-profile-dialog
 */
export class HowMyProfileDialog extends ScopedElementsMixin(LitElement) {
  @query('#my-profile')
  _myProfile!: Dialog

  open() {
    this._myProfile.open = true
  }

  render() {
    return html`
      <mwc-dialog id="my-profile" heading="My Profile">
      <my-profile></my-profile>
      </mwc-dialog>
    `;
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
