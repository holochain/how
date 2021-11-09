import { CellClient } from '@holochain-open-dev/cell-client';
import { HoloHashed, serializeHash, EntryHashB64, AgentPubKeyB64 } from '@holochain-open-dev/core-types';
import {AlignmentEntry, Alignment, Signal} from './types';

export class HowService {
  constructor(
    public cellClient: CellClient,
    protected zomeName = 'hc_zome_how'
  ) {}

  get myAgentPubKey() : AgentPubKeyB64 {
    return serializeHash(this.cellClient.cellId[1]);
  }

  async createAlignment(alignment: AlignmentEntry): Promise<EntryHashB64> {
    return this.callZome('create_alignment', alignment);
  }

  async getAlignments(): Promise<Array<HoloHashed<AlignmentEntry>>> {
    return this.callZome('get_alignments', null);
  }

  async notify(signal: Signal, folks: Array<AgentPubKeyB64>): Promise<void> {
    return this.callZome('notify', {signal, folks});
  }

  async alignmentFromEntry(hash: EntryHashB64, entry: AlignmentEntry): Promise<Alignment> {
    return {
      name : entry.name,
      meta : entry.meta,
    }
  }

  private callZome(fn_name: string, payload: any) {
    return this.cellClient.callZome(this.zomeName, fn_name, payload);
  }
}
