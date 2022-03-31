import {css, html, LitElement} from "lit";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {property} from "lit/decorators.js";
import {Section, SectionType} from "../types";
import {unsafeHTML} from "lit/directives/unsafe-html.js";
import {Marked} from "@ts-stack/markdown";

/**
 * @element how-document-section
 */
 export class HowDocumentSection extends ScopedElementsMixin(LitElement) {
    @property()
    section?: Section;
    index?: number;

    constructor() {
      super();
    }

    render() {
        return html`
        <div class="section">
            <div class="section-name" title="source: ${this.section?.source == "" ? "_root" : this.section?.source}">
                ${this.section?.name}
                ${this.sectionTypeMarker()}
            </div>
            <div>${sectionValue(this.section, this.index)}</div>
        </div>`
    }

    private sectionTypeMarker() {
        switch (this.section?.section_type) {
          case SectionType.Content: return ""; break;
          case SectionType.Process: return html`<span class="template-marker">Process Template</span>`
          case SectionType.Requirement: return html`<span class="template-marker">Required Section</span>`
        }
    }

    static styles =
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
    `    
}

export function sectionValue(section?: Section, index?: number) {
    switch (section?.content_type) {
        case "text/markdown":
        return html`<div class="section-content markdown" id="section-${index}">${unsafeHTML(Marked.parse(section.content))}</div>`
        default: 
        return html`<div class="section-content" id="section-${index}"><p>${section?.content}</p></div>`
    }
}    