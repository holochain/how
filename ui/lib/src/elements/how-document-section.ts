import { css, html, LitElement } from "lit";
import { ref, createRef } from 'lit/directives/ref.js';
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { property } from "lit/decorators.js";
import { Comment, Section, SectionType } from "../types";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { Marked } from "@ts-stack/markdown";
import { IconButton } from "@scoped-elements/material-web";
import { HowStore } from "../how.store";

/**
 * @element how-document-section
 */
export class HowDocumentSection extends ScopedElementsMixin(LitElement) {
    @property()
    store?: HowStore;
    section?: Section;
    index?: number;
    selectedText?: string;

    constructor() {
        super();
    }

    commentControlRef = <any>createRef<HTMLDivElement>();
    sectionRef = <any>createRef<HTMLDivElement>();

    render() {
        return html`
        <div class="section" id="section-${this.section?.name}" ${ref(this.sectionRef)}>
            <div class="section-name" title="source: ${this.section?.source == "" ? "_root" : this.section?.source}">
                ${this.section?.name}
                ${this.sectionTypeMarker()}
            </div>
            <div @pointerup=${this.onEndSelection}>${sectionValue(this.section, this.index)}</div>
            <div ${ref(this.commentControlRef)} class="add-comment-bubble">
                <mwc-icon-button class="add-comment-button" id="add-comment-button-${this.index}" icon="speaker_notes" @click=${() => this.onAddComment()}></mwc-icon-button>
            </div>
        </div>`
    }

    private async onAddComment() {
        this.commentControlRef.value.style.display = 'none';
        if (!this.section || !this.store) {
            return;
        }

        const comment = new Comment({
            section: this.section.name,
            authorHash: 'fry',
            profileImg: './assets/fry.jpg',
            commentText: '',
            documentHash: '',
            start_index: 0,
            end_index: 0,
            isResolved: false,
            timestamp: new Date()
        })

        await this.store.addDocumentComment('', comment);

        console.log("onAddComment");
    }

    private onEndSelection() {
        // const template = document.querySelector('#template'+this.index)
        // console.log("onEndSelection", this.templateRef.value)
        // const control = document.importNode((<any> this.commentControlRef.value).content, true)?.childNodes[0]
        const selection = document.getSelection()
        const text = selection?.toString()

        if (text) {
            this.selectedText = text;
            let rect2 = selection?.getRangeAt(0).getBoundingClientRect()
            let rect = this.sectionRef.value.getBoundingClientRect()
            console.log("selection rect: " + this.sectionRef.value.id, rect, rect2)
            const commentTop = (rect2 ? rect2.top : 0) - rect?.top
            this.commentControlRef.value.style.top = `calc(calc(${commentTop}px) - 40px)`
            this.commentControlRef.value.style.left = `calc(calc(${rect?.width}px) - 40px)`
            this.commentControlRef.value.style.display = 'block'
        }

        console.log("onEndSelection: " + text, this.commentControlRef.value)
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
            position: relative;
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
        .add-comment-bubble {
            border: 1px solid #eee;
            box-shadow: 0 3px 3px rgba(0,0,0,0.05);
            border-radius: 2.5rem;
            width: 2.75rem;
            text-align: center;
            z-index: 101;
            transition: opacity .25s ease-in-out;
            transform: translate(-50%,-50%);
            display: none;
            cursor: pointer;
            position: absolute;
            background-color: white;
            color: cadetblue;
            padding: 0.15rem;
        }
        .add-comment-button {
            margin-left: -0.1rem;
        }
    `

    static get scopedElements() {
        return {
            "mwc-icon-button": IconButton
        }
    }
}

export function sectionValue(section?: Section, index?: number) {
    switch (section?.content_type) {
        case "text/markdown":
            return html`<div class="section-content markdown" id="section-${index}">${unsafeHTML(Marked.parse(section.content))}</div>`
        default:
            return html`<div class="section-content" id="section-${index}"><p>${section?.content}</p></div>`
    }
}    