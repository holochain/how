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
  _alignments = new StoreSubscriber(this, () => this._store.alignments);

  get myNickName(): string {
    return this._myProfile.value.nickname;
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
       <li> Parents: ${alignment.parents}</li>
       <li> Path Abbrev: ${alignment.path_abbreviation}</li>
       <li> Name: ${alignment.short_name}</li>
       <li> Title: ${alignment.title}</li>
       <li> Stewards: ${alignment.stewards}</li>
       <li> Processes: ${alignment.processes}</li>
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
        padding: 20px;
      }
      `,
    ];
  }
}
