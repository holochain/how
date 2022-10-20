import {css, html, LitElement, TemplateResult} from "lit";
import {property, query} from "lit/decorators.js";

import { contextProvided } from "@lit-labs/context";
import {StoreSubscriber} from "lit-svelte-stores";

import {sharedStyles} from "../sharedStyles";
import {EntryHashB64, AgentPubKeyB64} from "@holochain-open-dev/core-types";
import {Unit, howContext, Section, SectionType, SourceManual, Document} from "../types";
import {HowStore} from "../how.store";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {
  Button,
} from "@scoped-elements/material-web";

// @ts-ignore
import { AgentAvatar } from "@holochain-open-dev/profiles";
import { HowNewSectionDialog } from "./how-new-section-dialog";
import { HowSection } from "./how-section";
import { HowComment } from "./how-comment";
import { InfoItem } from "./info-item";

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
    private _newSectionDialog!: HowNewSectionDialog;
  
  
    @contextProvided({ context: howContext })
    _store!: HowStore;
    _documents = new StoreSubscriber(this, () => this._store.documents);

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
    private sectionRow(doc:Document, section: Section, index: number) : TemplateResult {
      return html`
      <div class="section row">
        <how-section
          @section-changed=${(e:any) => this.updateSection(e.detail, index)}
          .section=${section} 
          .index=${index} 
          .editable=${doc.isEditable(section.name)}
          >
        </how-section>
        <!-- ${doc.state === "refine" ? html`
          <div class="column">
            ${[].map(c => html`<how-comment .comment=${c}></how-comment>`)}
          </div>`
      :""} -->
      </div>
      `
    }
    render() {
        if (!this.currentDocumentEh) {
          return;
        }
        const doc : Document = this._documents.value[this.currentDocumentEh]
        let addSectionHTML
        if (doc.canAddSection()) {
          addSectionHTML = html`
          <svg-button
                button="plus"
                info="add section"
                infoPosition="right"
                @click=${() => this._newSectionDialog.open()}
                ></svg-button>
          </div>

          <how-new-section-dialog
            .takenNames=${doc.content.map((s)=>s.name)}
            @add-section=${this.addSection}
            sectionType=${SectionType.Content}
          ></how-new-section-dialog>
          `
        }
        const sectionsHTML = doc.content.filter(section => section.sectionType != SectionType.Requirement).map((section, index) => 
          this.sectionRow(doc, section, index))
        let requirementsHTML = doc.content.filter(section => section.sectionType == SectionType.Requirement).map((section, index) => 
          this.sectionRow(doc, section, index))
        if (requirementsHTML.length > 0) {
          requirementsHTML.unshift(html`
            <info-item item="Requirements" name="sections that this standard requrires of sub-nodes"></info-item>
          `)
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
            ${sectionsHTML}
            ${requirementsHTML}
            ${addSectionHTML}

          </div>
          <how-section-details id="details-dialog"> </how-section-details>
        `;
      
    }

    static get scopedElements() {
        return {
          "mwc-button": Button,
          "how-section": HowSection,
          "how-comment": HowComment,
          "how-new-section-dialog": HowNewSectionDialog,
          "agent-avatar": AgentAvatar,
          "info-item": InfoItem,
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
          how-section {
            max-width: 1200px;
          }
          `,
        ];
  }
}
