import { AppAgentClient, EntryHashB64, AgentPubKeyB64, AppAgentCallZomeRequest, RoleName, encodeHashToBase64 } from '@holochain/client';
import { Unit, RustNode, RustTree, Initialization, DocumentOutput, DocumentInput, UpdateDocumentInput, AdvanceStateInput, UnitOutput, MarkDocumentInput, HowSignal} from './types';
import { ActionHash  } from '@holochain/client';

export class HowService {
  constructor(
    public client: AppAgentClient,
    protected roleName: RoleName,
    protected zomeName = 'how'
  ) {}

  get myAgentPubKey() : AgentPubKeyB64 {
    return encodeHashToBase64(this.client.myPubKey);
  }

  async initialize(input: Initialization): Promise<EntryHashB64> {
    return this.callZome('initialize', input);
  }

  async createUnit(unit: Unit): Promise<UnitOutput> {
    return this.callZome('create_unit', unit);
  }

  async getUnits(): Promise<Array<UnitOutput>> {
    return await this.callZome('get_units', null)
  }

  async createDocument(input: DocumentInput): Promise<EntryHashB64> {
    return this.callZome('create_document', input);
  }

  async updateDocument(input: UpdateDocumentInput): Promise<EntryHashB64> {
    return this.callZome('update_document', input);
  }

  async deleteDocument(input: ActionHash): Promise<ActionHash> {
    return this.callZome('delete_document', input);
  }

  async markDocument(input: Array<MarkDocumentInput>): Promise<ActionHash> {
    return this.callZome('mark_document', input);
  }

  async advanceState(input: AdvanceStateInput): Promise<EntryHashB64> {
    return this.callZome('advance_state', input);
  }

  async getDocuments(path: string): Promise<Array<DocumentOutput>> {
    return this.callZome('get_documents', path);
  }

  async getTree(): Promise<Array<RustNode>> {
    let tree:RustTree = await this.callZome('get_tree', null);
    return tree.tree
  }

  async reparent(path: string, newParent: string): Promise<void> {
    this.callZome('reparent', {path,newParent});
  }

  async notify(signal: HowSignal, folks: Array<AgentPubKeyB64>): Promise<void> {
    return this.callZome('notify', {signal, folks});
  }

  private callZome(fnName: string, payload: any) {
    const req: AppAgentCallZomeRequest = {
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: fnName,
      payload
    }
    return this.client.callZome(req);
  }
}
