// import {
//   FileStorageClient,
//   fileStorageClientContext,
// } from '@holochain-open-dev/file-storage';
import {
  ProfilesClient,
  ProfilesConfig,
  ProfilesStore,
  profilesStoreContext,
} from '@holochain-open-dev/profiles';
import '@holochain-open-dev/profiles/dist/elements/agent-avatar.js';
import '@holochain-open-dev/profiles/dist/elements/profile-prompt.js';
import '@holochain-open-dev/profiles/dist/elements/profile-list-item-skeleton.js';
import {
  ActionHash,
  AdminWebsocket,
  AppAgentClient,
  AppAgentWebsocket,
} from '@holochain/client';
import { provide } from '@lit/context';
import { LitElement, css, html } from 'lit';
import { AsyncStatus, StoreSubscriber } from '@holochain-open-dev/stores';
import { customElement, property, state } from 'lit/decorators.js';

import {HowController} from "./elements/how-controller"
import {HowStore} from "./how.store"
import {howContext} from "./types"
import { localized, msg } from '@lit/localize';

import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { WeClient, isWeContext } from '@lightningrodlabs/we-applet';

const appId = 'how'

@localized()
@customElement('holochain-app')
export class HolochainApp extends ScopedElementsMixin(LitElement) {
  @state()
  loaded = false;

  // @provide({ context: fileStorageClientContext })
  // @property()
  // _fileStorageClient!: FileStorageClient;

  @provide({ context: howContext })
  @property()
  _howStore!: HowStore;

  @provide({ context: profilesStoreContext })
  @property()
  _profilesStore!: ProfilesStore;

  async firstUpdated() {

    const config:ProfilesConfig = {
      minNicknameLength: 3,
      avatarMode: "avatar-optional",
      additionalFields: [], // "Location","Hashtags", "Bio"// Custom app level profile fields
    };

    if (!isWeContext()) {
      const adminPort : string = import.meta.env.VITE_ADMIN_PORT
      const appPort : string = import.meta.env.VITE_APP_PORT
      const url = appPort ? `ws://localhost:${appPort}` : 'ws://localhost';

      if (adminPort) {
        const adminWebsocket = await AdminWebsocket.connect(new URL(`ws://localhost:${adminPort}`))
        const x = await adminWebsocket.listApps({})
        const cellIds = await adminWebsocket.listCellIds()
        await adminWebsocket.authorizeSigningCredentials(cellIds[0])
      }
      const appAgentClient = await AppAgentWebsocket.connect(new URL(url), appId)
    
      this._howStore = new HowStore(appAgentClient, "how")
      
      this._profilesStore = new ProfilesStore(
        new ProfilesClient(appAgentClient, 'how'), config
      );
    } else {
        const weClient = await WeClient.connect();

        if (
          !(weClient.renderInfo.type === "applet-view")
          && !(weClient.renderInfo.view.type === "main")
        ) throw new Error("This Applet only implements the applet main view.");
  
        //@ts-ignore
        const client = weClient.renderInfo.appletClient;
        this._howStore = new HowStore(client, "how")


        //@ts-ignore
        const profilesClient = weClient.renderInfo.profilesClient;
        this._profilesStore = new ProfilesStore(profilesClient, config)
      }

    this.loaded = true;
  }


  render() {
    if (!this.loaded) return html`<span>Loading...</span>`;
    return html`
      <profile-prompt>
         <how-controller></how-controller>
      </profile-prompt>
                  <!-- <how-controller id="controller" dummy="{true}""></how-controller> -->

    `;
  }

  static get scopedElements() {
    return {
      "how-controller": HowController,
    };
  }
}
