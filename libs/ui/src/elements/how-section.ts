import {css, html, LitElement, TemplateResult} from "lit";
import {until} from 'lit-html/directives/until.js';
import {property, query, state} from "lit/decorators.js";
import { contextProvided } from "@lit-labs/context";

import {sharedStyles} from "../sharedStyles";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import { Section, SectionType, howContext, RequirementInfo, parseRequirementInfo, HilightRange, Document, Comment, CommentStatus, applyApprovedComments, parseAgentArray } from "../types";
import { Select, Switch, TextArea, TextField } from "@scoped-elements/material-web";
import {unsafeHTML} from "lit/directives/unsafe-html.js";
import { Marked } from "@ts-stack/markdown";
import { HowSectionDetails } from "./how-section-details";
import { HowStore } from "../how.store";
import { serializeHash } from "@holochain-open-dev/utils";
import { AgentPubKeyB64, Dictionary } from "@holochain-open-dev/core-types";
import { HowEditAgentList } from "./how-edit-agent-list";
import { HowAgentList } from "./how-agent-list";
import { ApprovalControl, CommentControl, Control, VotingControl } from "../controls";


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
  @property() highlitRange: HilightRange | undefined = undefined;
  @property() comments:Array<Comment> = []
  @property() document: Document | undefined

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

  private agentsWidget(id: string, agents: Array<AgentPubKeyB64>) : TemplateResult {
    return html`
      <how-edit-agent-list id=${id} .agents=${agents}></how-edit-agent-list>
    `
  }

  private sectionEditWidget() : TemplateResult|Array<TemplateResult> {
    if (this.section) {
      const section = this.section
      const index = this.index
      const id = `section-${index}`
      if (section.sectionType != SectionType.Content) {
          const reqInfo = parseRequirementInfo(section)
          return this.inputWidget(id, reqInfo.description)
      }
      if (this.section.contentType.startsWith("control/")) {
        const control = Control.newFromSection(section)
        if (control) {
          return control.sectionEditWidget(index, this.document!)
        }
      }
      switch (section.contentType) {
        case "json/agents":
          const agents = parseAgentArray(section)
          return html`Agents: ${this.agentsWidget(id, agents)}`
        case "text/plain":
          return this.inputWidget(id, section.content)
        case "text/plain:long":
        default: 
        return this.textareaWidget(id, section.content)
      }
    }
    return html`Section Missing`
  }

  handleSelect(e:any) {
    this.dispatchEvent(new CustomEvent('selection', { detail: this.section, bubbles: true, composed: true }));
  }

  private highlitContent(range: HilightRange| undefined,content: string) : TemplateResult {
    if (range) {
      const p1 = content.substring(0,range.startOffset)
      let p2: string | TemplateResult = content.substring(range.startOffset, range.endOffset)
      const p3 = content.substring(range.endOffset)
      if (range.startOffset == range.endOffset) {
        p2 = html`<span id="cursor" class="cursor"><div></div></span>`
      }
      // has to be on one line because this may be a PRE!
      return html`<span id="1">${p1}</span><span id="hilight" class='hilight ${range.replacement != undefined ? 'deleted' : ''}'>${p2}</span>${range.replacement? html`<span class="hilight">${range.replacement}</span>`: ''}<span id="2">${p3}</span>`
    } else {
      return html`${content}`
    }
  }

  private async sectionViewWidget() : Promise<TemplateResult|Array<TemplateResult>>{
    if (this.section) {
      const section = this.section

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
      if (this.section.contentType.startsWith("control/")) {
        const control = Control.newFromSection(section)
        if (control) {
          return control.sectionViewWidget(this.document!)
        }
      }
      switch (section.contentType) {
        case "json/agents":
          const agents = parseAgentArray(section)
          return html`<how-agent-list .agents=${agents}></how-agent-list>`
        case "text/markdown":
          if (this.preview) {
            const content = applyApprovedComments(section.content, this.comments)
            return html`<div class="section-content markdown">${unsafeHTML(Marked.parse(content))}</div>`
          } else {
            return html`<div class="section-content"
            @click=${(e:any)=>this.handleSelect(e)}
            ><pre class="source">${this.highlitContent(this.highlitRange, section.content)}</pre></div>`
          }
        default:  
        if (this.preview) {
          const content = applyApprovedComments(section.content, this.comments)
          return html`<div class="section-content"        
          ><p>${content}</p></div>`
        }
        return html`<div class="section-content"        
          @click=${(e:any)=>this.handleSelect(e)}
        ><p>${this.highlitContent(this.highlitRange,section.content)}</p></div>`
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
    if (this.section) {
      this.editing=false
      let valElement
      if (this.section.sectionType != SectionType.Content) {
        const reqInfo = parseRequirementInfo(this.section)
        valElement = this.shadowRoot!.getElementById(`section-${this.index}`) as TextField
        reqInfo.description = valElement.value
        this.section.content = JSON.stringify(reqInfo)
      } else {
        if (this.section.contentType.startsWith("control/")) {
          const control = Control.newFromSection(this.section)
          if (control) {
            const state = control.getEditWidgetValue(this.shadowRoot!, this.index)
            this.section.content = JSON.stringify(state)
          }
        } else {
          switch(this.section.contentType) {
            case "json/agents":
              valElement = this.shadowRoot!.getElementById(`section-${this.index}`) as HowEditAgentList
              this.section.content = JSON.stringify(valElement.agents)
              break;
            case "text/plain":
              valElement = this.shadowRoot!.getElementById(`section-${this.index}`) as TextField
              this.section.content = valElement.value
              break;
            case "text/plain:long":
            case "text/markdown":
              valElement = this.shadowRoot!.getElementById(`section-${this.index}`) as TextArea
              this.section.content = valElement.value
              break;
            default:
              console.log("unknown content type:", this.section.contentType)
          }
        }
      }
      this.dispatchEvent(new CustomEvent('section-changed', { detail: this.section, bubbles: true, composed: true }));
    }
  }
  private previewable() {
    return this.section && 
      ((this.section.contentType == "text/markdown") || 
       (this.comments && this.comments.length>0 && this.comments.find(c=>c.status==CommentStatus.Approved  && (c.suggestion() != undefined))))
  }
  render() {
    if (this.section) {
        const controls = [html`
            <svg-button
            .click=${async () => this.openDetails()} 
            .button=${"question"}>
          </svg-button> `,
        ]
        if (this.editing) {
            controls.push(html`<svg-button
                button="save"
                info="save"
                infoPosition="right"
                .click=${() => this.save()}
                ></svg-button>`)
            controls.push(html`<svg-button
                button="close"
                info="cancel"
                infoPosition="right"
                .click=${() => this.editing=false}
                ></svg-button>`)
        } else if (this.editable) {
            controls.push(html`<svg-button
                button="edit"
                info="edit"
                infoPosition="right"
                .click=${() => this.editing=true}
                ></svg-button>`)
        }
        if (this.previewable()) {
            controls.push(this.preview ?
                html`<svg-button
                button="checked"
                info="preview"
                infoPosition="right"
                .click=${() => this.preview=false}
                ></svg-button>`
                :
                html`<svg-button
                button="unchecked"
                info="preview"
                infoPosition="right"
                .click=${() => this.preview=true}
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
        </div>
        <how-section-details id="details-dialog"> </how-section-details>
        `
    }
  }
  static get scopedElements() {
    return {
      "how-section-details": HowSectionDetails,
      "mwc-switch": Switch,
      'how-edit-agent-list': HowEditAgentList,
      'how-agent-list': HowAgentList,

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
        .cursor {
          width: 0px;
          display: inline-block;
          box-shadow: 0px 0px 0px 1px #4f93df;
          height: 13px;
          margin-bottom: -1px;
        }
      `,
    ];
  }
}
