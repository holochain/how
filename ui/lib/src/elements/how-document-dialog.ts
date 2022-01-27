import {css, html, LitElement} from "lit";
import {property, query, state} from "lit/decorators.js";
import {StoreSubscriber} from "lit-svelte-stores";
import {sharedStyles} from "../sharedStyles";
import {contextProvided} from "@holochain-open-dev/context";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {HowStore} from "../how.store";
import {Document, howContext, Dictionary, Section, DOC_TEMPLATE} from "../types";
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
    @property() isNew = false
    @property() editable = false

    @state() sections: Array<Section> = []

    @contextProvided({ context: howContext })
    _store!: HowStore;
  
    @query('#content-field')
    _contentField!: TextArea;
  
    _documentPaths = new StoreSubscriber(this, () => this._store.documentPaths);
    _documents = new StoreSubscriber(this, () => this._store.documents);

    resetAllFields() {
        this._editors = {}
        this._contentField.value = ""
    }

    /**
     *
     */
    new(path: string, document_type: string) {
      this.isNew = true
      this.editable = true
      this.path = path
        this.document_type = document_type
        const docs = this._documentPaths.value[document_type]
        for (const doc of docs) {
          if (doc.content.document_type == DOC_TEMPLATE) {
            // Poor-mans convert to markdown for now, this should actually add different sections to the dialog
            const title = doc.content.content[0].content
            const sections = doc.content.content.filter(section => section.name != 'title').map(({name, content, content_type})=>`## ${name}\n${content}`)            
            this._contentField.value = `# ${title}\n\n`+sections.join("\n\n") 
          } 
        }
        console.log(docs)
        const dialog = this.shadowRoot!.getElementById("document-dialog") as Dialog
        dialog.open = true
    }

    open(path: string, hash: EntryHashB64, editable: boolean) {
      this.isNew = false
      this.editable = editable
      this.path = path
      const document = this._documents.value[hash]
      this.document_type = document.document_type
      this.sections = document.content
      const dialog = this.shadowRoot!.getElementById("document-dialog") as Dialog
      dialog.open = true
    }
    
    private async handleOk(e: any) {
        /** Check validity */
        // nameField
        let content: Array<Section> = []
        let val = this._contentField.value;
        const title = val.match(/^# (.*)/)
        if (title) {
            content.push({name: "title", content: title[1], content_type:"type/plain"})
        }
        const sections = val.split("\n## ")
        sections.shift()
        sections.map(section => {
            let body = section.split("\n")
            const firstLine = body.shift()
            if (firstLine) {
                content.push({name: firstLine, content_type: "text/plain", content: body.join("\n")})
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
<mwc-dialog id="document-dialog" heading="${this.isNew ? "New" : this.editable? "Edit":"View"} Document" @closing=${this.handleDialogClosing} @opened=${this.handleDialogOpened}>
  <div> Path: ${this.path} </div>
  <div> Type: ${this.document_type} </div>
  ${this.editable ?
  html`
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
  `
  :
  html`${this.sections.map((section) => html`<h3>${section.name}</h3><div>${section.content}</div>`)}
  <hr />Editors: ${Object.entries(this._editors).map(([key,nickname])=> html`${nickname} `)}
 `
  }

  ${this.editable ? html`
  <mwc-button id="primary-action-button" slot="primaryAction" @click=${this.handleOk}>ok</mwc-button>
  <mwc-button slot="secondaryAction"  dialogAction="cancel">cancel</mwc-button>` :
  html`<mwc-button id="primary-action-button" slot="primaryAction" dialogAction="cancel">close</mwc-button>`}
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
