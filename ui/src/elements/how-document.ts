import {css, html, LitElement, TemplateResult} from "lit";
import {property, query, state} from "lit/decorators.js";

import { consume } from '@lit/context';
import { StoreSubscriber } from "@holochain-open-dev/stores";

import {sharedStyles} from "../sharedStyles";
import {EntryHashB64, decodeHashFromBase64, encodeHashToBase64} from "@holochain/client";
import {howContext, Section, SectionType, SourceManual, Document, DocType, HilightRange, CommentInfo, Comment, CommentStatus, MarkTypes, MarkDocumentInput, CommentAction, applyApprovedComments, CommentStats, DocumentStats, DocumentAction, VoteAction, ApprovalAction, Dictionary, Unit} from "../types";
import {HowStore} from "../how.store";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {
  Button,
} from "@scoped-elements/material-web";

import '@holochain-open-dev/profiles/dist/elements/agent-avatar.js';
import { HowNewSectionDialog } from "./how-new-section-dialog";
import { HowSection } from "./how-section";
import { HowComment } from "./how-comment";
import { InfoItem } from "./info-item";
import { HowCommentBox } from "./how-comment-box";
import { ActionHash } from "@holochain/client";
import { HowConfirm } from "./how-confirm";
import { CommentControl, Control } from "../controls";
import {until} from 'lit-html/directives/until.js';
import { hrlB64WithContextToRaw, hrlWithContextToB64 } from "../util";

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
    @property() readOnly: boolean = false;
    @state() commentingOn : Section|undefined = undefined;
    @state() highlitRange : HilightRange | undefined;
    @state() overlapping : Comment[] | undefined
    @state() commentStats : CommentStats | undefined;
    @state() availbleCollectionSections : Array<string>  = ["host_fn specs"]
    @state() collectionDefs : Array<Section> = []

    _units = new StoreSubscriber(this, () => this._store.units);

    private selectedCommentText: string = ""
  
    async updated(changedProperties:any) {
      for (const [prop,_] of changedProperties) {
        if (prop === 'currentDocumentEh' && prop.currentDocumentEh != this.currentDocumentEh) {
          this.collectionDefs = await this._store.collectionDefs(this.currentDocumentEh)
          break;
        }
      }
    }

    @query('how-new-section-dialog')
    private _newSectionDialog!: HowNewSectionDialog;
  
  
    @consume({ context: howContext })
    _store!: HowStore;
    _documents = new StoreSubscriber(this, () => this._store.documents);

    async updateSection(section:Section, index:number) {
      const document = this._documents.value[this.currentDocumentEh]
      const newDocumentHash = await this._store.updateDocument(this.currentDocumentEh, document);
      this.dispatchEvent(new CustomEvent('document-updated', { detail: newDocumentHash, bubbles: true, composed: true }));
    }

    async deleteSection(section:Section, index:number) {
      const document = this._documents.value[this.currentDocumentEh]
      document.content.splice(index,1)
      const newDocumentHash = await this._store.updateDocument(this.currentDocumentEh, document);
      this.dispatchEvent(new CustomEvent('document-updated', { detail: newDocumentHash, bubbles: true, composed: true }));
    }

    async addSection(section: Section) {
      const document = this._documents.value[this.currentDocumentEh]
      document.content.push(section)
      const newDocumentHash = await this._store.updateDocument(this.currentDocumentEh, document);
      this.dispatchEvent(new CustomEvent('document-updated', { detail: newDocumentHash, bubbles: true, composed: true }));
    }

    async addComment(commentText: string, suggestion: string | undefined, section: Section) : Promise<EntryHashB64|undefined> {
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
        return this._store.addDocument(this.path, comment)
      }
      return undefined
    }

    clearCommenting() {
      this.selectedCommentText = ""
      this.highlitRange = undefined
      this.commentingOn = undefined
      this.overlapping = undefined
    }

    async comment(info: CommentInfo) {
      if (this.commentingOn) {
        const commentHash = await this.addComment(info.commentText, info.suggestion, this.commentingOn)
        if (commentHash && this.overlapping) {
          const input : Array<MarkDocumentInput> = []
          this.overlapping.forEach(comment =>
            input.push({mark: CommentStatus.Modified, hash: comment.hash(), markType: MarkTypes.CommentStatus})
          )
          input.push({mark: CommentStatus.Approved, hash: commentHash, markType: MarkTypes.CommentStatus })
          this._store.markDocument(this.path, input)
        }
        this.clearCommenting()
      }
    }

    openCommentFromSelection(detail:any) {
      //@ts-ignore
      const section: Section = detail.section
      //@ts-ignore
      const element: HTMLElement = detail.element
      //@ts-ignore
      const root: ShadowRoot = detail.root
      const doc = this._documents.value[this.currentDocumentEh]
      if (doc.state != "refine" || this.readOnly) {
        return
      }

      // TODO handle double-click

      //@ts-ignore
      const sel = root.getSelection()
      if (!sel) {
        const sel= document.getSelection()
      }
      if (sel) {
        const range = sel.getRangeAt(0)
        console.log("RANGE",range)
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
        const highlitRange = {
          startOffset: range.startOffset+extra,
          endOffset: range.startOffset+range.toString().length+extra, // not endOffset because it might be in the part 1 hilight divs!
          sectionName: section.name,
          replacement: undefined,
          comments: undefined
        }
        this.openCommentFromHilitRange(section, highlitRange)
      }
    }

    openCommentFromHilitRange(section: Section, highlitRange: HilightRange) {
      this.commentingOn = undefined
      this.commentingOn = section
      this.highlitRange = highlitRange
      this.selectedCommentText = section.content.substring(this.highlitRange.startOffset,this.highlitRange.endOffset)
    }

    hilight(range: HilightRange) {
      const doc = this._documents.value[this.currentDocumentEh]
      if (doc.state != "refine") {
        return
      }
      this.commentingOn = undefined
      this.overlapping = undefined
      this.highlitRange = range
    }

    private getCommentDocs(doc: Document) : Dictionary<Array<Comment>> {
      const comments: Dictionary<Array<Comment>> = {}
      let pending = 0
      let suggestions = 0
      let approved = 0
      let rejected = 0
      let modified = 0
      let total = 0

      this._store.getDocumentsFiltered(this.path, encodeHashToBase64(doc.unitHash), DocType.Comment, true).forEach( commentDoc => {
        const comment = new Comment(commentDoc, doc)
        if (comment.getDocumentHash() == this.currentDocumentEh) {
          total += 1;
          if (comment.status == CommentStatus.Pending) {pending += 1}
          if (comment.status == CommentStatus.Approved) {approved += 1}
          if (comment.status == CommentStatus.Rejected) {rejected += 1}
          if (comment.status == CommentStatus.Modified) {modified += 1}
          if (comment.suggestion() != undefined) {suggestions += 1}
  
          const sectionName = comment.getSectionName()
          let sectionComments = comments[sectionName]
          if (sectionComments === undefined) {
            sectionComments = []
          }
          sectionComments.push(comment)
          comments[sectionName] = sectionComments.sort((a,b) => {
            return a.startOffset() - b.startOffset()
          })
        }
      })
      this.commentStats = {total, pending, approved, rejected, modified, suggestions}

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

    removeCommentFromHilight(comment: Comment) {
      if (this.highlitRange && this.highlitRange.comments) {
        const index = this.highlitRange.comments.findIndex(c => c == comment.hash());
        if (index > -1) {
          this.highlitRange.comments.splice(index, 1);
        }
        // for (const c of this.highlitRange.comments) {
        //     c.startOffset = Math.min(this.hilightRange.startOffset,c.startOffset())
        //     hilightRange.endOffset = Math.max(hilightRange.endOffset,c.endOffset())
        //     overlapping.push(c); hilightRange.comments!.push(c.hash())
        //   }
      }
    }

    async approveComment(comment: Comment) {
      this.clearCommenting()
      this._store.markDocument(this.path, [{hash:comment.hash(), mark: CommentStatus.Approved, markType: MarkTypes.CommentStatus}])
    }
    
    async rejectComment(comment: Comment) {
      this.clearCommenting()
      this._store.markDocument(this.path, [{hash:comment.hash(), mark: CommentStatus.Rejected, markType: MarkTypes.CommentStatus}])
    }

    setResolveHilighiting(comment: Comment) : HilightRange | undefined {
      const doc = this._documents.value[this.currentDocumentEh]
      if (doc) {
        const sectionName = comment.getSectionName()
        const comments = this.getCommentDocs(doc)[sectionName]
        const overlapping = [comment]
        const hilightRange : HilightRange = {sectionName, endOffset:comment.endOffset(), startOffset:comment.startOffset(), comments: [comment.hash()], replacement: undefined}
        let count = 0;
        while (count < overlapping.length) {
          const current = overlapping[count]
          for (const c of comments) {
            if (c.status == CommentStatus.Pending && !overlapping.find(x=>x.hash() == c.hash()) && c.overlaps(current)) {
              hilightRange.startOffset = Math.min(hilightRange.startOffset,c.startOffset())
              hilightRange.endOffset = Math.max(hilightRange.endOffset,c.endOffset())
              overlapping.push(c); hilightRange.comments!.push(c.hash())
            }
          }
          count += 1
        }
        this.overlapping = overlapping
        return hilightRange
      }
      return undefined
    }

    async resolveComments(comment: Comment) {
      const hilightRange = this.setResolveHilighiting(comment)
      if (hilightRange) {
        this.openCommentFromHilitRange(comment.getSection()!,hilightRange)
      }
    }
    async modifyComment(comment: Comment) {
      const sectionName = comment.getSectionName()
      const hilightRange : HilightRange = {sectionName, endOffset:comment.endOffset(), startOffset:comment.startOffset(), comments: [comment.hash()], replacement: undefined}
      this.overlapping = [comment]
      this.openCommentFromHilitRange(comment.getSection()!,hilightRange)
    }

    async vote(action: VoteAction) {
      const doc : Document = this._documents.value[this.currentDocumentEh]
      this._store.markDocument(this.path, [{hash: doc.documentHash!, mark: action.vote?"approve":"reject", markType: MarkTypes.Vote}])
    } 
    async approve(action: ApprovalAction) {
      const doc : Document = this._documents.value[this.currentDocumentEh]
      this._store.markDocument(this.path, [{hash: doc.documentHash!, mark: action.approval?"approve":"retract", markType: MarkTypes.Approval}])
    } 

    handleConfirm(confirmation: any) {
      switch((confirmation as DocumentAction).actionType) {
        case "VoteAction":
          this.vote(confirmation); break;
        case "ApprovalAction":
          this.approve(confirmation); break;
        case "CommentAction":
         switch(confirmation.action) {
          case "delete": this.deleteComment(confirmation.comment); break;
          case "reject": this.rejectComment(confirmation.comment); break;
          case "approve": this.approveComment(confirmation.comment); break;
          case "got-it": this.approveComment(confirmation.comment); break;
          case "apply": this.applySuggestions();break;
        }
      }
    }

    private confirmAction(action: CommentAction) {
      this._confirmElem!.open(`Are you sure you want to ${action.action} this comment?`, action)
    }

    private confirmApply() {
      if (this.readOnly) {
        return
      }
      this._confirmElem!.open(`Are you sure you want to apply all suggestions to the document?`, new CommentAction("apply", undefined))
    }

    handleCommentAction(action: CommentAction) {
      if (this.readOnly) {
        return
      }
      switch (action.action) {
        case 'resolve': this.resolveComments(action.comment!); break;
        case 'modify' : this.modifyComment(action.comment!); break;
        default:
          this.confirmAction(action)
      }
    }

    private async applySuggestions() {
      if (this.readOnly) {
        return
      }
      const doc : Document = this._documents.value[this.currentDocumentEh]
      const comments = await this.getCommentDocs(doc)
      for (const section of doc.content) {
        if (comments[section.name]) {
          section.content = applyApprovedComments(section.content,comments[section.name])
        }
      }
      const newDocumentHash = await this._store.updateDocument(this.currentDocumentEh, doc);
      this.dispatchEvent(new CustomEvent('document-updated', { detail: newDocumentHash, bubbles: true, composed: true }));
    }

    private canMakeComments(doc:Document, section: Section) : boolean {
      // TODO check that the section can accept comments
      return !this.readOnly && this.canSeeComments(doc, section) && doc.state == "refine" //TODO the state check should probably come from elsewhere?
    }

    private canSeeComments(doc:Document, section: Section) : boolean {
      for (const control of this.controls) {
        if (control.contentType() == "control/comments" && control.state.enabled) return true
      }
      return false
    }

    private async addAttachment() {
      if (this._store.weClient) {
        const hrl = await this._store.weClient.userSelectHrl()
        if (hrl) {
          const doc : Document = this._documents.value[this.currentDocumentEh]
          await this._store.markDocument(this.path, [{hash: doc.documentHash!, mark: JSON.stringify(hrlWithContextToB64(hrl)), markType: MarkTypes.Attachment}])            }
      }
    }

    private sectionRow(doc:Document, section: Section, index: number, comments:Array<Comment>, isSteward: boolean) : TemplateResult {
      let commentsHTML
      if (this.canSeeComments(doc, section)) {
        const canMakeComments = this.canMakeComments(doc, section)
        let maybeCommentBox
        if (canMakeComments && this.commentingOn && this.commentingOn.name == section.name) {
          maybeCommentBox = html`<how-comment-box
          @cancel=${()=>this.clearCommenting()}
          @save=${(e:any)=>this.comment(e.detail)}
          @suggestion-changed=${(e:any)=>this.handleCommentChange(index, e.detail)}
          .selectedCommentText=${this.selectedCommentText}
          .resolve=${this.overlapping != undefined}
          ></how-comment-box>`
        }
        commentsHTML = html`
        <div class="section-comments column">
          ${canMakeComments ? html`
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
                .overlaps=${comments.find(comment=> comment.status == CommentStatus.Pending && comment != c && comment.overlaps(c))}
                @do-hilight=${(e:any) => this.hilight(e.detail)}
                @action=${(e:any) => this.handleCommentAction(e.detail)}
                .selected=${this.highlitRange && this.highlitRange.comments && this.highlitRange.comments.includes(c.documentOutput.hash)}
              ></how-comment>`)}
            </div>
          `:''}
        </div>
        `
      }

      return html`
      <div class="section row">
        <how-section id=${'section-'+index}
          .document=${doc}
          @selection=${(e:any)=>this.openCommentFromSelection(e.detail)}
          @section-changed=${(e:any) => this.updateSection(e.detail, index)}
          @delete-section=${(e:any) => this.deleteSection(e.detail, index)}
          .section=${section} 
          .index=${index}
          .highlitRange=${this.highlitRange && this.highlitRange.sectionName == section.name ? this.highlitRange: undefined}
          .readOnly=${this.readOnly}
          .comments=${comments}
          .isSteward=${isSteward}
          >
        </how-section>
        ${commentsHTML}
      </div>
      `
    }
    controls: Array<Control> = []
    render() {
        if (!this.currentDocumentEh) {
          return;
        }
        const doc : Document = this._documents.value[this.currentDocumentEh]
        const unit: Unit = this._units.value[encodeHashToBase64(doc.unitHash)]
        const isSteward = unit.stewards.includes(this._store.myAgentPubKey)

        let addSectionHTML
        if (doc.canAddSection() && !this.readOnly) {
          const document = this._documents.value[this.currentDocumentEh]
          addSectionHTML = html`
            ${ this.collectionDefs ? 
                this.collectionDefs.map((def) => html`
                  <svg-button
                        button="plus"
                        info="add ${def.name} collection section"
                        infoPosition="right"
                        .click=${() => {
                          this.addSection(def)
                        }}
                        ></svg-button>
                  </div>`) :

                html`Loading...`
            }
            <svg-button
                  button="plus"
                  info="add section"
                  infoPosition="right"
                  .click=${() => this._newSectionDialog.open()}
                  ></svg-button>
            </div>

            <how-new-section-dialog
              .takenNames=${doc.content.map((s)=>s.name)}
              @add-section=${(e:any) => {
                      const section: Section = {
                        name:e.detail.name, 
                        contentType:e.detail.contentType, 
                        sectionType:e.detail.sectionType,
                        sourcePath: SourceManual,
                        content: ""
                      }
                
                this.addSection(section)
              }}
              sectionType=${SectionType.Content}
            ></how-new-section-dialog>
            
          `
        }

        const comments = this.getCommentDocs(doc)

        const sections = doc.content.filter(section => section.sectionType != SectionType.Requirement)

        this.controls = doc.controls()

        const sectionsHTML = sections.map((section, index) => 
          this.sectionRow(doc, section, index, comments[section.name], isSteward))
        const requirements =  doc.content.filter(section => section.sectionType == SectionType.Requirement)
        let requirementsHTML = requirements.map((section, index) => 
          this.sectionRow(doc, section, index, comments[section.name], isSteward))
        if (requirementsHTML.length > 0) {
          requirementsHTML.unshift(html`
            <info-item item="Requirements" name="sections that this standard requires of sub-nodes"></info-item>
          `)
        }
        const docStats: DocumentStats = doc.getStats()
        let affordancesHTML: Array<TemplateResult> = []
        if (!this.readOnly) {
          this.controls.forEach(control=>{
            affordancesHTML = affordancesHTML.concat(control.affordances(this._store.myAgentPubKey, doc, this._confirmElem!))
          })

          if (CommentControl.canApplySuggestions(this.commentStats)) {
            affordancesHTML.push(html`
                <div><svg-button
                  button="plus"
                  info="apply suggestions"
                  infoPosition="right"
                  .click=${() => this.confirmApply()}
                  ></svg-button>
                </div>`)
          }
          if (this._store.weClient) {
            const isSteward = unit.stewards.includes(this._store.myAgentPubKey)
            if (isSteward) {
              affordancesHTML.push(html`
                  <div>
                  <svg-button
                    button="clipboard"
                    info="hrl to clipboard"
                    infoPosition="right"
                    .click=${() => {
                      const attachment = { hrl: [this._store.dnaHash, decodeHashFromBase64(this.currentDocumentEh)], context: {} }
                      // @ts-ignore
                      this._store.weClient?.hrlToClipboard(attachment)
                    }}
                    ></svg-button>
                    <svg-button
                    button="plus"
                    info="add attachment"
                    infoPosition="right"
                    .click=${() => this.addAttachment()}
                    ></svg-button>
                  </div>`)
            }
            for (const mark of doc.marks.filter(m=>m.markType==MarkTypes.Attachment)) {
              const attachment = JSON.parse(`${mark.mark}`)
              affordancesHTML.push(html`
                <div style="display:flex; align-items:center">
                ${until(this._store.weClient.entryInfo(hrlB64WithContextToRaw(attachment).hrl)
                .then(res=> {
                  if (res) {
                    const entryInfo = res.entryInfo
                    return html`
                    ${entryInfo.name}
                    
                    <svg-button
                      button="paperclip"
                      .click=${()=>{
                          const hrl = hrlB64WithContextToRaw(attachment)
                          // @ts-ignore
                          this._store.weClient.openHrl(hrl.hrl, hrl.context)
                         }}
                     >
                    </svg-button>`
                  }}
                  ),
                html`...`
                )}
                </div>
                `)
            }
          }
        }
        let tasksHTML: Array<TemplateResult> = []
        if (docStats.emptySections > 0) {
          tasksHTML.push(html`<div class="task">${docStats.emptySections} sections need editing</div>`)
        }
        if (this.commentStats && this.commentStats.pending > 0) {
          tasksHTML.push(html`<div class="task">${this.commentStats.pending} comments need addressing</div>`)
        }
        this.controls.forEach(control=>{
          tasksHTML = tasksHTML.concat(control.tasks(this._store.myAgentPubKey, doc))
        })
      return html`
          <div id="header">
            ${doc.documentType == DocType.Collection ? html`<h3>Collection</h3>` : 
              html`
                ${tasksHTML.length>0 ? html`<div class="tasks">${tasksHTML}</div>`:''}
                ${affordancesHTML.length>0 ? html`<div class="affordances">${affordancesHTML}</div>`:''}
                <div id="editors" class="row">
                  Editors: <how-agent-list layout="row" .agents=${doc.editors}></how-agent-list>
                </div>
              `
            }
          </div>
          <div id="sections" >
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
