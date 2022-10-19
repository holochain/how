import {css, html, LitElement} from "lit";
import {property, query} from "lit/decorators.js";

import { contextProvided } from "@lit-labs/context";
import {StoreSubscriber} from "lit-svelte-stores";

import {sharedStyles} from "../sharedStyles";
import {EntryHashB64, AgentPubKeyB64} from "@holochain-open-dev/core-types";
import {Unit, howContext, Section, SectionType, SourceManual} from "../types";
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
import { HowNewSectionDialog } from "./how-new-section-dialog";
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

    @query('how-new-section-dialog')
    private newSectionDialog!: HowNewSectionDialog;

    @contextProvided({ context: howContext })
    _store!: HowStore;
    _documents = new StoreSubscriber(this, () => this._store.documents);

    @query('#document-dialog')
    _documentDialogElem!: HowDocumentDialog;

    openDoc(unitEh: EntryHashB64, documentEh: EntryHashB64, editable: boolean ) {
        this._documentDialogElem.open(this.path, unitEh, documentEh, editable);
    }

    async updateSection(section:Section, index:number) {
      const document = this._documents.value[this.currentDocumentEh]
      const newDocumentHash = await this._store.updateDocument(this.currentDocumentEh, document);
      this.dispatchEvent(new CustomEvent('document-updated', { detail: newDocumentHash, bubbles: true, composed: true }));
    }

    async addSection(e: any) {
      const section: Section = {
        name: e.detail.name, 
        contentType: e.detail.contentType, 
        sectionType:e.detail.sectionType,
        source: SourceManual,
        content: "{}"
      }
      const document = this._documents.value[this.currentDocumentEh]
      document.content.push(section)
      const newDocumentHash = await this._store.updateDocument(this.currentDocumentEh, document);
      this.dispatchEvent(new CustomEvent('document-updated', { detail: newDocumentHash, bubbles: true, composed: true }));
    }

    render() {
        if (!this.currentDocumentEh) {
          return;
        }
        const doc = this._documents.value[this.currentDocumentEh]
        let addSectionHTML
        if (doc.canAddSection()) {
          addSectionHTML = html`
          <svg-button
                button="plus"
                info="add section"
                infoPosition="right"
                @click=${() => this.newSectionDialog.open()}
                ></svg-button>
          </div>

          <how-new-section-dialog
            .takenNames=${doc.content.map((s)=>s.name)}
            @add-section=${this.addSection}
            sectionType=${SectionType.Content}
          ></how-new-section-dialog>
          `
        }
        return html`
          <div id="header">
            <div id="editors" class="row">
              Editors:
              ${Object.entries(doc.editors).map(
                ([key, pubkey]) => html`<agent-avatar agent-pub-key="${pubkey}"></agent-avatar>`
              )}
            </div>
          </div>
          <div id="sections">
            ${doc.content.map(
              (section, index) =>
                html` <how-section 
                @section-changed=${(e:any) => this.updateSection(e.detail, index)}
                .section=${section} .index=${index} .editable=${doc.isEditable(section.name)}></how-section>`
            )}
          </div>
          ${addSectionHTML}
        `;
      
    }

    static get scopedElements() {
        return {
          "mwc-button": Button,
          "how-section": HowSection,
          "how-new-section-dialog": HowNewSectionDialog,
          "agent-avatar": AgentAvatar
        };
      }
    static get styles() {
        return [
          sharedStyles,
          css`
          #header {
            float: right;
            padding: 10px;          
          }
          #editors {
            align-items:center;
          }
          `,
        ];
  }
}
