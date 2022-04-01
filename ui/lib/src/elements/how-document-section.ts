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
            <div @pointerup=${this.onEndSelection}>${sectionValue(this.section, this.index)}</div>
            <template id="template${this.index}"><span class="addCommentControl" id="addCommentControl"></span></template>
        </div>`
    }

    private onEndSelection() {
        const template = document.querySelector('#template'+this.index)
        const control = document.importNode((<any> template).content, true)?.childNodes[0];
        const selection = document.getSelection()
        const text = selection?.toString();
        if (text) {
            let rect = selection?.getRangeAt(0).getBoundingClientRect();
            control.style.top = `calc(${rect?.top}px - 48px)`;
            control.style.left = `calc(${rect?.left}px + calc(${rect?.width}px / 2) - 40px)`;
            control['text']= text; 
            document.body.appendChild(control);
        }

        console.log("onEndSelection: " + text);
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
        .addCommentControl {
            background-image: url("data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width='40px' height='40px'><foreignObject width='40px' height='40px'><div xmlns='http://www.w3.org/1999/xhtml' style='width:40px;height:40px;line-height:40px;text-align:center;color:transparent;text-shadow: 0 0 yellow, 2px 4px black, -1px -1px black;font-size:35px;'>💬</div></foreignObject></svg>");
            cursor: pointer;
            position: absolute;
            width: 40px;
            height: 40px;
        }
        .addCommentControl::before{
            background-color: black;
            color: white;
            content: " add comment ";
            display: block;
            font-weight: bold;
            margin-left: 37px;
            margin-top: 6px;
            padding: 2px;
            width: max-content;
            height: 20px;
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