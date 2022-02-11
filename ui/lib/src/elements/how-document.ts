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

    @contextProvided({ context: howContext })
    _store!: HowStore;
    _documents = new StoreSubscriber(this, () => this._store.documents);

    render() {
        if (!this.currentDocumentEh) {
          return;
        }
        const doc = this._documents.value[this.currentDocumentEh]

        return html`
            <div class="document-type">Type: ${doc.document_type}</div>
            <div class="document-state">State: ${doc.state}</div>
            ${doc.content.map((section, index) => html`<h4 class="section-name">${section.name}</h4><div>${sectionValue(section, index)}</div>`)}
            <hr />Editors: ${Object.entries(doc.editors).map(([key,nickname])=> html`${nickname} `)}
        `
      
    }
    static get styles() {
        return [
            sharedStyles,
            css`
    `,
    ];
  }
}
