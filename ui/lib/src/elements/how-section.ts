import {css, html, LitElement} from "lit";
import {property, query, state} from "lit/decorators.js";

import {sharedStyles} from "../sharedStyles";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import { Section, SectionType } from "../types";
import {sectionValue} from "./utils";
import { TextArea, TextField } from "@scoped-elements/material-web";
import { HtmlTagHydration } from "svelte/internal";


const MAX_LINES= 100
const MIN_LINES= 10
/**
 * @element info-item
 */
export class HowSection extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  @property() section: Section | undefined;
  @property() index = 0
  @property() editable = false;
  @property() click = ()=>{};

  @state() editing = false;

  private sectionTypeMarker(section: Section) {
    switch (section.sectionType) {
      case SectionType.Content: return ""; break;
      case SectionType.Process: return html`<span class="template-marker">Process Template</span>`
      case SectionType.Requirement: return html`<span class="template-marker">Required Section</span>`
    }
  }

  private sectionWidget(section: Section, index: number) {
    const id = `section-${index}`
    switch (section.contentType) {
      case "text/plain":
        return html`
          <mwc-textfield dialogInitialFocus type="text"
          @input=${() => (this.shadowRoot!.getElementById(id) as TextField).reportValidity()}
          id="${id}" maxlength="255" autoValidate=true value="${section.content}" required></mwc-textfield>`
      case "text/plain:long":
      default: 
        const lines = section.content.split("\n").length
        let rows = lines<MIN_LINES ? MIN_LINES : lines
        rows = lines>MAX_LINES ? MAX_LINES : lines
        return html`<mwc-textarea @input=${() => (this.shadowRoot!.getElementById(id) as TextArea).reportValidity()}
          id="${id}" cols="100" .rows=${rows} value="${section.content}" autoValidate=true required>
          </mwc-textarea>`
    } 
  }
  
  render() {
    if (this.section) {
        const controls = []
        if (this.editing) {
            controls.push(html`<svg-button
                button="save"
                info="save"
                infoPosition="right"
                @click=${() => {
                    this.editing=false
                    const x = this.shadowRoot!.getElementById(`section-${this.index}`) as TextField
                    this.section!.content = x.value
                    this.dispatchEvent(new CustomEvent('section-changed', { detail: this.section, bubbles: true, composed: true }));
                }}
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
        const sectionNameBar = html`
        <div class="section-name-bar row">
            <div class="section-name" title="source: ${this.section.source == "" ? "_root" : this.section.source}">
                ${this.section.name}
                ${this.sectionTypeMarker(this.section)}
            </div>
            <div class="section-controls row">
                ${controls}
            </div>
        </div>
        `;
        if (this.editing) {
            return html` 
            <div class="section column">
                ${sectionNameBar}
                ${this.sectionWidget(this.section, this.index)}
            </div>`
        } else {
            return html` 
            <div class="section column">
                ${sectionNameBar}
                <div>${sectionValue(this.section)}</div>
            </div>`
        }
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
      `,
    ];
  }
}
