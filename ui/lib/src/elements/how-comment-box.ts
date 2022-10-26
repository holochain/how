import {css, html, LitElement} from "lit";
import {property, query, state} from "lit/decorators.js";

import {sharedStyles} from "../sharedStyles";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import { CommentInfo, DocumentOutput, HilightRange, Section } from "../types";
import { serializeHash } from "@holochain-open-dev/utils";
import { AgentAvatar } from "@holochain-open-dev/profiles";
import { TextArea } from "@scoped-elements/material-web";
import { SvgButton } from "./svg-button";
/**
 * @element info-item
 */
export class HowCommentBox extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }
  @property() selectedCommentText : string = ""

  private getCommentInfo() : CommentInfo | undefined {
    const commentBox = this.shadowRoot!.getElementById("comment") as TextArea
    if (commentBox) {
      const info: CommentInfo = {
        commentText: "",
        suggestion: undefined
      }
      const matches = commentBox.value.match(/([\s\S]*)```suggestion\s*([\s\S]*)\n```([\s\S]*)/)
      if (matches) {
        if (this.selectedCommentText != matches[2]) {
          info.suggestion = matches[2]
        }
        info.commentText = matches[1]+matches[3]
      }
      return info
    }
    return undefined
  }

  cancel() {
    this.dispatchEvent(new CustomEvent('cancel', { detail: undefined, bubbles: true, composed: true }));
  }
  save() {
    const info = this.getCommentInfo()
    if (info) {
      this.dispatchEvent(new CustomEvent('save', { detail: info , bubbles: true, composed: true }));
    }
  }
  input() {
    const info = this.getCommentInfo()
    const commentBox = this.shadowRoot!.getElementById("comment") as TextArea
    if (commentBox) {
      commentBox.reportValidity()
      this.dispatchEvent(new CustomEvent('suggestion-changed', { detail: info!.suggestion, bubbles: true, composed: true }));
    }
  }
  render() {
    return html`
      <div class="comment-box column"
        @keyup=${(e:any)=>{if (e.code=="Escape"){this.cancel()}}}
      >
        <div class="row comment-header">
          Add Comment:
        </div>
        <mwc-textarea @input=${() => this.input()}
          cols="50" id="comment" .value=${this.selectedCommentText ? `\`\`\`suggestion\n${this.selectedCommentText}\n\`\`\`` : ""} cols="100" .rows=${5} autoValidate=true required>
        </mwc-textarea>

        <div class="row comment-controls">
          <svg-button
            button="save"
            info="save"
            infoPosition="right"
            .click=${() => this.save()} 
          ></svg-button>
          <svg-button
              button="close"
              info="cancel"
              infoPosition="right"
              .click=${() => this.cancel()}
            ></svg-button>
        </div>
      </div>
      `
  }
  static get scopedElements() {
    return {
      "mwc-textarea": TextArea,
      "svg-button": SvgButton,
    };
  }
static get styles() {
    return [
      sharedStyles,
      css`
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
