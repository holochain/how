import {css, html, LitElement, TemplateResult} from "lit";
import {property, query, state} from "lit/decorators.js";

import { contextProvided } from "@lit-labs/context";
import {StoreSubscriber} from "lit-svelte-stores";

import {sharedStyles} from "../sharedStyles";
import {EntryHashB64, Dictionary} from "@holochain-open-dev/core-types";
import {howContext, Section, SectionType, SourceManual, Document, DocType, DocumentOutput, HilightRange, CommentInfo, Comment, CommentStatus, MarkTypes} from "../types";
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
import { serializeHash } from "@holochain-open-dev/utils";
import { HowCommentBox } from "./how-comment-box";
import { ActionHash } from "@holochain/client";
import { HowConfirm } from "./how-confirm";
import { isEqual } from "lodash-es";

/**
 * @element how-document
 */
 export class HowDocument extends ScopedElementsMixin(LitElement) {
    constructor() {
      super();
    }
  
    @query('how-confirm')
    _confirmElem!: HowConfirm;
  
    @property() currentDocumentEh = "";
    @property() path = "";
    @state() commentingOn : Section|undefined = undefined;
    @state() highlitRange : HilightRange | undefined;
    private selectedCommentText: string = ""

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

    addComment(commentText: string, suggestion: string | undefined, section: Section) {
      const document = this._documents.value[this.currentDocumentEh]
      const sections = []

      if (suggestion != undefined) {
        sections.push({
          name: "suggestion",
          sourcePath: SourceManual,
          content: suggestion,
          contentType: "text/markdown",
          sectionType: SectionType.Content            
        })
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
      if (sections.length != 0) {
        const comment = new Document({
          unitHash: document.unitHash, 
          documentType: DocType.Comment,
          content: sections,
          meta: {
            document: this.currentDocumentEh, // points to document being commented on
            section: section.name, // key of content component being commented on
            startOffset: `${this.highlitRange?.startOffset}`, 
            endOffset: `${this.highlitRange?.endOffset}`,
          }
        })
        this._store.addDocument(this.path, comment)
      }
    }

    clearCommenting() {
      this.selectedCommentText = ""
      this.highlitRange = undefined
      this.commentingOn = undefined
    }

    comment(info: CommentInfo) {
      if (this.commentingOn) {
        this.addComment(info.commentText, info.suggestion, this.commentingOn)
        this.clearCommenting()
      }
    }

    openComment(section: Section) {
      const doc = this._documents.value[this.currentDocumentEh]
      if (doc.state != "refine") {
        return
      }

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
        this.highlitRange = {
          startOffset: range.startOffset+extra,
          endOffset: range.startOffset+range.toString().length+extra, // not endOffset because it might be in the part 1 hilight divs!
          sectionName: section.name,
          replacement: undefined,
          commentHash: undefined
        }
        this.selectedCommentText = section.content.substring(this.highlitRange.startOffset,this.highlitRange.endOffset)
      }
    }

    hilight(range: HilightRange) {
      const doc = this._documents.value[this.currentDocumentEh]
      if (doc.state != "refine") {
        return
      }
      this.commentingOn = undefined
      if (this.highlitRange && (this.highlitRange.commentHash == range.commentHash)) {
        this.highlitRange = undefined
      } else {
        this.highlitRange = range
      }
    }

    private getCommentDocs(doc: Document) : Dictionary<Array<Comment>> {
      const comments: Dictionary<Array<Comment>> = {}
      this._store.getDocumentsFiltered(this.path, serializeHash(doc.unitHash), DocType.Comment, true).forEach( commentDoc => {
        const comment = new Comment(commentDoc)
        if (comment.getDocumentHash() == this.currentDocumentEh) {
          const sectionName = comment.getSectionName()
          let sectionComments = comments[sectionName]
          if (sectionComments === undefined) {
            sectionComments = []
          }
          sectionComments.push(comment)
          comments[sectionName] = sectionComments.sort((a,b) => {
            return parseInt(a.documentOutput.content.meta["startOffset"]) - parseInt(b.documentOutput.content.meta["startOffset"])
          })
        }
      })
      return comments
    }

    handleCommentChange(index: number, suggestion: string) {
      if (this.highlitRange) {
            this.highlitRange.replacement = suggestion
            const sectionElement = this.shadowRoot!.getElementById("section-"+index) as HowSection
            sectionElement.highlitRange = this.highlitRange
            sectionElement.requestUpdate()
      }
    }

    async deleteComment(comment: Comment) : Promise<ActionHash> {
      const actionHash = await this._store.deleteDocument(this.path, comment.documentOutput);
      this.highlitRange = undefined
      return actionHash
    }

    async approveComment(comment: Comment) {
      this._store.markDocument(this.path, comment.hash(), CommentStatus.Approved, MarkTypes.CommentStatus)
    }
    
    async rejectComment(comment: Comment) {
      this._store.markDocument(this.path, comment.hash(), CommentStatus.Rejected, MarkTypes.CommentStatus)
    }

    handleConfirm(confirmation: any) {
      switch(confirmation.action) {
        case "delete": this.deleteComment(confirmation.comment); break;
        case "reject": this.rejectComment(confirmation.comment); break;
        case "approve": this.approveComment(confirmation.comment); break;
      }
    }

    private confirmAction(action: any) {
      this._confirmElem!.open(`Are you sure you want to ${action.action} this comment?`, action)
    }
 
    private sectionRow(doc:Document, section: Section, index: number, comments:Array<Comment>) : TemplateResult {
      let maybeCommentBox
      if (this.commentingOn && this.commentingOn.name == section.name) {
        maybeCommentBox = html`<how-comment-box
        @cancel=${()=>this.clearCommenting()}
        @save=${(e:any)=>this.comment(e.detail)}
        @suggestion-changed=${(e:any)=>this.handleCommentChange(index, e.detail)}
        .selectedCommentText=${this.selectedCommentText}
        ></how-comment-box>`
      }

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
          ${doc.state == "refine" ? html`
          <svg-button
            .click=${async () => this.commentingOn=section} 
            .button=${"comment_new"}>
          </svg-button>
          ` : ''}
          
          ${maybeCommentBox}
          ${comments ? html`
            <div class="column">
              ${comments.map(c => html`
              <how-comment 
                .comment=${c}
                .overlaps=${comments.find(comment=> comment != c && comment.overlaps(c))}
                @do-hilight=${(e:any) => this.hilight(e.detail)}
                @action=${(e:any) => e.detail.action == 'resolve' ?  alert(e.detail) : this.confirmAction(e.detail)}
                .selected=${this.highlitRange && this.highlitRange.commentHash == c.documentOutput.hash}
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
                .click=${() => this._newSectionDialog.open()}
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
        // const overlaps : Dictionary<Dictionary<Array<EntryHashB64>>> = {}
        // comments.entries.forEach(([sectionName, comments])=> {
        //   let sectionComments = overlaps[sectionName]
        //   if (sectionComments == undefined) {
        //     sectionComments = {}
        //   }
        //   sectionComments[sectionName] = sectionComments
        // })

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
          <how-confirm @confirmed=${(e:any) => this.handleConfirm(e.detail)}></how-confirm>
        `;
      
    }

    static get scopedElements() {
        return {
          "mwc-button": Button,
          "how-section": HowSection,
          "how-comment": HowComment,
          "how-comment-box": HowCommentBox,
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
          `,
        ];
  }
}
