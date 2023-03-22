import {css, html, LitElement, TemplateResult} from "lit";
import {property, query, state} from "lit/decorators.js";

import {sharedStyles} from "../sharedStyles";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import { AgentPubKeyB64 } from "@holochain/client";
import { HowStore } from "../how.store";
import { howContext } from "../types";
import { consume } from '@lit-labs/context';
import { Profile, ProfilesStore, profilesStoreContext } from "@holochain-open-dev/profiles";
import { StoreSubscriber } from "@holochain-open-dev/stores";
import { decodeHashFromBase64 } from "@holochain/client";

/**
 * @element how-agent-list
 */
@customElement('how-agent-list')
export class HowAgentList extends LitElement {
  constructor() {
    super();
  }
  @property() agents : Array<AgentPubKeyB64> = []
  @property() layout = "column"

  @consume({ context: howContext, subscribe: true })
  _store!: HowStore;

  @consume({ context: profilesStoreContext, subscribe: true })
  _profiles!: ProfilesStore;

  _allProfiles  = new StoreSubscriber(this, () =>
    this._profiles.allProfiles
  );

  render() {
    const agentsHTML: Array<TemplateResult>= []
    for (const agentHash of this.agents) {
      let profile: Profile |undefined = undefined
      if (this._allProfiles.value.status == "complete")
      profile = this._allProfiles.value.value.get(decodeHashFromBase64(agentHash))
  
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
