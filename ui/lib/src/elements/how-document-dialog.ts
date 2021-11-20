import {css, html, LitElement} from "lit";
import {property, query, state} from "lit/decorators.js";

import {sharedStyles} from "../sharedStyles";
import {contextProvided} from "@lit-labs/context";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {HowStore} from "../how.store";
import {Document, howContext, Dictionary} from "../types";
import {EntryHashB64, AgentPubKeyB64} from "@holochain-open-dev/core-types";
import {
  Button,
  Dialog,
  TextField,
  TextArea,
} from "@scoped-elements/material-web";
import {Profile, SearchAgent} from "@holochain-open-dev/profiles";

/**
 * @element how-alignment-dialog
 */
export class HowDocumentDialog extends ScopedElementsMixin(LitElement) {
    @property() _editors: Dictionary<string> = {};
    @property() document_type = ""
    @property() path = ""

    @contextProvided({ context: howContext })
    _store!: HowStore;
  
    @query('#content-field')
    _contentField!: TextArea;
  
    resetAllFields() {
        this._editors = {}
        this._contentField.value = "# Title\n## Section1\nSection 1 contents\n## Section 2\n Section 2 contents"
    }

    /**
     *
     */
    open(path: string, document_type: string) {
        this.path = path
        this.document_type = document_type
        const dialog = this.shadowRoot!.getElementById("document-dialog") as Dialog
        dialog.open = true
    }
    
    private async handleOk(e: any) {
        /** Check validity */
        // nameField
        let content: Array<[string,string]> = []
        let val = this._contentField.value;
        const title = val.match(/^# (.*)/)
        if (title) {
            content.push(["title",title[1]])
        }
        const sections = val.split("\n## ")
        sections.shift()
        sections.map(section => {
            let body = section.split("\n")
            const firstLine = body.shift()
            if (firstLine) {
                content.push([firstLine, body.join("\n")])
            }
        })
        
        const document: Document = {
          document_type: this.document_type,
          editors: Object.keys(this._editors).map((agent)=> agent),  // people who can change this document
          content, 
          meta: {},
        };
    
        // - Add alignment to commons
        const newDocument = await this._store.addDocument(this.path, document);
        this.dispatchEvent(new CustomEvent('document-added', { detail: newDocument, bubbles: true, composed: true }));
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
    // }
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
    render() {
        return html`
<mwc-dialog id="document-dialog" heading="New document" @closing=${this.handleDialogClosing} @opened=${this.handleDialogOpened}>
  <div> Path: ${this.path} </div>
  <div> Type: ${this.document_type} </div>
  <mwc-textarea 
                 @input=${() => (this.shadowRoot!.getElementById("content-field") as TextArea).reportValidity()}
                 id="content-field" minlength="3" maxlength="64" cols="73" rows="10" label="Content" autoValidate=true required></mwc-textarea>
  Editors: ${Object.keys(this._editors).length} ${Object.entries(this._editors).map(([agent, nickname])=>html`<span class="agent" title="${agent}">${nickname}</span>`)}
  <search-agent
  @closing=${(e:any)=>e.stopPropagation()}
  @agent-selected="${this.addEditor}"
  clear-on-select
  style="margin-bottom: 16px;"
  include-myself></search-agent>

  <mwc-button id="primary-action-button" slot="primaryAction" @click=${this.handleOk}>ok</mwc-button>
  <mwc-button slot="secondaryAction"  dialogAction="cancel">cancel</mwc-button>
</mwc-dialog>
 `
    }

    static get scopedElements() {
        return {
          "mwc-button": Button,
          "mwc-dialog": Dialog,
          "mwc-textfield": TextField,
          "mwc-textarea": TextArea,
          "search-agent": SearchAgent,
        };
      }
      static get styles() {
        return [
          sharedStyles,
          css``
        ]
    }
}
