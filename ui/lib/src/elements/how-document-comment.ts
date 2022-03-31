import {css, html, LitElement} from "lit";
import {property} from "lit/decorators.js";
import {Comment} from "../types";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {IconButton} from "@scoped-elements/material-web";

/**
 * @element how-document-comment
 */
export class HowDocumentComment extends ScopedElementsMixin(LitElement) {
    @property()
    comment?: Comment;

    constructor() {
      super();
    }

    private openCommentContextMenu() {
        console.log("openCommentContextMenu");
    }
  
    private commentDone() {
        console.log("commentDone");
    }

    render() {
        return html `
        <div class="comment-bubble-container">
          <div class="comment-header">
            <div class="comment-avitar">
              <img class="img-avitar" src="${this.comment?.profileImg}">
            </div>
            <div class="comment-authortimestamp">
              <div class="author-name">${this.comment?.authorHash}</div>
              <div class="comment-timestamp">${this.comment?.timestamp.toLocaleDateString()} ${this.comment?.timestamp.toLocaleTimeString()}</div>
            </div>
            <div class="comment-button-container">
              <div class="comment-resolve-button-container">
                <mwc-icon-button id="menu-button" icon="done" @click=${() => this.commentDone()}></mwc-icon-button>
              </div>
              <div class="comment-dropdown-menu-container">
                <mwc-icon-button id="menu-button" icon="more_vert" @click=${() => this.openCommentContextMenu()}></mwc-icon-button>
              </div>
            </div>
          </div>
          <div class="comment-text-container">${this.comment?.commentText}</div>
        </div>
      `
    }

    static get scopedElements() {
        return {
          "mwc-icon-button": IconButton
        }
    }

    static styles =
    css`
    .comment-container {
        width: 20%;
        background-color: lightgrey;
      }
      .debug-comment-container {
        width: 85%;
        height: 20rem;
        background-color: orange;
      }
      .comment-bubble-container {
        border-radius: 0.5rem;
        border-width: 1px;
        border-style: solid;
        overflow-y: auto;
        overflow-x: hidden;
        cusor: pointer;
        display: flex;
        flex-direction: column;
        width: 75%;
        padding: 1rem;
        background-color: white;
        margin: 0.5rem 0 0.5rem 0.75rem;
      }
      .comment-button-container {
        display: flex;
      }
      .comment-dropdown-menu-container {
        width: 1.5rem;
      }
      .comment-resolve-button-container {
        width: 1.5rem;
        color: green;
      }
      .comment-header {
        display: flex;
        height: 2.5rem;
        margin-bottom: 0.5rem;
        align-items: flex-start;
      }
      .comment-avitar {
        height: 2.375rem;
        width: 2.25rem;
        max-width: 2.25rem;
        margin-top: 2px;
      }
      .img-avitar {
        border-radius: 50%;
        margin-left: 2px;
        margin-top: 2px;
        width: 2rem;
        height: 2rem;
      }
      .comment-authortimestamp {
        display: flex;
        flex-direction: column;
        flex-grow: 2;
        justify-content: center;
        padding-left: 0.625rem;
        overflow: hidden;
        whitespace: nowrap;
        text-overflow: ellipsis
      }
      .author-name {
        color: #3c4043;
        font-weight: 500;
        font-size: 0.875rem;
        letter-spacing: 0.25px;
        line-height: 1.25rem;
        margin-top: 0px;
        align-self: stretch;
        height: 1.125rem;
        overflow: hidden;
        text-overflow: ellipsis
      }
      .comment-timestamp {
        color: #3c4043;
        font-weight: 400;
        align-self: stretch;
        line-height: 1rem;
        letter-spacing: 0.3px;
        font-size: 0.75rem;
      }
      .comment-text-container {
        display: block;
        font-size: 0.875rem;
        white-space: normal;
        cursor: default;
        margin: 6px 0;
        text-align: left;
        word-wrap: break-word;
        line-height: 20px;
        letter-spacing: 0.2px;
        width: 100%;
      }
    `    
}