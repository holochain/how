import {css, html, LitElement, TemplateResult} from "lit";
import {property} from "lit/decorators.js";
import { consume } from '@lit/context';

import {sharedStyles} from "../sharedStyles";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import { CommentStatus, HilightRange, howContext, Section, Comment, CommentAction } from "../types";
import '@holochain-open-dev/profiles/dist/elements/agent-avatar.js';
import { HowStore } from "../how.store";
import TimeAgo from "javascript-time-ago"
import en from 'javascript-time-ago/locale/en'

TimeAgo.addDefaultLocale(en)
const timeAgo = new TimeAgo('en-US')

/**
 * @element info-item
 */
export class HowComment extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  @consume({ context: howContext })
  _store!: HowStore;

  @property() comment: Comment | undefined;
  @property() selected: boolean = false;
  @property() overlaps: boolean = false;

  select() {
    if (this.comment) {
      
      const {startOffset, endOffset} = this.comment.getOffsets()
      const replacement = this.comment.suggestion()
      const hilightRange: HilightRange = {
        comments: [this.comment.hash()], 
        sectionName: this.comment.getSectionName(), 
        startOffset, 
        endOffset,
        replacement,
      }

      this.dispatchEvent(new CustomEvent('do-hilight', { detail: hilightRange, bubbles: true, composed: true }))
    }
  }
  // edit() {
  //   this.dispatchEvent(new CustomEvent('edit', { detail: this.comment, bubbles: true, composed: true }))
  // }
  dispatch (action :string) {
    this.dispatchEvent(new CustomEvent('action', { detail: new CommentAction(action, this.comment), bubbles: true, composed: true }))
  }

  sectionHTML(header:string, content: string, pre:boolean = false) : TemplateResult {
    return html`<div class="comment-section column"><div class="section-header">${header}</div><div class="section-content">${pre ? html`<pre class="source">${content}</pre>`:content}</div></div>`
  }

  canDelete(): boolean {
    if (this.comment  && this.comment.status == CommentStatus.Pending) {
      return this.comment.author() == this._store.myAgentPubKey
    }
    return false
  }

  canAddress(): boolean {
    return this.comment!.status == CommentStatus.Pending && this.comment!.commentingOn.editors.includes(this._store.myAgentPubKey)
  }

  render() {
    if (this.comment) {

      const commentDoc = this.comment.documentOutput.content
      const created = this.comment.created()
      let commentSection: Section | undefined
      let suggestionSection: Section | undefined
      let commentHTML
      let suggestionHTML
      let controlsHTML = []
      const isPre = this.comment.getSection()!.contentType == "text/markdown"
      if (this.comment.status == CommentStatus.Pending || this.selected) {
        commentDoc.content.forEach(section => {
          if (section.name == "comment") {
            commentSection = section
          }
          if (section.name == "suggestion") {
            suggestionSection = section
          }
        })
        if (commentSection) {
          commentHTML = this.sectionHTML("General Comment",commentSection.content)
        } 
        if (suggestionSection) {
          if (suggestionSection.content == "") {
            suggestionHTML = this.sectionHTML("Change Request-- Delete", "")
          } else {
            suggestionHTML = this.sectionHTML("Change Request-- " + (this.comment.startOffset() != this.comment.endOffset() ? "Replace with: " : "Insert: "), suggestionSection.content, isPre)
          }
        } 
        if (this.canDelete()) {
          controlsHTML.push(html`
            <svg-button
              button="trash"
              info="delete"
              infoPosition="right"
              .click=${() => this.dispatch('delete')}
            ></svg-button>
          `)
        }
        if (this.canAddress()) {
          const actions = []
          if (this.overlaps) {
            actions.push(['edit',"resolve"])
            actions.push(["reject",'reject'])
          } else if (commentSection && !suggestionSection) {
            actions.push(['approve',"got-it"])
          } else {
            actions.push(["approve",'approve'])
            actions.push(['edit',"modify"])
            actions.push(["reject",'reject'])
          }
          for (const [button, action] of actions) {
            controlsHTML.push(html`
            <svg-button
              button=${`comment_${button}`}
              info=${action}
              infoPosition="right"
              .click=${() => this.dispatch(action)}
            ></svg-button>
            `)
          }
        }
      }
      let statusClass = ""
      if(this.selected) {
        statusClass = "hilight"
        if (this.comment.status != CommentStatus.Pending) {
          controlsHTML.push(html`${this.comment.status}`)
        }
      } else {
        switch (this.comment.status) {
          case CommentStatus.Approved: statusClass = "approved";break;
          case CommentStatus.Rejected: statusClass = "rejected";break;
          case CommentStatus.Modified: statusClass = "modified";break;
        }
      }
      let commentSectionsHTML
      if (commentHTML || suggestionHTML) {
        const text = this.comment.getCommentingOnText(true)
        const commentingOnHTML = text ? this.sectionHTML("Commenting on:", text, isPre) : undefined
        commentSectionsHTML = html `
          <div class="comment-sections column">
            ${commentHTML}
            ${suggestionHTML}
            ${commentingOnHTML}
          </div>`
      }
      return html` 
        <div class="comment ${statusClass}" @click=${()=> this.select()}>
          <div class="comment-header row">
            <agent-avatar agent-pub-key=${this.comment.author()}> </agent-avatar>
            <span title=${`${created}`}>${timeAgo.format(created)}</span>
          </div>
          ${commentSectionsHTML}
          <div class="row comment-controls">
            ${controlsHTML}
          </div>
        </div>`
    }
  }

  static get styles() {
    return [
      sharedStyles,
      css`
        agent-avatar {
          margin-right: 10px;
        }
        .comment {
          padding: 0px 14px;
          height: fit-content;
          border: solid 1px;
          border-radius: 5px;
        }
        .comment-header {
          margin-top: 8px;
          margin-bottom: 5px;
          align-items: center;
        }
        .comment-sections {
          padding: 10px;
          background: white;
        }
        .comment-section {
          margin-bottom: 10px;
        }
        .section-header {
          font-weight: bold;
          color: gray;
          font-size: 70%;
        }
        .section-content {
          max-width: 1000px;
          margin-left: 5px;
        }
        .approved {
          background-color: lightgreen;
        }
        .rejected {
          background-color: lightcoral;
        }
        .modified {
          background-color: lightblue;
        }
      `,
    ];
  }
}

