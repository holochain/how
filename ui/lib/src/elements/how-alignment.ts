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
      THING: ${alignment.short_name}
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
      `,
    ];
  }
}
