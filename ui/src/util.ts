import { AppAgentClient, CellType, decodeHashFromBase64, DnaHash, encodeHashToBase64, type EntryHash } from "@holochain/client";
import type { HrlB64WithContext, HrlWithContext } from "@lightningrodlabs/we-applet";

export function hrlWithContextToB64(hrl: HrlWithContext): HrlB64WithContext {
  return {
    hrl: [encodeHashToBase64(hrl.hrl[0]), encodeHashToBase64(hrl.hrl[1])],
    context: hrl.context,
  };
}
  
export function hrlB64WithContextToRaw(hrlB64: HrlB64WithContext): HrlWithContext {
  return {
    hrl: [decodeHashFromBase64(hrlB64.hrl[0]), decodeHashFromBase64(hrlB64.hrl[1])],
    context: hrlB64.context,
  };
}

export const hashEqual = (a:EntryHash, b:EntryHash) : boolean => {
  if (!a || !b) {
    return !a && !b
  }
  for (let i = a.length; -1 < i; i -= 1) {
    if ((a[i] !== b[i])) return false;
  }
  return true;
}

export const getMyDna = async (role:string, client: AppAgentClient) : Promise<DnaHash>  => {
  const appInfo = await client.appInfo();
  const dnaHash = (appInfo.cell_info[role][0] as any)[
    CellType.Provisioned
  ].cell_id[0];
  return dnaHash
} 
