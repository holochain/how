import {css, html, LitElement} from "lit";
import {property} from "lit/decorators.js";
import { contextProvided } from "@lit-labs/context";

import {sharedStyles} from "../sharedStyles";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import { DocumentOutput, HilightRange, howContext, Section } from "../types";
import { serializeHash } from "@holochain-open-dev/utils";
import { AgentAvatar } from "@holochain-open-dev/profiles";
import { HowStore } from "../how.store";

/**
 * @element info-item
 */
export class HowComment extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  @contextProvided({ context: howContext })
  _store!: HowStore;

  @property() comment: DocumentOutput | undefined;
  @property() selected: boolean = false;
  

  select() {
    if (this.comment) {
      //this.selected = true
      const commentDoc = this.comment.content
      const meta = commentDoc.meta
      const suggestionSection = commentDoc.getSection("suggestion")
      const replacement = suggestionSection ? suggestionSection.content : undefined
      const hilightRange: HilightRange = {
        commentHash:this.comment.hash, 
        sectionName: meta["section"], 
        startOffset: parseInt(meta["startOffset"]), 
        endOffset: parseInt(meta["endOffset"]),
        replacement,
      }

      this.dispatchEvent(new CustomEvent('do-hilight', { detail: hilightRange, bubbles: true, composed: true }))
    }
  }
  // edit() {
  //   this.dispatchEvent(new CustomEvent('edit', { detail: this.comment, bubbles: true, composed: true }))
  // }
  delete () {
    this.dispatchEvent(new CustomEvent('delete', { detail: this.comment, bubbles: true, composed: true }))
  }
  render() {
    if (this.comment) {
      const commentDoc = this.comment.content
      const created = new Date(this.comment.actions[0].content.timestamp/1000)
      let commentSection: Section | undefined
      let suggestionSection: Section | undefined
      commentDoc.content.forEach(section => {
        if (section.name == "comment") {
          commentSection = section
        }
        if (section.name == "suggestion") {
          suggestionSection = section
        }
      })
      let commentHTML
      if (commentSection) {
        commentHTML = html`<div class="comment-text">${commentSection.content}</div>`
      } 
      let suggestionHTML
      if (suggestionSection) {
        if (suggestionSection.content == "") {
          suggestionHTML = html`<div class="suggestion">Suggest Delete</div>`
        } else {
          suggestionHTML = html`
            <div class="suggestion">Suggest Replace With: ${suggestionSection.content}</div>`
        }
      } 
      let controlsHTML
      if (serializeHash(this.comment.actions[0].content.author) == this._store.myAgentPubKey) {
        controlsHTML = html`
          <svg-button
            button="trash"
            info="delete"
            infoPosition="right"
            .click=${() => this.delete()}
          ></svg-button>
        `
      }
      return html` 
        <div class="comment ${this.selected ? "hilight": ""}" @click=${()=> this.select()}>
          <div class="comment-header row">
            <agent-avatar agent-pub-key=${serializeHash(this.comment.actions[0].content.author)}> </agent-avatar>
            ${created.toLocaleDateString('en-us', { year:"numeric", month:"short", day:"numeric"})}
          </div>
            ${commentHTML}
            ${suggestionHTML}
            ${controlsHTML}
        </div>`
    }
  }
  static get scopedElements() {
    return {
      "agent-avatar": AgentAvatar,
    };
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
          align-items: center;
        }
        .comment-text {
          background: white;
        }
        .suggestion {
          background: white;
        }
      `,
    ];
  }
}

