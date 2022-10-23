import {css, html, LitElement, TemplateResult} from "lit";
import {until} from 'lit-html/directives/until.js';
import {property, query, state} from "lit/decorators.js";
import { contextProvided } from "@lit-labs/context";

import {sharedStyles} from "../sharedStyles";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import { Section, SectionType, howContext, RequirementInfo, parseRequirementInfo } from "../types";
import { TextArea, TextField } from "@scoped-elements/material-web";
import {unsafeHTML} from "lit/directives/unsafe-html.js";
import { Marked } from "@ts-stack/markdown";
import { HowSectionDetails } from "./how-section-details";
import { HowStore } from "../how.store";
import { serializeHash } from "@holochain-open-dev/utils";


const MAX_LINES= 100
const MIN_LINES= 10
/**
 * @element info-item
 */
export class HowSection extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  @contextProvided({ context: howContext })
  _store!: HowStore;

  @property() section: Section | undefined;
  @property() index = 0
  @property() editable = false;
  @property() click = ()=>{};

  @state() editing = false;
  @state() preview = false;
  @state() commenting = false;

  @query('how-section-details')
  private _detailsDialog!: HowSectionDetails;

  private sectionTypeMarker(section: Section) {
    switch (section.sectionType) {
      case SectionType.Content: return ""; break;
      case SectionType.Process: return html`<span class="template-marker">Process Template</span>`
      case SectionType.Requirement: return html`<span class="template-marker">Required Section</span>`
    }
  }

  private textareaWidget(id: string, value: string) : TemplateResult {
    const lines = value.split("\n").length
    let rows = lines<MIN_LINES ? MIN_LINES : lines
    rows = rows>MAX_LINES ? MAX_LINES : rows
    return html`<mwc-textarea @input=${() => (this.shadowRoot!.getElementById(id) as TextArea).reportValidity()}
      id="${id}" cols="100" .rows=${rows} value="${value}" autoValidate=true required>
      </mwc-textarea>`
  }

  private inputWidget(id: string, value: string) : TemplateResult {
    return html`
          <mwc-textfield dialogInitialFocus type="text"
          @input=${() => (this.shadowRoot!.getElementById(id) as TextField).reportValidity()}
          id="${id}" maxlength="255" autoValidate=true value="${value}" required></mwc-textfield>`
  }

  private sectionEditWidget() : TemplateResult {
    if (this.section) {
      const section = this.section
      const index = this.index
      const id = `section-${index}`
      console.log("EDIT", section)
      if (section.sectionType != SectionType.Content) {
          const reqInfo = parseRequirementInfo(section)
          return this.inputWidget(id, reqInfo.description)
      }
      switch (section.contentType) {
        case "text/plain":
          return this.inputWidget(id, section.content)
        case "text/plain:long":
        default: 
        return this.textareaWidget(id, section.content)
      }
    }
    return html`Section Missing`
  }

  private async sectionViewWidget() : Promise<TemplateResult>{
    if (this.section) {
      const section = this.section
      const sourceOnly = !this.preview

      if (section.sectionType != SectionType.Content) {
          const reqInfo = parseRequirementInfo(section)
          return html`<div class="section-content"><p>${reqInfo.description}</p></div>`
      }
      if (section.content == "") {
          const description = await this.getSectionDescription()
          return html`<div class="section-content empty">
            <p>This section has not been edited.</p>
            <p>Section Description: ${description}</p>
          </div>`
      }
      if (section.contentType == "text/markdown") {
          if (sourceOnly) {
            return html`<div class="section-content"><pre class="source">${section.content}</pre></div>`
          } else {
            return html`<div class="section-content markdown">${unsafeHTML(Marked.parse(section.content))}</div>`
          }
      } else {
          return html`<div class="section-content"><p>${section.content}</p></div>`
      }
    }
    return html`Section Missing`
  }

  private async getSectionDescription() {
    let description = ""
    if (this.section  && this.section.sourceUnit) {
        const srcDocInfo = await this._store.getCurrentDocumentPull(this.section.sourcePath, serializeHash(this.section.sourceUnit))
        if (srcDocInfo) {
            const srcSection = srcDocInfo.content.getSection(this.section.name)
            if (srcSection) {
                const reqInfo = parseRequirementInfo(srcSection)
                description = reqInfo.description
            }
        }
    }
    return description
  }

  private async openDetails() {
    if (this.section) {
        const description = await this.getSectionDescription()
        this._detailsDialog!.open(
            this.section.name, 
            this.section.sourcePath == "" ? "_root" : this.section.sourcePath,
            this.section.contentType,
            description,
            )
    }
  }
  save() {
    console.log
    if (this.section) {
        this.editing=false
        const valElement = this.shadowRoot!.getElementById(`section-${this.index}`) as TextField
        if (this.section.sectionType != SectionType.Content) {
            const reqInfo = parseRequirementInfo(this.section)
            reqInfo.description = valElement.value
            this.section.content = JSON.stringify(reqInfo)
        } else {
            this.section.content = valElement.value
        }
        this.dispatchEvent(new CustomEvent('section-changed', { detail: this.section, bubbles: true, composed: true }));
    }
  }
  comment() {
    const valElement = this.shadowRoot!.getElementById(`comment`) as TextField
    this.dispatchEvent(new CustomEvent('add-comment', { detail: {comment:valElement.value, section:this.section}, bubbles: true, composed: true }));
    this.commenting = false
  }

  render() {
    if (this.section) {
        const controls = [html`
            <svg-button
            .click=${async () => this.openDetails()} 
            .button=${"question"}>
          </svg-button> `,
          html`
          <svg-button
            .click=${async () => this.commenting=true} 
            .button=${"new_comment"}>
          </svg-button> `

        ]
        if (this.editing) {
            controls.push(html`<svg-button
                button="save"
                info="save"
                infoPosition="right"
                @click=${() => this.save()}
                ></svg-button>`)
            controls.push(html`<svg-button
                button="close"
                info="cancel"
                infoPosition="right"
                @click=${() => this.editing=false}
                ></svg-button>`)
        } else if (this.editable) {
            controls.push(html`<svg-button
                button="edit"
                info="edit"
                infoPosition="right"
                @click=${() => this.editing=true}
                ></svg-button>`)
        }
        if (this.section.contentType == "text/markdown") {
            controls.push(this.preview ?
                html`<svg-button
                button="checked"
                info="preview"
                infoPosition="right"
                @click=${() => this.preview=false}
                ></svg-button>`
                :
                html`<svg-button
                button="unchecked"
                info="preview"
                infoPosition="right"
                @click=${() => this.preview=true}
                ></svg-button>`
            )
        }
        const sectionNameBar = html`
        <div class="section-name-bar row">
            <div class="section-name">
                ${this.section.name}
                ${this.sectionTypeMarker(this.section)}
            </div>
            <div class="section-controls row">
                ${controls}
            </div>
        </div>
        `;
        return html` 
        <div class="section column">
            ${sectionNameBar}
            ${this.editing ? 
                this.sectionEditWidget():
                until(
                  this.sectionViewWidget().then(res => res),
                  html`Loading...`,
                )
            }
            ${this.commenting ?
              html`
              <div class="comment-box">
                Add Comment:
                ${this.textareaWidget('comment',"")}
                <svg-button
                button="send"
                info="send"
                @click=${() => this.comment()}
                ></svg-button>
              </div>
              `
              :
              ''
            }
        </div>
        <how-section-details id="details-dialog"> </how-section-details>
        `
    }
  }
  static get scopedElements() {
    return {
      "how-section-details": HowSectionDetails,
    }
  }
  static get styles() {
    return [
      sharedStyles,
      css`
        .section {
            padding: 10px;
        }
        .empty {
          margin-left: 30px;
          font-style: italic;
          background-color: #eee;
          padding: 5px;
        }
        .section-content p {
            margin: 0;
            color: #555;
        }
        .section-name-bar {
            justify-content: flex-start
        }
        .section-name {
            text-transform: capitalize;
            font-weight: bold;
            font-size: 25px;
            margin-bottom: 2px;
        }
        .template-marker {
                font-weight: normal;
                border: solid .1em #666;
                border-radius: .1em;
                font-size: 76%;
                padding: 0 3px 0 3px;
            }
        .source {
            overflow-x: auto;
            white-space: pre-wrap;
            white-space: -pre-wrap;
            word-wrap: break-word;
          }
        .comment-box {
          background-color: lightblue
        }
      `,
    ];
  }
}
