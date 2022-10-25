import {css, html, LitElement} from "lit";
import {property, query, state} from "lit/decorators.js";

import {sharedStyles} from "../sharedStyles";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import { DocumentOutput, HilightRange, Section } from "../types";
import { serializeHash } from "@holochain-open-dev/utils";
import { AgentAvatar } from "@holochain-open-dev/profiles";
/**
 * @element info-item
 */
export class HowComment extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

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
        replacement
      }

      this.dispatchEvent(new CustomEvent('do-hilight', { detail: hilightRange, bubbles: true, composed: true }))
    }
  }

  render() {
    if (this.comment) {
      const commentDoc = this.comment.content
      const created = new Date(this.comment.actions[0].timestamp/1000)
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
      const commentHTML = commentSection ? commentSection.content : ""
      const suggestionHTML = suggestionSection ? html`Suggestion: ${suggestionSection.content}`: ""
      return html` 
        <div class="comment ${this.selected ? "hilight": ""}" @click=${()=> this.select()}>
          <div class="comment-header row">
            <agent-avatar agent-pub-key=${serializeHash(this.comment.actions[0].author)}> </agent-avatar>
            ${created.toLocaleDateString('en-us', { year:"numeric", month:"short", day:"numeric"})}
            </div>
            ${commentHTML}
            ${suggestionHTML}
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
      `,
    ];
  }
}
