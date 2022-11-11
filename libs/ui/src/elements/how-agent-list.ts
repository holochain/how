import {css, html, LitElement, TemplateResult} from "lit";
import {property, query, state} from "lit/decorators.js";

import { contextProvided } from "@lit-labs/context";

import {sharedStyles} from "../sharedStyles";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import { AgentPubKeyB64 } from "@holochain-open-dev/core-types";
import { HowStore } from "../how.store";
import { howContext } from "../types";

/**
 * @element how-agent-list
 */
export class HowAgentList extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }
  @property() agents : Array<AgentPubKeyB64> = []
  @property() layout = "column"
  @contextProvided({ context: howContext })
  _store!: HowStore;
  
  
  render() {
    const agentsHTML: Array<TemplateResult>= []
    for (const agentHash of this.agents) {
      const profile = this._store.getProfileSync(agentHash)
      if (profile) {
        agentsHTML.push(html`<div class="agent" title="${agentHash}"><agent-avatar agent-pub-key=${agentHash}> </agent-avatar> ${profile.nickname}</div>`)
      } else {
        agentsHTML.push(html`<span class="agent" title="${agentHash}">${agentHash}</span>`)
      }
    } 
    return html`
      <div class="agent-list ${this.layout}">
        ${agentsHTML}
      </div>
      `
  }
  static get scopedElements() {
    return {
    };
  }
static get styles() {
    return [
      sharedStyles,
      css`
         .agent {
          margin-right:10px;
         }
         .agent-list {

         }
      `,
    ];
  }
}
