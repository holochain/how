import { CellClient } from '@holochain-open-dev/cell-client';
import { serializeHash, EntryHashB64, AgentPubKeyB64 } from '@holochain-open-dev/core-types';
import { Alignment, AlignmentOutput, Signal, RustNode, RustTree, Initialization, DocumentOutput} from './types';

export class HowService {
  constructor(
    public cellClient: CellClient,
    protected zomeName = 'how'
  ) {}

  get myAgentPubKey() : AgentPubKeyB64 {
    return serializeHash(this.cellClient.cellId[1]);
  }

  async initialize(input: Initialization): Promise<EntryHashB64> {
    return this.callZome('initialize', input);
  }

  async createAlignment(alignment: Alignment): Promise<EntryHashB64> {
    return this.callZome('create_alignment', alignment);
  }

  async getAlignments(): Promise<Array<AlignmentOutput>> {
    return this.callZome('get_alignments', null);
  }

  async getDocuments(path: string): Promise<Array<DocumentOutput>> {
    return this.callZome('get_documents', path);
  }

  async getTree(): Promise<Array<RustNode>> {
    let tree:RustTree = await this.callZome('get_tree', null);
    return tree.tree
  }
  async notify(signal: Signal, folks: Array<AgentPubKeyB64>): Promise<void> {
    return this.callZome('notify', {signal, folks});
  }

  private callZome(fn_name: string, payload: any) {
    return this.cellClient.callZome(this.zomeName, fn_name, payload);
  }
}
