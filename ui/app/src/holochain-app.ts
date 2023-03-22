import {
  FileStorageClient,
  fileStorageClientContext,
} from '@holochain-open-dev/file-storage';
import {
  ProfilesClient,
  ProfilesConfig,
  ProfilesStore,
  profilesStoreContext,
} from '@holochain-open-dev/profiles';
import '@holochain-open-dev/profiles/elements/agent-avatar.js';
import '@holochain-open-dev/profiles/elements/profile-prompt.js';
import '@holochain-open-dev/profiles/elements/profile-list-item-skeleton.js';
import {
  ActionHash,
  AdminWebsocket,
  AppAgentClient,
  AppAgentWebsocket,
} from '@holochain/client';
import { provide } from '@lit-labs/context';
import { LitElement, css, html } from 'lit';
import { AsyncStatus, StoreSubscriber } from '@holochain-open-dev/stores';
import { customElement, property, state } from 'lit/decorators.js';

import {
  HowController,
  HowUnit,
  HowStore,
  howContext,
} from '@holochain/how';
import { localized, msg } from '@lit/localize';

import { ScopedElementsMixin } from "@open-wc/scoped-elements";


@localized()
@customElement('holochain-app')
export class HolochainApp extends ScopedElementsMixin(LitElement) {
  @state()
  loaded = false;

  @provide({ context: fileStorageClientContext })
  @property()
  _fileStorageClient!: FileStorageClient;

  @provide({ context: howContext })
  @property()
  _howStore!: HowStore;

  @provide({ context: profilesStoreContext })
  @property()
  _profilesStore!: ProfilesStore;

  async firstUpdated() {

    // @ts-ignore
    const adminPort : string = import.meta.env.VITE_ADMIN_PORT
    // @ts-ignore
    const appPort : string = import.meta.env.VITE_APP_PORT

    const appAgentClient =await AppAgentWebsocket.connect(`ws://localhost:${appPort}`, 'how');
    if (adminPort) {
      const adminWebsocket = await AdminWebsocket.connect(`ws://localhost:${adminPort}`)
      const x = await adminWebsocket.listApps({})
      const cellIds = await adminWebsocket.listCellIds()
      await adminWebsocket.authorizeSigningCredentials(cellIds[0])
    }
    
  
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
                  <!-- <how-controller id="controller" dummy="{true}""></how-controller> -->

    `;
  }

  static get scopedElements() {
    return {
      "how-controller": HowController,
    };
  }
}
