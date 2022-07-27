import {css, html, LitElement} from "lit";
import {property, query, state} from "lit/decorators.js";
import {StoreSubscriber} from "lit-svelte-stores";
import {sharedStyles} from "../sharedStyles";
import { contextProvided } from "@lit-labs/context";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {HowStore} from "../how.store";
import {Document, howContext, Dictionary, Section, DocType, DocumentOutput, SectionType, SourceManual} from "../types";
import {EntryHashB64, AgentPubKeyB64} from "@holochain-open-dev/core-types";
import {
  Button,
  Dialog,
  TextField,
  TextArea,
} from "@scoped-elements/material-web";
import {Profile, SearchAgent} from "@holochain-open-dev/profiles";
import {sectionValue} from "./utils";
import { HowNewSectionDialog } from "./how-new-section.dialog";

/**
 * @element how-alignment-dialog
 */
export class HowDocumentDialog extends ScopedElementsMixin(LitElement) {
    @property() _editors: Dictionary<string> = {};
    @property() documentType: DocType = DocType.Document
    @property() path = ""
    @property() isNew = false
    @property() editable = false
    @property() hash = ""

    @state() sections: Array<Section> = []
    @state() sources: Dictionary<String> = {}
    @query('how-new-section-dialog')
    private newSectionDialog!: HowNewSectionDialog;
  
    @contextProvided({ context: howContext })
    _store!: HowStore;
  
    @state() _sectionElems: Array<HTMLElement> = [];
  
    _documentPaths = new StoreSubscriber(this, () => this._store.documentPaths);
    _documents = new StoreSubscriber(this, () => this._store.documents);

    resetAllFields() {
        this._editors = {}
        this._sectionElems = []
    }

    initSectionElements(document: DocumentOutput) {
      this.sections.forEach((section, index) => {
      })
    }

    /**
     *
     */
    async new(path: string, documentType: DocType) {
      this.isNew = true
      this.editable = true
      this.path = path
      this.documentType = documentType
      this.sections = await this._store.getSectionsFromHierarcy(path, 0, SectionType.Requirement)

      // also  get the sections from the process templates
      const docs = this._documentPaths.value[documentType]
      for (const doc of docs) {
        const templates = doc.content.getSectionsByType(SectionType.Process)
        this.sections = this.sections.concat(templates)
      }

      const dialog = this.shadowRoot!.getElementById("document-dialog") as Dialog
      dialog.open = true
    }

    open(path: string, hash: EntryHashB64, editable: boolean) {
      this.isNew = false
      this.editable = editable
      this.path = path
      this.hash = hash
      const document = this._documents.value[hash]
      this.documentType = document.documentType
      this.sections = document.content
      if (document.meta["sources"]) {
        this.sources = JSON.parse(document.meta["sources"])
      }
      const dialog = this.shadowRoot!.getElementById("document-dialog") as Dialog
      dialog.open = true
    }
    
    private async handleOk(e: any) {
        /** Check validity */
        // nameField
        let content: Array<Section> = []

        this.sections.forEach((section, index) => {
          const elem = this.shadowRoot!.getElementById(`section-${index}`) as TextArea
          section.content = elem?.value
        })
        
        const document: Document = new Document ({
          documentType: this.documentType,
          editors: Object.keys(this._editors).map((agent)=> agent),  // people who can change this document
          content: this.sections, 
        });
    
        // - Add alignment to commons
        const newDocumentHash = await this._store.updateDocument(this.hash, document);
        this.dispatchEvent(new CustomEvent('document-updated', { detail: newDocumentHash, bubbles: true, composed: true }));
        // - Clear all fields
        // this.resetAllFields();
        // - Close dialog
        const dialog = this.shadowRoot!.getElementById("document-dialog") as Dialog;
        dialog.close()
    }
    private async handleDialogOpened(e: any) {
    // if (false) {
    //   const alignment = this._store.alignment(this._alignmentToPreload);
    //   if (alignment) {
        
    //   }
    //   this._alignmentToPreload = undefined;
    // }marked
    // this.requestUpdate()
    }
    private async handleDialogClosing(e: any) {
    this.resetAllFields();
    }
    private addEditor(e:any) {
        const nickname = e.detail.agent.profile.nickname
        const pubKey = e.detail.agent.agent_pub_key
        this._editors[pubKey] = nickname
        this._editors = this._editors
        this.requestUpdate()
    }
    private sectionWidget(section: Section, index: number) {
      const id = `section-${index}`
      switch (section.contentType) {
        case "text/plain":
          return html`
            <mwc-textfield dialogInitialFocus type="text"
            @input=${() => (this.shadowRoot!.getElementById(id) as TextField).reportValidity()}
            id="${id}" maxlength="255" label="${section.name}" autoValidate=true value="${section.content}" required></mwc-textfield>`
        case "text/plain:long":
        default: 
          return html`<mwc-textarea @input=${() => (this.shadowRoot!.getElementById(id) as TextArea).reportValidity()}
            id="${id}" cols="100" rows="10" label="${section.name}" value="${section.content}" autoValidate=true required>
            </mwc-textarea>`
      } 
    }
    private addSection(e: any) {

      const section: Section = {
        name: e.detail.name, 
        contentType: e.detail.contentType, 
        sectionType:e.detail.sectionType,
        source: SourceManual,
        content: ""
      }
      this.sections.push(section)
      this.requestUpdate();
    }
    render() {
        return html`
          <mwc-dialog
            id="document-dialog"
            heading="${this.isNew
              ? "New"
              : this.editable
              ? "Edit"
              : "View"} Document"
            @closing=${this.handleDialogClosing}
            @opened=${this.handleDialogOpened}
          >
            <div>Path: ${this.path}</div>
            <div>Type: ${this.documentType}</div>
            ${this.editable
              ? html`
                  ${this.sections.map((section, index) => {
                    return html`${this.sectionWidget(section, index)}`;
                  })}
                  <mwc-button icon="add_cirlce" @click=${() => this.newSectionDialog.open()}>New Section</mwc-button>
                  <h4>Editors:</h4>
                  <search-agent
                    @closing=${(e: any) => e.stopPropagation()}
                    @agent-selected="${this.addEditor}"
                    clear-on-select
                    style="margin-bottom: 16px;"
                    include-myself
                  ></search-agent>
                `
              : html`${this.sections.map(
                    (section, index) =>
                      html`<h4 class="section-name">${section.name}</h4>
                        <div>${sectionValue(section, index)}</div>`
                  )}
                  
                  <hr />
                  Editors:
                  ${Object.entries(this._editors).map(
                    ([key, nickname]) => html`${nickname} `
                  )} `}
            ${this.editable
              ? html` <mwc-button
                    id="primary-action-button"
                    slot="primaryAction"
                    @click=${this.handleOk}
                    >ok</mwc-button
                  >
                  <mwc-button slot="secondaryAction" dialogAction="cancel"
                    >cancel</mwc-button
                  >`
              : html`<mwc-button
                  id="primary-action-button"
                  slot="primaryAction"
                  dialogAction="cancel"
                  >close</mwc-button
                >`}
          </mwc-dialog>
          <how-new-section-dialog
            .takenNames = ${this.sections.map((s)=>s.name)}
            @add-section=${this.addSection}
          ></how-new-section-dialog>
        `;
    }

    static get scopedElements() {
        return {
          "mwc-button": Button,
          "mwc-dialog": Dialog,
          "mwc-textfield": TextField,
          "mwc-textarea": TextArea,
          "search-agent": SearchAgent,
          "how-new-section-dialog": HowNewSectionDialog,
        };
      }
      static get styles() {
        return [
          sharedStyles,
          css`
            :host {
              --mdc-dialog-max-width: 1000px;
            }
            .section {
              border: 1px solid black;
              border-radius: 5px;
              padding: 10px;
            }
            .section-name {
              margin-bottom: 0px;
            }
          `,
        ];
    }
}
