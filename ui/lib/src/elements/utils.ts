import {html} from "lit";
import {unsafeHTML} from "lit/directives/unsafe-html.js";
import {Section } from "../types"
import {Marked} from "@ts-stack/markdown";

export function sectionValue(section: Section, sourceOnly: boolean) {
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