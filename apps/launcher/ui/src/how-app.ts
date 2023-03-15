import { ContextProvider } from "@lit-labs/context";
import { property, state } from "lit/decorators.js";
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
  ProfilesClient,
  ProfilesConfig,
} from "@holochain-open-dev/profiles";
import { AppAgentWebsocket, AppWebsocket } from '@holochain/client';
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { LitElement, html } from "lit";
import { provide } from '@lit-labs/context';

export class HowApp extends ScopedElementsMixin(LitElement) {
  @state()
  loaded = false;

  @provide({ context: howContext })
  @property()
  _howStore!: HowStore;

  @provide({ context: profilesStoreContext })
  @property()
  _profilesStore!: ProfilesStore;

  async firstUpdated() {

    const appAgentClient = await AppAgentWebsocket.connect("", "how")
  


    this._howStore = new HowStore(appAgentClient, "how")

    const config:ProfilesConfig = {
      minNicknameLength: 3,
      avatarMode: "avatar-optional",
      additionalFields: [], // "Location","Hashtags", "Bio"// Custom app level profile fields
    };
    
    this._profilesStore = new ProfilesStore(
      new ProfilesClient(appAgentClient, 'how'), config
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
