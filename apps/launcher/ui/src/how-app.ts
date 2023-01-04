import { ContextProvider } from "@lit-labs/context";
import { state } from "lit/decorators.js";
import {
  HowController,
  HowUnit,
  HowStore,
  howContext,
} from "@how/elements";
import {
  ProfilePrompt,
  ProfilesStore,
  profilesStoreContext,
  ProfilesService,
} from "@holochain-open-dev/profiles";
import { AppAgentWebsocket, AppWebsocket } from '@holochain/client';
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { LitElement, html } from "lit";

export class HowApp extends ScopedElementsMixin(LitElement) {
  @state()
  loaded = false;

  async firstUpdated() {
    const appWebsocket = await AppWebsocket.connect(
      `ws://localhost:${process.env.HC_PORT}`
    );

    const client = await AppAgentWebsocket.connect(appWebsocket, "how")


    const store = new ProfilesStore(new ProfilesService(client, 'how'), {
      avatarMode: "avatar-required",
    })

    store.fetchAllProfiles()

    new ContextProvider(this, profilesStoreContext, store);

    new ContextProvider(
      this,
      howContext,
      new HowStore(client, store, "how")
    );


    this.loaded = true;
  }


  render() {
    if (!this.loaded) return html`<span>Loading...</span>`;
    return html`
      <profile-prompt>
         <how-controller></how-controller>
      </profile-prompt>
                  <!-- <how-controller id="controller" dummy=${true}></how-controller> -->

    `;
  }

  static get scopedElements() {
    return {
      "profile-prompt": ProfilePrompt,
      "how-controller": HowController,
    };
  }
}
