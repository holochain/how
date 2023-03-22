import { ActionHash, AppAgentClient, CellType } from '@holochain/client';
import { html, render, TemplateResult } from 'lit';
import { HowStore, HowController } from '@holochain/how';
import { FileStorageClient } from '@holochain-open-dev/file-storage';
import '@holochain-open-dev/profiles/elements/profiles-context.js';
import '@holochain-open-dev/file-storage/elements/file-storage-context.js';

import {
  CrossGroupViews,
  GroupInfo,
  GroupServices,
  GroupViews,
  GroupWithApplets,
  OpenViews,
  WeApplet,
} from './we-applet';
import './how-applet-main';

function wrapGroupView(
  client: AppAgentClient,
  groupInfo: GroupInfo,
  groupServices: GroupServices,
  innerTemplate: TemplateResult
): TemplateResult {
  const howStore = new HowStore(client, "how")
  const fileStorageClient = new FileStorageClient(client, 'how');
  return html` <file-storage-context .client=${fileStorageClient}>
    <profiles-context .store=${groupServices.profilesStore}>
      FIXME!
      <how-controller .store=${howStore}>
      </how-controller>
      <how-context .store=${howStore}>
        ${innerTemplate}</how-context
      ></profiles-context
    ></file-storage-context
  >`;
}

function groupViews(
  client: AppAgentClient,
  groupInfo: GroupInfo,
  groupServices: GroupServices,
  openViews: OpenViews
): GroupViews {
  return {
    blocks: {
      main: element =>
        render(
          wrapGroupView(
            client,
            groupInfo,
            groupServices,
            html`
              <how-applet-main
                @event-selected=${async (e: CustomEvent) => {
                  const appInfo = await client.appInfo();
                  const dnaHash = (appInfo.cell_info['how'][0] as any)[
                    CellType.Provisioned
                  ].cell_id[0];
                  openViews.openHrl([dnaHash, e.detail.eventHash], {});
                }}
              ></how-applet-main>
            `
          ),
          element
        ),
    },
    entries: {
      how: {
        how_integrity: {
          event: {
            name: async (hash: ActionHash) => '',
            view: (hash: ActionHash, context) => element =>
              render(
                wrapGroupView(
                  client,
                  groupInfo,
                  groupServices,
                  html` <event-detail .eventHash=${hash}></event-detail> `
                ),
                element
              ),
          },
        },
      },
    },
  };
}

function crossGroupViews(
  groupWithApplets: GroupWithApplets[]
): CrossGroupViews {
  return {
    blocks: {
      main: element => {},
    },
  };
}

const applet: WeApplet = {
  attachableTypes: [],
  search: async () => [],
  groupViews,
  crossGroupViews,
};

export default applet;
