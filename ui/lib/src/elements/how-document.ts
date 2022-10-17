import {css, html, LitElement} from "lit";
import {property, query} from "lit/decorators.js";

import { contextProvided } from "@lit-labs/context";
import {StoreSubscriber} from "lit-svelte-stores";

import {sharedStyles} from "../sharedStyles";
import {EntryHashB64, AgentPubKeyB64} from "@holochain-open-dev/core-types";
import {Unit, howContext, Section, SectionType} from "../types";
import {HowStore} from "../how.store";
import {HowDocumentDialog } from "./how-document-dialog";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {
  Button,
  Dialog,
  TextField,
  TextArea,
} from "@scoped-elements/material-web";

// @ts-ignore
import { AgentAvatar } from "@holochain-open-dev/profiles";
import { HowNewSectionDialog } from "./how-new-section.dialog";
import { HowSection } from "./how-section";

/**
 * @element how-document
 */
 export class HowDocument extends ScopedElementsMixin(LitElement) {
    constructor() {
      super();
    }
  
    @property() currentDocumentEh = "";
    @property() path = "";

    @contextProvided({ context: howContext })
    _store!: HowStore;
    _documents = new StoreSubscriber(this, () => this._store.documents);

    @query('#document-dialog')
    _documentDialogElem!: HowDocumentDialog;

    openDoc(unitEh: EntryHashB64, documentEh: EntryHashB64, editable: boolean ) {
        this._documentDialogElem.open(this.path, unitEh, documentEh, editable);
    }

    render() {
        if (!this.currentDocumentEh) {
          return;
        }
        const doc = this._documents.value[this.currentDocumentEh]
        return html`  
          ${doc.content.map(
            (section, index) =>
              html` <how-section .section=${section}></how-section>`
          )}
          <hr />
          Editors:
          ${Object.entries(doc.editors).map(
            ([key, pubkey]) => html`<agent-avatar agent-pub-key="${pubkey}"></agent-avatar>`
          )}

          <how-document-dialog id="document-dialog"> </how-document-dialog>
        `;
      
    }

    static get scopedElements() {
        return {
          "mwc-button": Button,
          "how-document-dialog": HowDocumentDialog,
          "how-section": HowSection,
          "agent-avatar": AgentAvatar
        };
      }
    static get styles() {
        return [
          sharedStyles,
          css`
            .template-marker {
                font-weight: normal;
                border: solid .1em #666;
                border-radius: .1em;
                font-size: 76%;
                padding: 0 3px 0 3px;
            }
          `,
        ];
  }
}
