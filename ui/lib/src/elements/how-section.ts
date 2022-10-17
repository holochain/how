import {css, html, LitElement} from "lit";
import {property, query} from "lit/decorators.js";

import {sharedStyles} from "../sharedStyles";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import { Section, SectionType } from "../types";
import {sectionValue} from "./utils";

/**
 * @element info-item
 */
export class HowSection extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  @property() section: Section | undefined;
  @property() item: string = "";
  @property() name: string = "";
  @property() title: string = "";
  @property() click = ()=>{};

  private sectionTypeMarker(section: Section) {
    switch (section.sectionType) {
      case SectionType.Content: return ""; break;
      case SectionType.Process: return html`<span class="template-marker">Process Template</span>`
      case SectionType.Requirement: return html`<span class="template-marker">Required Section</span>`
    }
  }

  render() {
    if (this.section) {
        return html` 
        <div class="section">
            <div class="section-name" title="source: ${this.section.source == "" ? "_root" : this.section.source}">
            ${this.section.name}
            ${this.sectionTypeMarker(this.section)}
            </div>
            <div>${sectionValue(this.section)}</div>
        </div>`
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
        .section-name {
            text-transform: capitalize;
            font-weight: bold;
            font-size: 25px;
            margin-bottom: 2px;
        }
      `,
    ];
  }
}
