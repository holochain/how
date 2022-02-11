import {css, html, LitElement} from "lit";
import {property, query} from "lit/decorators.js";

import {contextProvided} from "@holochain-open-dev/context";
import {StoreSubscriber} from "lit-svelte-stores";

import {sharedStyles} from "../sharedStyles";
import {EntryHashB64, AgentPubKeyB64} from "@holochain-open-dev/core-types";
import {Alignment, howContext} from "../types";
import {HowStore} from "../how.store";
import {HowDocumentDialog } from "./how-document-dialog";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {
  Button,
  Dialog,
  TextField,
  TextArea,
} from "@scoped-elements/material-web";
import {sectionValue} from "./utils";

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

    openDoc(documentEh: EntryHashB64, editable: boolean ) {
        this._documentDialogElem.open(this.path, documentEh, editable);
    }

    render() {
        if (!this.currentDocumentEh) {
          return;
        }
        const doc = this._documents.value[this.currentDocumentEh]
        return html`
          <div class="document-header row">
            <div class="column" style="padding:5px">
                <span>Type: ${doc.document_type}</span><span> State: ${doc.state}</span>
            </div>  
            <div class="document-controls row">
              ${doc.isAlive()
                ? ""
                : html`<mwc-button
                    icon="edit"
                    @click=${() => this.openDoc(this.currentDocumentEh, true)}
                    >Edit</mwc-button
                  >`}
              Move to:
              ${doc
                .nextStates()
                .map(
                  (state) =>
                    html`<mwc-button @click=${() => alert("not implmented")}
                      >${state}</mwc-button
                    >`
                )}
            </div>
          </div>
          ${doc.content.map(
            (section, index) =>
              html`<h4 class="section-name">${section.name}</h4>
                <div>${sectionValue(section, index)}</div>`
          )}
          <hr />
          Editors:
          ${Object.entries(doc.editors).map(
            ([key, nickname]) => html`${nickname} `
          )}

          <how-document-dialog id="document-dialog"> </how-document-dialog>
        `;
      
    }

    static get scopedElements() {
        return {
          "mwc-button": Button,
          "how-document-dialog": HowDocumentDialog,
        };
      }
    static get styles() {
        return [
          sharedStyles,
          css`
            .section {
              padding: 10px;
            }
            .section-name {
              margin-bottom: 0px;
            }
            .document-header {
              border: solid .1em #666;
              border-radius: .2em;
              padding: 5px;
            }
          `,
        ];
  }
}
