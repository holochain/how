import { type AppAgentClient, type RoleName, type ZomeName, decodeHashFromBase64, encodeHashToBase64 } from '@holochain/client';
import type { AppletHash, AppletServices, AssetInfo, WAL, WeServices } from '@lightningrodlabs/we-applet';
import { HowStore } from './how.store';
import { getMyDna } from './util';

const ROLE_NAME = "how"
const ZOME_NAME = "how"

export const appletServices: AppletServices = {
    // Types of attachment that this Applet offers for other Applets to attach'
    creatables: {

    },
    bindAsset: async (appletClient: AppAgentClient,
        srcWal: WAL, dstWal: WAL): Promise<void> => {
        console.log("Bind requested.  Src:", srcWal, "  Dst:", dstWal)
      },
    // Types of UI widgets/blocks that this Applet supports
    blockTypes: {
    },
    getAssetInfo: async (
      appletClient: AppAgentClient,
      roleName: RoleName,
      integrityZomeName: ZomeName,
      entryType: string,
      wal: WAL
    ): Promise<AssetInfo | undefined> => {

        const store = new HowStore(undefined, appletClient, "how")
        switch (entryType) {
            case "document": {
                const docHash = wal.hrl[1]
                const doc = await store.pullDocument(docHash)
                const title = doc.content.content[0].content
                return {
                    icon_src: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="12" viewBox="0 0 384 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M64 0C28.7 0 0 28.7 0 64V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V160H256c-17.7 0-32-14.3-32-32V0H64zM256 0V128H384L256 0zM112 256H272c8.8 0 16 7.2 16 16s-7.2 16-16 16H112c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64H272c8.8 0 16 7.2 16 16s-7.2 16-16 16H112c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64H272c8.8 0 16 7.2 16 16s-7.2 16-16 16H112c-8.8 0-16-7.2-16-16s7.2-16 16-16z"/></svg>`,
                    name: title
                };
            }
            case "unitx":
                const units = await store.pullUnits()
                const unitHash = encodeHashToBase64(wal.hrl[1])
        
                return {
                    icon_src: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"/></svg>`,
                    name: units[unitHash].shortName,
                };
        }
    },
    search: async (
      appletClient: AppAgentClient,
      appletHash: AppletHash,
      weServices: WeServices,
      searchFilter: string
    ): Promise<Array<WAL>> => {
        const store = new HowStore(undefined, appletClient, "how")
        const dnaHash = await getMyDna(ROLE_NAME, appletClient)
        if (!dnaHash) return []
        const units = await store.pullUnits()
        const lower = searchFilter.toLowerCase()
        return Object.entries(units)
            .filter(([_h,unit]) => unit.shortName.toLowerCase().includes(lower))
            .map(([entryHashB4,unit]) =>{
            return { hrl: [dnaHash, decodeHashFromBase64(entryHashB4)], context: {} }
        })  
            
    },
};
  