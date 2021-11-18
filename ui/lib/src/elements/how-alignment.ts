import {css, html, LitElement} from "lit";
import {property, query} from "lit/decorators.js";

import {contextProvided} from "@lit-labs/context";
import {StoreSubscriber} from "lit-svelte-stores";

import {sharedStyles} from "../sharedStyles";
import {Alignment, howContext} from "../types";
import {HowStore} from "../how.store";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {ProfilesStore, profilesStoreContext,} from "@holochain-open-dev/profiles";
//import {Button, Dialog, TextField, Fab, Slider} from "@scoped-elements/material-web";

/**
 * @element how-alignment
 */
export class HowAlignment extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  @property() currentAlignmentEh = "";

  @contextProvided({ context: howContext })
  _store!: HowStore;

  @contextProvided({ context: profilesStoreContext })
  _profiles!: ProfilesStore;

  _myProfile = new StoreSubscriber(this, () => this._profiles.myProfile);
  _knownProfiles = new StoreSubscriber(this, () => this._profiles.knownProfiles);
  _alignments = new StoreSubscriber(this, () => this._store.alignments);

  get myNickName(): string {
    return this._myProfile.value.nickname;
  }

  handleNodelink(path: string) {
    console.log("clicked on", path)
    this.dispatchEvent(new CustomEvent('select-node', { detail: path, bubbles: true, composed: true }));
  }

  render() {
    if (!this.currentAlignmentEh) {
      return;
    }
    /** Get current alignment and zoom level */
    const alignment: Alignment = this._alignments.value[this.currentAlignmentEh];
    /** Render layout */
    return html`
      <div class="alignment">
       <h4> ${alignment.short_name} </h4>
       <li> Parents: ${alignment.parents.map((path) => html`<span class="node-link" @click=${()=>this.handleNodelink(path)}>${path}</span>`)}</li>
       <li> Path Abbrev: ${alignment.path_abbreviation}</li>
       <li> Title: ${alignment.title}</li>
       <li> Summary: ${alignment.summary}</li>
       <li> Stewards: ${alignment.stewards.map((agent: string)=>html`<span class="agent" title="${agent}">${this._knownProfiles.value[agent].nickname}</span>`)}</li>
       <li> Processes: ${alignment.processes.map((path) => html`<span class="node-link" @click=${()=>this.handleNodelink(path)}>${path}</span>`)}</li>
      </div>
    `;
  }


  static get scopedElements() {
    return {
    };
  }
  static get styles() {
    return [
      sharedStyles,
      css`
      .alignment {
        border: solid .1em #666;
        border-radius: .2em;
        margin-left: 20px;
        padding: 10px;
      }
      .alignment h4 {
        margin-top: 0px;
        margin-bottom: 5px;
      }
      .alignment li {
        list-style: none;
      }
      .node-link {
        cursor: pointer;
        background-color: white;
        border: solid .1em #666;
        border-radius: .2em;
      }
      `,
    ];
  }
}
