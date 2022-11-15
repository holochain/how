import { AgentPubKeyB64, Dictionary } from "@holochain-open-dev/core-types"
import { Select, Switch, TextField } from "@scoped-elements/material-web"
import { html, TemplateResult } from "lit"
import { HowConfirm } from "./elements/how-confirm"
import { Section, Document, parseAgentArray, MarkTypes, VoteAction, ApprovalAction } from "./types"

const switchWidget = (id: string, on: boolean) : TemplateResult => {
    return on ? html`<mwc-switch id=${id} selected></mwc-switch>` : html`<mwc-switch id=${id} ></mwc-switch>`
}

export interface ControlState {
    enabled: boolean
}
export class Control {
    static newFromSection(section: Section) {
        switch (section.contentType) {
          case "control/approval":
            return new ApprovalControl(section)
          case "control/voting":
            return new VotingControl(section)
          case "control/comments":
            return new CommentControl(section)
        }
        return undefined
    }

    public state: ControlState
    constructor(section: Section) {
        if (section.content) {
            try {
                this.state = JSON.parse(section.content)
                return
            } catch(e) {
                console.log("Error while parsing control from content", e ,section.content)
            }
        }
        this.state = this.defaultState()
    }
    defaultState(): ControlState {
        return {enabled: false}
    }

    contentType(): String {return ""}
    sectionViewWidget(document: Document) : TemplateResult|Array<TemplateResult> {
        return html``
    }
    sectionEditWidget(sectionIndex: number, document: Document) : TemplateResult|Array<TemplateResult> {
        return html``
    }
    getEditWidgetValue(root: ShadowRoot, sectionIndex: number): any {
        const valElement = root.getElementById(`section-${sectionIndex}`) as Switch
        return {enabled: valElement.selected}
    }
    canSee(document: Document): boolean {
        return this.state.enabled
    }
    canDo(agent: AgentPubKeyB64, document: Document): boolean {
        return false
    }
    affordances(agent: AgentPubKeyB64, document: Document, confirmElem: HowConfirm) : TemplateResult|Array<TemplateResult> {
        return []
    }
}

export class CommentControl extends Control {
    contentType(): String {return "control/comments"}
    sectionViewWidget(document: Document) : TemplateResult|Array<TemplateResult> {
        return this.state.enabled ? 
        html`<div class="section-content">Commenting: Enabled</div>` :
        html`<div class="section-content">Commenting: Disabled</div>`
    }
    sectionEditWidget(sectionIndex: number,document: Document) : TemplateResult|Array<TemplateResult> {
        const id = `section-${sectionIndex}`
        return html`Commenting Enabled: ${switchWidget(id, this.state.enabled)}`
    }
    canDo(agent: AgentPubKeyB64, document: Document): boolean {
        return document.state === "refine" && this.canSee(document)
    }
    affordances(agent: AgentPubKeyB64, document: Document, confirmFn: any) : TemplateResult|Array<TemplateResult> {
        return []
    }
}
export class VotingControl extends Control {
    contentType(): String {return "control/voting"}
    sectionViewWidget(document: Document) : TemplateResult|Array<TemplateResult> {
        if (this.state.enabled) {
            let votes : Dictionary<number> = {}
            document.marks.forEach(m => {if (m.markType==MarkTypes.Vote) {
              if (votes[m.author] == undefined) {
                votes[m.author] = 0
              }
              if (m.mark == "approve") votes[m.author] += 1
              if (m.mark == "reject") votes[m.author] -= 1
            }})
            let votesFor: Array<AgentPubKeyB64> = []
            let votesAgainst: Array<AgentPubKeyB64> = []
            Object.entries(votes).forEach(([voter,vote]) => {if (vote>0) votesFor.push(voter); if (vote<0) votesAgainst.push(voter)})
            return html`<div class="section-content">
              <div>Voting: Enabled</div>
              <div class="row">For: ${votesFor.length} <div class="row">${votesFor.map(voter=>html`<agent-avatar agent-pub-key=${voter}> </agent-avatar>`)}</div></div>
              <div class="row">Against: ${votesAgainst.length} <div class="row">${votesAgainst.map(voter=>html`<agent-avatar agent-pub-key=${voter}> </agent-avatar>`)}</div></div>
            </div>`            
        } else {
        return html`<div class="section-content">Voting: Disabled</div>`
        }
    }
    sectionEditWidget(sectionIndex: number,document: Document) : TemplateResult|Array<TemplateResult> {
        const id = `section-${sectionIndex}`
        return html`Voting Enabled: ${switchWidget(id, this.state.enabled)}`
    }
    canDo(agent: AgentPubKeyB64, document: Document): boolean {
        return document.state === "align" && this.canSee(document)
    }
    affordances(agent: AgentPubKeyB64, document: Document, confirmElem: HowConfirm) : TemplateResult|Array<TemplateResult> {
        if (this.canDo(agent, document)) {
            let vote = 0
            document.marks.forEach(m => {if (m.markType==MarkTypes.Vote && m.author == agent) {
              if (m.mark == "approve") vote += 1
              if (m.mark == "reject") vote -= 1
            }})
    
            return html`
              <div> My Vote: ${vote >0 ? 'Approve' : vote<0 ? 'Reject' : 'Abstain'}</div>
              <div class="row">
              Cast Vote: <svg-button
                  button="like"
                  info="approve"
                  infoPosition="right"
                  .click=${() => confirmElem.open(`Please confirm voting to approve this document?`, new VoteAction(true))}
                  ></svg-button>
                  <svg-button
                  button="dislike"
                  info="reject"
                  infoPosition="right"
                  .click=${() => confirmElem.open(`Please confirm voting to reject this document?`, new VoteAction(false))}
                  ></svg-button>
              </div>
            `
        }
        return []
        
  }
}

export interface ApprovalControlState extends ControlState {
    threshold: number
    agentsSectionName: string
}

export class ApprovalControl extends Control {
    // @ts-ignore
    public state: ApprovalControlState
    constructor(section: Section) {
        super(section)
    }
    defaultState() : ApprovalControlState {
        return {enabled: false, threshold: 100, agentsSectionName:""}
    }
    contentType(): String {return "control/approval"}
    sectionViewWidget(document: Document) : TemplateResult|Array<TemplateResult> {
        let approversTotal = 0
        let approvers:Array<AgentPubKeyB64> = []
        if (this.state.enabled){
          const approversSection = document.getSection(this.state.agentsSectionName)
          if (approversSection) {
            const approval:Dictionary<number> =  {}
            approvers = parseAgentArray(approversSection)
            approversTotal = approvers.length
            approvers.forEach(agent=>approval[agent] = 0)
            document.marks.forEach(m => {if (m.markType==MarkTypes.Approval) {
              if (m.mark == "approve") approval[m.author] += 1
              if (m.mark == "retract") approval[m.author] -= 1
            }})
            Object.entries(approval).forEach(([agent, value])=>{
              if (value<=0) {
                const index = approvers.indexOf(agent);
                if (index > -1) { 
                  approvers.splice(index, 1); 
                }
              }
            })
          }
        }
        return html`
          <div>Approval Enabled: ${this.state.enabled ? "Enabled" : "Disabled"}</div>
          <div>Approval Threshold Required: ${this.state.threshold}%</div>
          ${this.state.enabled ? html`Approvals: ${approvers.length}/${approversTotal} (${approvers.length/approversTotal * 100}%)
            <how-agent-list .agents=${approvers}></how-agent-list>
          ` : ''}
          <div>Agent List Section: ${this.state.agentsSectionName}</div>
        `
    }
    sectionEditWidget(sectionIndex: number, document: Document) : TemplateResult|Array<TemplateResult> {
        const agentsSections = document.content.filter(section=>section.contentType==="json/agents")
        if (agentsSections.length == 0) {
            return html`There are no agent list sections to select as approvers!`
        } else {
            const id = `section-${sectionIndex}`
            return html`
            <div class="row"><span>Approval Enabled:</span> ${switchWidget(id, this.state.enabled)}</div>
            <mwc-textfield id=${`threshold-field-${sectionIndex}`} value=${this.state.threshold} minlength="1" maxlength="3" label="Threshold" autoValidate=true required></mwc-textfield>
            <mwc-select id=${`agent-section-name-field-${sectionIndex}`} value=${this.state.agentsSectionName} @closing=${(e: any) => e.stopPropagation()} label="Agent List Section">
            ${agentsSections.map(section => 
                html`<mwc-list-item value=${section.name}>${section.name}</mwc-list-item>`
            )
            }
            </mwc-select>
            `
        }
    }
    getEditWidgetValue(root: ShadowRoot, sectionIndex: number): any {
        const valElement = root.getElementById(`section-${sectionIndex}`) as Switch
        const thresholdField = root.getElementById(`threshold-field-${sectionIndex}`) as TextField
        const agentsSectionNameField = root.getElementById(`agent-section-name-field-${sectionIndex}`) as Select
        return {
          threshold: parseInt(thresholdField.value),
          agentsSectionName: agentsSectionNameField.value,
          enabled: valElement.selected,
        }
    }
    canDo(agent: AgentPubKeyB64, document: Document): boolean {
        const approversSection = document.getSection(this.state.agentsSectionName)

        if (approversSection) {
          const approvers = parseAgentArray(approversSection)
          if (approvers.includes(agent)) {
            return true
          }
        }
        return false
    }
    affordances(agent: AgentPubKeyB64, document: Document, confirmElem: HowConfirm) : TemplateResult|Array<TemplateResult> {
        if (this.canDo(agent, document)) {
            let approval = 0
            document.marks.forEach(m => {if (m.markType==MarkTypes.Approval && m.author == agent) {
            if (m.mark == "approve") approval += 1
            if (m.mark == "retract") approval -= 1
            }})
            return html`
            <div> My approval: ${approval >0 ? 'Given' : 'Not given'}</div>
            <div class="row">
                ${approval <= 0 ? html`<svg-button
                button="like"
                info="approve"
                infoPosition="right"
                .click=${() => confirmElem.open(`Please approving this document?`, new ApprovalAction(true))}
                ></svg-button>` :html `
                <svg-button
                button="dislike"
                info="retract"
                infoPosition="right"
                .click=${() => confirmElem.open(`Please retracting approval for this document?`, new ApprovalAction(false))}
                ></svg-button>`}
            </div>
            `
        }
        return []
  }
}


  