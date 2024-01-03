import { AppAgentClient, EntryHashB64, AgentPubKeyB64, AppAgentCallZomeRequest, RoleName, encodeHashToBase64, decodeHashFromBase64 } from '@holochain/client';
import { UnitInput, RustNode, RustTree, Initialization, DocumentOutput, DocumentInput, UpdateDocumentInput, AdvanceStateInput, UnitOutput, MarkDocumentInput, HowSignal, Unit, UpdateUnitInput} from './types';
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

  async createUnit(unit: UnitInput): Promise<UnitOutput> {
    return this.callZome('create_unit', unit);
  }

  async updateUnit(unitEh: AgentPubKeyB64, unit: Unit, state: string): Promise<UnitOutput> {
    const input : UpdateUnitInput = {
      hash: decodeHashFromBase64(unitEh),
      state,
      unit
    }
    console.log("UPDATE UNIT", input, unitEh)
    return this.callZome('update_unit', input);
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
