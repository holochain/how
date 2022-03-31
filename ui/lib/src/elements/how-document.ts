import {css, html, LitElement} from "lit";
import {property, query} from "lit/decorators.js";

import {contextProvided} from "@holochain-open-dev/context";
import {StoreSubscriber} from "lit-svelte-stores";

import {sharedStyles} from "../sharedStyles";
import {EntryHashB64, AgentPubKeyB64} from "@holochain-open-dev/core-types";
import {Comment, howContext, Section} from "../types";
import {HowStore} from "../how.store";
import {HowDocumentDialog} from "./how-document-dialog";
import {HowDocumentComment} from "./how-document-comment";
import {HowDocumentSection} from "./how-document-section";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {Button,IconButton} from "@scoped-elements/material-web";

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
              ${doc.content.map((section: Section, index: number) => {
                return html `<how-document-section .section=${section} .index=${index}></how-document-section>`
              })}
            </div>
            <div class="comment-container">
              ${this._comments.map((comment: Comment) => {
                return html `<how-document-comment .comment=${comment}></how-document-comment>`
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
          "mwc-icon-button": IconButton,
          "how-document-dialog": HowDocumentDialog,
          "how-document-comment": HowDocumentComment,
          "how-document-section": HowDocumentSection,
          "wc-mermaid": WcMermaid,
          "agent-avatar": AgentAvatar
        };
      }
    static get styles() {
        return [
          sharedStyles,
          css`
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
              padding: 1.5rem;
            }
            .comment-container {
              width: 20%;
              background-color: #dadce0;
            }
          `,
        ];
  }
}
