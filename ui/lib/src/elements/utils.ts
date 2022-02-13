import {html} from "lit";
import {unsafeHTML} from "lit/directives/unsafe-html.js";
import {Section } from "../types"
import {Marked} from "@ts-stack/markdown";

export function sectionValue(section: Section, index: number) {
    switch (section.content_type) {
      case "text/markdown":
        return html`<div class="section-content markdown">${unsafeHTML(Marked.parse(section.content))}</div>`
      default: 
        return html`<div class="section-content"><p>${section.content}</p></div>`
    }
  }