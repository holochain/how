import {css, html, LitElement, TemplateResult} from "lit";
import {property, query, state} from "lit/decorators.js";
import { contextProvided } from "@lit-labs/context";

import {sharedStyles} from "../sharedStyles";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import { Section, SectionType, howContext, RequirementInfo } from "../types";
import { TextArea, TextField } from "@scoped-elements/material-web";
import {unsafeHTML} from "lit/directives/unsafe-html.js";
import { Marked } from "@ts-stack/markdown";
import { HowSectionDetails } from "./how-section-details";
import { HowStore } from "../how.store";


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
    rows = lines>MAX_LINES ? MAX_LINES : lines
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

  private sectionEditWidget(section: Section, index: number) : TemplateResult {
    const id = `section-${index}`
    if (section.sectionType != SectionType.Content) {
        const reqInfo = this.parseRequirementInfo(section)
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

  private parseRequirementInfo(section: Section) : RequirementInfo {
    return JSON.parse(section.content)
  } 

  private sectionViewWidget(section: Section, sourceOnly: boolean) {
    if (section.sectionType != SectionType.Content) {
        const reqInfo = this.parseRequirementInfo(section)
        return html`<div class="section-content"><p>${reqInfo.description}</p></div>`
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
  private async openDetails() {
    if (this.section) {
        const srcDocInfo = await this._store.getCurrentDocumentPull(this.section.source)
        let description = "<unknown>"
        if (srcDocInfo) {
            const srcSection = srcDocInfo.content.getSection(this.section.name)
            if (srcSection) {
                const reqInfo = this.parseRequirementInfo(srcSection)
                description = reqInfo.description
            }
        }
        this._detailsDialog!.open(
            this.section.name, 
            this.section.source == "" ? "_root" : this.section.source,
            this.section.contentType,
            description,
            )
    }
  }
  save() {
    if (this.section) {
        this.editing=false
        const valElement = this.shadowRoot!.getElementById(`section-${this.index}`) as TextField
        if (this.section.sectionType != SectionType.Content) {
            const reqInfo = this.parseRequirementInfo(this.section)
            reqInfo.description = valElement.value
            this.section.content = JSON.stringify(reqInfo)
        } else {
            this.section.content = valElement.value
        }
        this.dispatchEvent(new CustomEvent('section-changed', { detail: this.section, bubbles: true, composed: true }));
    }
  }
  render() {
    if (this.section) {
        const controls = [html`
            <svg-button
            .click=${async () => this.openDetails()} 
            .button=${"question"}>
          </svg-button> `
        ]
        if (this.editing) {
            controls.push(html`<svg-button
                button="save"
                info="save"
                infoPosition="right"
                @click=${() => this.save}
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
                this.sectionEditWidget(this.section, this.index):
                this.sectionViewWidget(this.section, !this.preview)
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
      `,
    ];
  }
}
