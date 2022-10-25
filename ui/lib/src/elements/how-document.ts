import {css, html, LitElement, TemplateResult} from "lit";
import {property, query, state} from "lit/decorators.js";

import { contextProvided } from "@lit-labs/context";
import {StoreSubscriber} from "lit-svelte-stores";

import {sharedStyles} from "../sharedStyles";
import {EntryHashB64, AgentPubKeyB64, Dictionary} from "@holochain-open-dev/core-types";
import {Unit, howContext, Section, SectionType, SourceManual, Document, DocType, DocumentOutput, HilightRange} from "../types";
import {HowStore} from "../how.store";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {
  Button, TextArea, TextField,
} from "@scoped-elements/material-web";

// @ts-ignore
import { AgentAvatar } from "@holochain-open-dev/profiles";
import { HowNewSectionDialog } from "./how-new-section-dialog";
import { HowSection } from "./how-section";
import { HowComment } from "./how-comment";
import { InfoItem } from "./info-item";
import { serializeHash } from "@holochain-open-dev/utils";

/**
 * @element how-document
 */
 export class HowDocument extends ScopedElementsMixin(LitElement) {
    constructor() {
      super();
    }
  
    @property() currentDocumentEh = "";
    @property() path = "";
    @state() commentingOn : Section|undefined = undefined;
    @state() highlitRange : HilightRange | undefined;
    private commentRange: Range | undefined = undefined

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
        sourcePath: SourceManual,
        content: "{}"
      }
      const document = this._documents.value[this.currentDocumentEh]
      document.content.push(section)
      const newDocumentHash = await this._store.updateDocument(this.currentDocumentEh, document);
      this.dispatchEvent(new CustomEvent('document-updated', { detail: newDocumentHash, bubbles: true, composed: true }));
    }

    addComment(commentText: string, section: Section) {
      const document = this._documents.value[this.currentDocumentEh]
      const sections = []
      if (this.commentRange) {
        const matches = commentText.match(/([\s\S]*)```suggestion\s*([\s\S]*)\n```([\s\S]*)/)
        if (matches) {
          const suggestion = matches[2]
          const selectedText = this.commentRange.toString()
          if (selectedText != suggestion) {
            sections.push({
              name: "suggestion",
              sourcePath: SourceManual,
              content: suggestion,
              contentType: "text/markdown",
              sectionType: SectionType.Content            
            })
          }
          commentText = matches[1]+matches[3]
        }
      }
      if (commentText != "") {
        sections.unshift(
        {name: "comment",
          sourcePath: SourceManual,
          content: commentText,
          contentType: "text/markdown",
          sectionType: SectionType.Content}
        )
      }
      if (sections.length == 0) {
        alert("please make a comment or suggested change")
        return
      }
      const comment = new Document({
        unitHash: document.unitHash, 
        documentType: DocType.Comment,
        content: sections,
        meta: {
          document: this.currentDocumentEh, // points to document being commented on
          section: section.name, // key of content component being commented on
          startOffset: `${this.commentRange?.startOffset}`, 
          endOffset: `${this.commentRange?.endOffset}`,
        }
      })
      this._store.addDocument(this.path, comment)
      this.clearCommenting()
    }

    clearCommenting() {
      this.highlitRange = undefined
      this.commentingOn = undefined
    }

    comment() {
      if (this.commentingOn) {
        const valElement = this.shadowRoot!.getElementById(`comment`) as TextField
        this.addComment(valElement.value, this.commentingOn)
      }
    }
    openComment(section: Section) { 
      // TODO handle double-click     
      this.commentingOn = undefined
      this.commentingOn = section
      const sel = document.getSelection()
      if (sel) {
        const range = sel.getRangeAt(0)
        let extra = 0
        if (this.highlitRange) {
          switch (range.startContainer.parentElement?.id) {
            case "2":
              extra = this.highlitRange.endOffset;
              break;
            case "hilight":
            case "cursor":
              extra = this.highlitRange.endOffset - range.startContainer.parentElement!.textContent!.length
          }
        }
        this.commentRange = range
        this.highlitRange = {
          startOffset: range.startOffset+extra,
          endOffset: range.startOffset+range.toString().length+extra, // not endOffset because it might be in the part 1 hilight divs!
          sectionName: section.name,
          replacement: undefined,
          commentHash: undefined
        }

      }
    }

    hilight(range: HilightRange) {
      this.commentingOn = undefined
      this.highlitRange = range
    }

    private getCommentDocs(doc: Document) : Dictionary<Array<DocumentOutput>> {
      const comments: Dictionary<Array<DocumentOutput>> = {}
      this._store.getDocumentsFiltered(this.path, serializeHash(doc.unitHash), DocType.Comment, true).forEach( comment => {
        const commentDoc: EntryHashB64 = comment.content.meta["document"]
        if (commentDoc == this.currentDocumentEh) {
          const sectionName = comment.content.meta["section"]
          let sectionComments = comments[sectionName]
          if (sectionComments === undefined) {
            sectionComments = []
          }
          sectionComments.push(comment)
          comments[sectionName] = sectionComments
        }
      })
      return comments
    }
    handleCommentChange(index: number) {
      if (this.highlitRange) {
        const commentBox = this.shadowRoot!.getElementById("comment") as TextArea
        if (commentBox) {
          commentBox.reportValidity()
          const matches = commentBox.value.match(/([\s\S]*)```suggestion\s*([\s\S]*)\n```([\s\S]*)/)
          if (matches) {
            const suggestion = matches[2]
            this.highlitRange.replacement = suggestion
            const sectionElement = this.shadowRoot!.getElementById("section-"+index) as HowSection
            sectionElement.highlitRange = this.highlitRange
            sectionElement.requestUpdate()
          }
        }
      }
    }
    private sectionRow(doc:Document, section: Section, index: number, comments:Array<DocumentOutput>) : TemplateResult {
      const maybeCommentBox = this.commentingOn && this.commentingOn.name == section.name?
        html`
        <div class="comment-box column"
          @keyup=${(e:any)=>{if (e.code=="Escape"){this.clearCommenting()}}}
        >
          <div class="row comment-header">
            Add Comment:
          </div>
          <mwc-textarea @input=${() => this.handleCommentChange(index)}
            cols="50" id="comment" .value=${this.commentRange && this.commentRange.toString() ? `\`\`\`suggestion\n${this.commentRange.toString()}\n\`\`\`` : ""} cols="100" .rows=${5} autoValidate=true required>
          </mwc-textarea>

          <div class="row comment-controls">
            <svg-button
              button="save"
              info="save"
              infoPosition="right"
              @click=${() => this.comment()} 
            ></svg-button>
            <svg-button
                button="close"
                info="cancel"
                infoPosition="right"
                @click=${() => this.clearCommenting()}
              ></svg-button>
          </div>
        </div>
        `
        :
        ''

      return html`
      <div class="section row">
        <how-section id=${'section-'+index}
          @selection=${(e:any)=>this.openComment(e.detail)}
          @section-changed=${(e:any) => this.updateSection(e.detail, index)}
          .section=${section} 
          .index=${index}
          .highlitRange=${this.highlitRange && this.highlitRange.sectionName == section.name ? this.highlitRange: undefined}
          .editable=${doc.isEditable(section.name)}
          >
        </how-section>
        <div class="column">
          <svg-button
            .click=${async () => this.commentingOn=section} 
            .button=${"new_comment"}>
          </svg-button>
          ${maybeCommentBox}
          ${comments ? html`
            <div class="column">
              ${comments.map(c => html`
              <how-comment 
                .comment=${c} 
                @do-hilight=${(e:any) => this.hilight(e.detail)}
                .selected=${this.highlitRange && this.highlitRange.commentHash == c.hash}
              ></how-comment>`)}
            </div>
          `:''}
        </div>
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

        const comments = this.getCommentDocs(doc)

        const sectionsHTML = doc.content.filter(section => section.sectionType != SectionType.Requirement).map((section, index) => 
          this.sectionRow(doc, section, index, comments[section.name]))
        let requirementsHTML = doc.content.filter(section => section.sectionType == SectionType.Requirement).map((section, index) => 
          this.sectionRow(doc, section, index, comments[section.name]))
        if (requirementsHTML.length > 0) {
          requirementsHTML.unshift(html`
            <info-item item="Requirements" name="sections that this standard requires of sub-nodes"></info-item>
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
          <div id="sections" }>
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
            width: 1000px;
          }
          .comment-box {
            background-color: lightblue;
            padding: 0px 14px;
            height: fit-content;
            border: solid 1px;
            border-radius: 5px;
          }
          .comment-header {
            margin-top: 8px;
            align-items: center;
            justify-content: space-between;
          }
          .comment-controls {
            align-items: center;
          }
          `,
        ];
  }
}
