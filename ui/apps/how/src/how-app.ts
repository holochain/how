import { ContextProvider } from "@holochain-open-dev/context";
import { state } from "lit/decorators.js";
import {
  HowController,
  HowAlignment,
  HowStore,
  howContext,
} from "@how/elements";
import {
  ProfilePrompt,
  ProfilesStore,
  profilesStoreContext,
} from "@holochain-open-dev/profiles";
import { HolochainClient } from "@holochain-open-dev/cell-client";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { LitElement, html } from "lit";

export class HowApp extends ScopedElementsMixin(LitElement) {
  @state()
  loaded = false;

  async firstUpdated() {
    const client = await HolochainClient.connect(`ws://localhost:${process.env.HC_PORT}`, "how");
    console.log("FISH1", client)

    const providerClient = client.forCell(
      client.cellDataByRoleId('how')!
    );
      console.log("FISH", providerClient)
    const store = new ProfilesStore(providerClient, {avatarMode: "avatar"})

    store.fetchAllProfiles()

    new ContextProvider(
      this,
      profilesStoreContext,
      store
    );

    new ContextProvider(this, howContext, new HowStore(providerClient, store));

    this.loaded = true;
  }


  render() {
    if (!this.loaded) return html`<span>Loading...</span>`;
    return html`
      <profile-prompt style="margin-left:-7px; margin-top:0px;display:block;">
         <how-controller></how-controller>
      </profile-prompt>
    `;
  }

  static get scopedElements() {
    return {
      "profile-prompt": ProfilePrompt,
      "how-controller": HowController,
      "how-alignment": HowAlignment,
    };
  }
}
