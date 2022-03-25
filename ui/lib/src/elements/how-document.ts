import {css, html, LitElement} from "lit";
import {property, query} from "lit/decorators.js";

import {contextProvided} from "@holochain-open-dev/context";
import {StoreSubscriber} from "lit-svelte-stores";

import {sharedStyles} from "../sharedStyles";
import {EntryHashB64, AgentPubKeyB64} from "@holochain-open-dev/core-types";
import {Comment, howContext, Section, SectionType} from "../types";
import {HowStore} from "../how.store";
import {HowDocumentDialog } from "./how-document-dialog";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {
  Button,
  Dialog,
  TextField,
  TextArea,
} from "@scoped-elements/material-web";
import {sectionValue} from "./utils";

// @ts-ignore
import {WcMermaid} from "wc-mermaid"
import { AgentAvatar } from "@holochain-open-dev/profiles";

/**
 * @element how-document
 */
 export class HowDocument extends ScopedElementsMixin(LitElement) {
    constructor() {
      super();
    }
  
    @property() currentDocumentEh = "";
    @property() path = "";

    @contextProvided({ context: howContext })
    _store!: HowStore;
    _documents = new StoreSubscriber(this, () => this._store.documents);
    _comments: Comment[] = [
      { section: 'summary', authorHash: 'fry', profileImg: './assets/fry.jpg', commentText: "Who said that? SURE you can die! You want to die?! Why would I want to know that? Ok, we'll go deliver this crate like professionals, and then we'll go ride the bumper cars. Ooh, name it after me! Moving along…", documentHash: '', start_index: 0, end_index: 0, isResolved: false, timestamp: new Date() },
      { section: 'context', authorHash: 'bender', profileImg: './assets/bender.jpg', commentText: "We can't compete with Mom! Her company is big and evil! Ours is small and neutral!", documentHash: '', start_index: 0, end_index: 0, isResolved: false, timestamp: new Date() },
      { section: 'specification', authorHash: 'leela', profileImg: './assets/leela.jpg', commentText: "It's just like the story of the grasshopper and the octopus. All year long, the grasshopper kept burying acorns for winter, while the octopus mooched off his girlfriend and watched TV. But then the winter came, and the grasshopper died, and the octopus ate all his acorns. Also he got a race car. Is any of this getting through to you?", documentHash: '', start_index: 0, end_index: 0, isResolved: false, timestamp: new Date() }
    ]

    @query('#document-dialog')
    _documentDialogElem!: HowDocumentDialog;

    openDoc(documentEh: EntryHashB64, editable: boolean ) {
        this._documentDialogElem.open(this.path, documentEh, editable);
    }

    private async stateChange(state: string) {
        const newDocumentHash = await this._store.changeDocumentState(this.currentDocumentEh, state)
        this.dispatchEvent(new CustomEvent('document-updated', { detail: newDocumentHash, bubbles: true, composed: true }));
    }

    private sectionTypeMarker(section: Section) {
      switch (section.section_type) {
        case SectionType.Content: return ""; break;
        case SectionType.Process: return html`<span class="template-marker">Process Template</span>`
        case SectionType.Requirement: return html`<span class="template-marker">Required Section</span>`
      }
    }

    private commentBubble(comment: Comment) {
      const result = html `
        <div class="comment-bubble-container">
          <div class="comment-header">
            <div class="comment-avitar">
              <img class="img-avitar" src="${comment.profileImg}">
            </div>
            <div class="comment-authortimestamp">
              <div class="author-name">${comment.authorHash}</div>
              <div class="comment-timestamp">${comment.timestamp.toLocaleDateString()} ${comment.timestamp.toLocaleTimeString()}</div>
            </div>
            <div class="comment-button-container">
              <div class="comment-resolve-button-container">
              </div>
              <div class="comment-dropdown-menu-container">
              </div>
            </div>
          </div>
          <div class="comment-text-container">${comment.commentText}</div>
        </div>
      `

      console.log("commentBubble", result);
      return result;
    }

    render() {
        if (!this.currentDocumentEh) {
          return;
        }
        const doc = this._documents.value[this.currentDocumentEh]
        const graph  = `graph LR;
        define --> refine --> align --> _alive;
        define --> _defunct;
        refine --> _defunct;
        align --> _defunct;        
        _alive --> _defunct;

        style ${doc.state}  fill:#f9f,stroke:#333,stroke-width:4px`
        return html`
          <div class="document-header row">
            <div class="column" style="padding:5px">
            <wc-mermaid>
                  ${graph}
            </wc-mermaid>
            </div>
            <div class="document-controls row">
              ${
                doc.isAlive()
                  ? ""
                  : html`<mwc-button
                      icon="edit"
                      @click=${() => this.openDoc(this.currentDocumentEh, true)}
                      >Edit</mwc-button
                    >`
              }
              <div class="column" style="align-items:center">
                <div>Move to:</div>

                <div class="row">
                  ${doc
                    .nextStates()
                    .map(
                      (state) =>
                        html`<mwc-button
                          @click=${async () => this.stateChange(state)}
                          >${state}</mwc-button
                        >`
                    )}
                </div>
              </div>
            </mwc-button>
            </div>
          </div>
          <div class="document-container">
            <div class="section-container">
            ${doc.content.map(
              (section, index) =>
                html` <div class="section">
                  <div class="section-name" title="source: ${section.source == "" ? "_root" : section.source}">
                    ${section.name}
                    ${this.sectionTypeMarker(section)}
                  </div>
                  <div>${sectionValue(section, index)}</div>
                </div>`
            )}
            </div>
            <div class="comment-container">
            ${this._comments.map((comment) => {
              return this.commentBubble(comment)
              // return html `<h1>Comment bubble</h1>`
            })}
            </div>
          </div>
          <hr />
          Editors:
          ${Object.entries(doc.editors).map(
            ([key, pubkey]) => html`<agent-avatar agent-pub-key="${pubkey}"></agent-avatar>`
          )}

          <how-document-dialog id="document-dialog"> </how-document-dialog>
        `;
      
    }

    static get scopedElements() {
        return {
          "mwc-button": Button,
          "how-document-dialog": HowDocumentDialog,
          "wc-mermaid": WcMermaid,
          "agent-avatar": AgentAvatar
        };
      }
    static get styles() {
        return [
          sharedStyles,
          css`
            .section {
              padding: 10px;
            }
            .section-content p {
                margin: 0;
            }
            .template-marker {
                font-weight: normal;
                border: solid .1em #666;
                border-radius: .1em;
                font-size: 76%;
                padding: 0 3px 0 3px;
            }
            .section-name {
              font-weight: bold;
              margin-bottom: 2px;
            }
            .document-header {
              border-bottom: solid .1em #666;
              padding: 5px;
              margin: 0
            }
            .document-container {
              display: flex;
            }
            .section-container {
              width: 80%;
            }
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
            .comment-header {
              display: flex;
              height: 2.5rem;
              margin-bottom: 0.5rem;
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
          `,
        ];
  }
}
