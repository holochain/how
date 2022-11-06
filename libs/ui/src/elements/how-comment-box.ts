import {css, html, LitElement} from "lit";
import {property, query, state} from "lit/decorators.js";

import {sharedStyles} from "../sharedStyles";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import { CommentInfo, DocumentOutput, HilightRange, Section } from "../types";
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
  @property() resolve=  false
  @state() valid = false
  @state() insertText = false

  private getCommentInfo() : CommentInfo | undefined {
    const commentBox = this.shadowRoot!.getElementById("comment") as TextArea

    if (!commentBox) {
      return undefined
    }
    const suggestionBox = this.shadowRoot!.getElementById("suggestion") as TextArea
    const info: CommentInfo = {
      commentText: commentBox.value,
      suggestion: undefined
    }
    if (this.selectedCommentText && suggestionBox.value != this.selectedCommentText) {
      info.suggestion = suggestionBox.value
    }
    this.valid = !(info.suggestion == undefined && info.commentText == "")
    return info
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
  suggest() {
    this.insertText = !this.insertText
  }
  render() {
    let suggestionHTML
    if (this.selectedCommentText || this.insertText) {
      let suggestionHeaderText
      if (this.selectedCommentText) {
        const commentBox = this.shadowRoot!.getElementById("comment") as TextArea
        if (commentBox) {
          if (commentBox.value) {
            suggestionHeaderText = commentBox.value ? "Replace With:" : "Delete"
          }
        }
      } else {
        suggestionHeaderText = "Insert:"
      }
      suggestionHTML = html`
        <div class="row comment-header">
          ${this.resolve ? "Modify " :""}Suggestion --  ${suggestionHeaderText}
        </div>
        <mwc-textarea @input=${() => this.input()}
          cols="50" id="suggestion" .value=${this.selectedCommentText ? this.selectedCommentText : ""} cols="100" .rows=${5} autoValidate=true required>
        </mwc-textarea>
      `
    }
    return html`
      <div class="comment-box column"
        @keyup=${(e:any)=>{if (e.code=="Escape"){this.cancel()}}}
      >
        <div class="row comment-header">
          <span>General Comment:</span>${!this.selectedCommentText ? html`
          <svg-button
            button="plus"
            info="suggestion"
            infoPosition="right"
            .click=${() => this.suggest()} 
          ></svg-button>` : ''}
        </div>
        <mwc-textarea @input=${() => this.input()}
          cols="50" id="comment" cols="100" .rows=${5} autoValidate=true required>
        </mwc-textarea>
        ${suggestionHTML}

        <div class="row comment-controls">
          <svg-button
            button="save"
            info="save"
            infoPosition="right"
            .enabled=${this.valid}
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
