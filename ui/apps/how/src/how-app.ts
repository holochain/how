import { ContextProvider } from "@lit-labs/context";
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
  ProfilesService,
} from "@holochain-open-dev/profiles";
import { HolochainClient, CellClient } from "@holochain-open-dev/cell-client";
import { AppWebsocket } from "@holochain/client";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { LitElement, html } from "lit";

export class HowApp extends ScopedElementsMixin(LitElement) {
  @state()
  loaded = false;

  async firstUpdated() {
    const appWebsocket = await AppWebsocket.connect(
      `ws://localhost:${process.env.HC_PORT}`
    );

    const client = new HolochainClient(appWebsocket);
    const appInfo = await appWebsocket.appInfo({
      installed_app_id: "how",
    });

    const cell = appInfo.cell_data[0];
    const howClient = new CellClient(client, cell);

    const store = new ProfilesStore(new ProfilesService(howClient), {
      avatarMode: "avatar-required",
    })

    store.fetchAllProfiles()

    new ContextProvider(this, profilesStoreContext, store);

    new ContextProvider(
      this,
      howContext,
      new HowStore(howClient, store)
    );


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
