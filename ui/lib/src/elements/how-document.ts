import {css, html, LitElement} from "lit";
import {property, query} from "lit/decorators.js";

import {contextProvided} from "@holochain-open-dev/context";
import {StoreSubscriber} from "lit-svelte-stores";

import {sharedStyles} from "../sharedStyles";
import {EntryHashB64, AgentPubKeyB64} from "@holochain-open-dev/core-types";
import {Alignment, howContext, Section, SectionType} from "../types";
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

// @ts-ignore
import {WcMermaid} from "wc-mermaid"
import { AgentAvatar } from "@holochain-open-dev/profiles";

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

    private async stateChange(state: string) {
        const newDocumentHash = await this._store.changeDocumentState(this.currentDocumentEh, state)
        this.dispatchEvent(new CustomEvent('document-updated', { detail: newDocumentHash, bubbles: true, composed: true }));
    }

    private sectionTypeMarker(section: Section) {
      switch (section.section_type) {
        case SectionType.Content: return ""; break;
        case SectionType.Process: return html`<span class="template-marker">Process Template</span>`
        case SectionType.Requirement: return html`<span class="template-marker">Required Section</span>`
      }
    }

    render() {
        if (!this.currentDocumentEh) {
          return;
        }
        const doc = this._documents.value[this.currentDocumentEh]
        const graph  = `graph LR;
        define --> refine --> align --> _alive;
        define --> _defunct;
        refine --> _defunct;
        align --> _defunct;        
        _alive --> _defunct;

        style ${doc.state}  fill:#f9f,stroke:#333,stroke-width:4px`
        return html`
          <div class="document-header row">
            <div class="column" style="padding:5px">
            <wc-mermaid>
                  ${graph}
            </wc-mermaid>
            </div>
            <div class="document-controls row">
              ${
                doc.isAlive()
                  ? ""
                  : html`<mwc-button
                      icon="edit"
                      @click=${() => this.openDoc(this.currentDocumentEh, true)}
                      >Edit</mwc-button
                    >`
              }
              <div class="column" style="align-items:center">
                <div>Move to:</div>

                <div class="row">
                  ${doc
                    .nextStates()
                    .map(
                      (state) =>
                        html`<mwc-button
                          @click=${async () => this.stateChange(state)}
                          >${state}</mwc-button
                        >`
                    )}
                </div>
              </div>
            </mwc-button>
            </div>
          </div>
          ${doc.content.map(
            (section, index) =>
              html` <div class="section">
                <div class="section-name" title="source: ${section.source == "" ? "_root" : section.source}">
                  ${section.name}
                  ${this.sectionTypeMarker(section)}
                </div>
                <div>${sectionValue(section, index)}</div>
              </div>`
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
          "wc-mermaid": WcMermaid,
          "agent-avatar": AgentAvatar
        };
      }
    static get styles() {
        return [
          sharedStyles,
          css`
            .section {
              padding: 10px;
            }
            .section-content p {
                margin: 0;
            }
            .template-marker {
                font-weight: normal;
                border: solid .1em #666;
                border-radius: .1em;
                font-size: 76%;
                padding: 0 3px 0 3px;
            }
            .section-name {
              font-weight: bold;
              margin-bottom: 2px;
            }
            .document-header {
              border-bottom: solid .1em #666;
              padding: 5px;
              margin: 0
            }
          `,
        ];
  }
}
