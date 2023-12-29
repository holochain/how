import {
  Initialization,
  DocType,
  ProcessType,
  ProcessName,
  SysState,
  Document,
  SectionType,
  SourceManual,
  Unit,
  UnitFlags
} from "./types";
import { AgentPubKeyB64 } from "@holochain/client";

const PROCESS_ROOT = "social.ops.process"

const std_procs: Array<[ProcessType, ProcessName]> = [
  [`${PROCESS_ROOT}.define`, "declaration"],
  [`${PROCESS_ROOT}.refine`, "comment_period"],
  [`${PROCESS_ROOT}.align`, "vote"],
];


export function initialTreeHolochain(progenitor: AgentPubKeyB64) {
  const init: Initialization = {
    units: [
      [SysState.Alive, new Unit({
        parents: [], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "", // max 10 char
        shortName: "Holochain Standards", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
      })],
      [SysState.Alive, new Unit({
        parents: [], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "social", // max 10 char
        shortName: "Social Protocols", // max 25 char        stewards: [progenitor], // people who can change this document
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      [SysState.Alive, new Unit({
        parents: [], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "tech", // max 10 char
        shortName: "Technical", // max 25 char        stewards: [progenitor], // people who can change this document
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      [SysState.Alive, new Unit({
        parents: ["tech"], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "hApps", // max 10 char
        shortName: "hApp Standards", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      ["define", new Unit({
        parents: ["tech.hApps"], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "ERC721_interop", // max 10 char
        shortName: "ERC721 Interoperability Standard", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      [SysState.Alive, new Unit({
        parents: ["social"], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "ops", // max 10 char
        shortName: "Operations", // max 25 charAgent
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      [SysState.UnderConstruction, new Unit({
        parents: ["social"], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "biz", // max 10 char
        shortName: "Business, Legal, Finance, Regulatory", // max 25 charAgent
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        meta: {},
        })],
      [SysState.UnderConstruction, new Unit({
        parents: ["social.biz"], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "exec", // max 10 char
        shortName: "Executive Function/ Council", // max 25 charAgent
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        meta: {},
        })],
      [SysState.UnderConstruction, new Unit({
        parents: ["social"], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "dev_support", // max 10 char
        shortName: "Developer Engagement & Support", // max 25 charAgent
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        meta: {},
        })],
      [SysState.Alive, new Unit({
        parents: ["social.ops"], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "process", // max 10 char
        shortName: "How Processes", // max 25 charAgent
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      [SysState.Alive, new Unit({
        parents: [PROCESS_ROOT], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "define", // max 10 char
        shortName: "Proposal procesess", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      [SysState.Alive, new Unit({
        parents: [`${PROCESS_ROOT}.define`], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "declaration", // max 10 char
        shortName: "Declaration", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      [SysState.Alive, new Unit({
        parents: [`${PROCESS_ROOT}.define`], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "petition", // max 10 char
        shortName: "Petition", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      [SysState.Alive, new Unit({
        parents: [PROCESS_ROOT], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "refine", // max 10 char
        shortName: "Refinement Processes", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      [SysState.Alive, new Unit({
        parents: [`${PROCESS_ROOT}.refine`], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "comment_period", // max 10 char
        shortName: "Comment Period", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      [SysState.Alive, new Unit({
        parents: [PROCESS_ROOT], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "align", // max 10 char
        shortName: "Unit Processes", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      [SysState.Alive, new Unit({
        parents: [`${PROCESS_ROOT}.align`], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "vote", // max 10 char
        shortName: "Voting", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      [SysState.Alive, new Unit({
        parents: [`${PROCESS_ROOT}.align`], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "consensus", // max 10 char
        shortName: "Consensus", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      [SysState.Alive, new Unit({
        parents: [`${PROCESS_ROOT}.align`], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "sortition", // max 10 char
        shortName: "Sortition", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      [SysState.Alive, new Unit({
        parents: ["tech"], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "hc_framework", // max 10 char
        shortName: "Holochain Framework", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      [SysState.Alive, new Unit({
        parents: ["tech.hc_framework"], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "runtime", // max 10 char
        shortName: "Runtime Environments", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      [SysState.UnderConstruction, new Unit({
        parents: ["tech.hc_framework.runtime"], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "conductor", // max 10 char
        shortName: "Holochain Conductor", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        meta: {},
        })],
      [SysState.UnderConstruction, new Unit({
        parents: ["tech.hc_framework.runtime.conductor"], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "api", // max 10 char
        shortName: "Holochain Conductor API", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        meta: {},
        })],
      [SysState.UnderConstruction, new Unit({
        parents: ["tech.hc_framework.runtime.conductor"], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "services", // max 10 char
        shortName: "Holochain Conductor Services", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        meta: {},
        })],
      [SysState.Alive, new Unit({
        parents: ["tech.hc_framework"], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "organism", // max 10 char
        shortName: "Network Organism", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      [SysState.Alive, new Unit({
        parents: ["tech.hc_framework.organism"], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "organ", // max 10 char
        shortName: "Network Organ", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      [SysState.UnderConstruction, new Unit({
        parents: ["tech.hc_framework.organism"], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "ui", // max 10 char
        shortName: "User Interface", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        meta: {},
        })],
      [SysState.Alive, new Unit({
        parents: ["tech.hc_framework.organism.organ"], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "cell", // max 10 char
        shortName: "Cell State", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      [SysState.UnderConstruction, new Unit({
        parents: ["tech.hc_framework.organism.organ"], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "shared_viz", // max 10 char
        shortName: "Shared Visibility", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        meta: {},
        })],
      [SysState.UnderConstruction, new Unit({
        parents: ["tech.hc_framework.organism.organ"], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "dna", // max 10 char
        shortName: "DNA", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        meta: {},
        })],
      [SysState.Alive, new Unit({
        parents: ["tech.hc_framework.organism.organ.cell"], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "ephemeral", // max 10 char
        shortName: "Ephemeral State", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      [SysState.Alive, new Unit({
        parents: ["tech.hc_framework.organism.organ.cell"], // full paths to parent nodes (remember it's a DAG)
        version: "vidx1",
        pathAbbreviation: "immutable", // max 10 char
        shortName: "Immutable State", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      ],
    documents: [
        {
          path: "",
          documentType: DocType.TreeMeta,
          content: [
            {
              name: "Holochain Community Standards",
              sourcePath: SourceManual,
              sectionType: SectionType.Content,
              contentType: "text/plain",
              content: `{"processRoot":"${PROCESS_ROOT}"}`,
            },
          ],
          editors: [progenitor],
          meta: {}
      },
      {
          path: "",
          documentType: DocType.Document,
          content: [
            {
              name: "title",
              sourcePath: SourceManual,
              sectionType: SectionType.Requirement,
              contentType: "text/plain",
              content: '{"description": "title of the standard being defined"}',
            },
            {
              name: "purpose",
              sourcePath:SourceManual,
              sectionType: SectionType.Requirement,
              contentType: "text/markdown",
              content: '{"description": "A multi-sentence (short paragraph) description of the purpose towards which alignment is being sought."}',
            },
          ],
          editors: [progenitor],
          meta: {}
      },
      {
        path: "tech",
        documentType: DocType.Document,
        content: [
          {
            name: "title",
            sourcePath: "",
            sectionType: SectionType.Content,
            contentType: "text/plain",
            content: 'Technical Aligments',
          },
          {
            name: "purpose",
            sourcePath:"",
            sectionType: SectionType.Content,
            contentType: "text/markdown",
            content: 'To align on the ontology, specifications, requirements, conventions, protocols, release patterns, testing frameworks, api, documentation etc for Holochain itself, as well as for standards for application types/classes/affordances built using Holochain',
          },
      ],
        editors: [progenitor],
        meta: {}
    },
    {
      path: "tech.hc_framework",
      documentType: DocType.Document,
      content: [
        {
          name: "title",
          sourcePath: "",
          sectionType: SectionType.Content,
          contentType: "text/plain",
          content: 'Holochain Framework',
        },
        {
          name: "purpose",
          sourcePath:"",
          sectionType: SectionType.Content,
          contentType: "text/markdown",
          content: "To align on the ontology, specifications, requirements, conventions, protocols, release patterns, testing frameworks, api, documentation etc for the Holochain framework",
        },
      ],
      editors: [progenitor],
      meta: {}
    },
    {
        path: "tech.hApps",
          documentType: DocType.Document,
          content: [
            {
              name: "title",
              sourcePath:"",
              sectionType: SectionType.Content,
              contentType: "text/plain",
              content: "hApp Standards",
            },
            {
              name: "purpose",
              sourcePath:"",
              sectionType: SectionType.Content,
              contentType: "text/markdown",
              content: "To align on standards for classes of holochain hApps",
            },
            {
              name: "summary",
              sourcePath:SourceManual,
              sectionType: SectionType.Requirement,
              contentType: "text/markdown",
              content: '{"description": "A multi-sentence (short paragraph) technical summary. This should be a very terse and human-readable version of the specification section. Someone should be able to read only the abstract to get the gist of what this specification does."}',
            },
            {
              name: "zome signatures",
              sourcePath:SourceManual,
              sectionType: SectionType.Requirement,
              contentType: "text/plain",
              content: '{"description": "Machine readable function signatures to expect of zomes that implement this standard."}',
            },
            {
              name: "reference implementation",
              sourcePath:SourceManual,
              sectionType: SectionType.Requirement,
              contentType: "text/plain",
              content: '{"description": "An optional section that contains a reference/example implementation that people can use to assist in understanding or implementing this specification."}',
            },
          ],
          editors: [progenitor],
          meta: {}
      },
      {
        path: "tech.hApps.ERC721_interop",
          documentType: DocType.Document,
          content: [
            {
              name: "title",
              sourcePath:"",
              sectionType: SectionType.Content,
              contentType: "text/plain",
              content: "ERC721 Interoperation Standard",
            },
            {
              name: "purpose",
              sourcePath:"",
              sectionType: SectionType.Content,
              contentType: "text/markdown",
              content: "To align on how Holochain DHTs can be used to hold data for NFTs based on the ERC721 standard.",
            },
            {
              name: "summary",
              sourcePath: "tech.hApps",
              sectionType: SectionType.Content,
              contentType: "text/markdown",
              content: "An agent or agents in a Holochain DHT commit an entry who’s HRL will be used as the referenced in the minted NFT. The minted NFT’s id a hash of the minter plus Holochain entry hash. This id then is used on the Holochain side to create a baseless link to the NFT entry. The validation rules of that link ensure the trustability of any returned value for off-ethereum-chain reference by third parties. This creates a simple, fully-decentralized mechanism to provide a non-oracle based provenance of an NFT’s resource by preventing front-running.",
            },
            {
              name: "context",
              sourcePath:`${PROCESS_ROOT}.define`,
              sectionType: SectionType.Content,
              contentType: "text/markdown",
              content: `
### Story  (notes)

Blockchain lives in a bubble.  There's no reasonable way in blockchain land to reference the state-of-afairs outside in the world without going through a trusted party.  Thus this goes counter to what blockchains are all about "trust-lessness".  Holochain DLTs are bound to the "real-world" through agency and accountability.  

In the blockchain world chain-of-custody is a non-fungible token that you watch move from place to place.  In the Holochain world chain-of-custody is by the agents accountable from it along the way signing for it.

The way we looking at NFTs right now is that the low hanging fruit is to replace IPFS for payloads rather than to try and replace the token spec, which is why we put up a PR to add ethereum compatible hashing algos, which would allow us to align NFT ids with validation logic on the DHT. Why go after the consensus mechanism (generally accepted as working fine, and difficult to do on holochain) rather than the payload hosting (generally accepted as very problematic and easy to do on holochain)?

### Problem/question:

Not require an oracle to secure/validate some form of economic activity, but have the participants able to provide adequate proof on their own. Oracles can be gamed and be incented to lie.

Having an NFT on the blockchain is not enough in general. Even having an IPFS hash of an NFT (off chain) isn't enough because IPFS has not context for proving validation of the hash.

The original minter of an NFT is often eligible for royalties, or may have extra admin permissions, etc.

It is important that as well as the opaque hash in the NFT lining up with the location in the holochain CAS, the minter needs to line up with the minter specified on the holochain side.

Specifying a minter on holochain might be optional, as the private data already affords security for as long as the private data remains private.

The issue is that for some use cases there may be economic incentive for a participant to leak the data early:

- Maybe they lost a game and are a sore loser and want to grief the winner
- Maybe they will get access to royalites or other economic incentives that they shouldn't have, simply participating in a session doesn't necessarily mean you should own the resulting NFT

So what we want is a way to specify on holochain who can mint, and have the cryptography match on both sides.

The smart contract logic is probably the limiting/driving factor here as the \`msg.sender\` in an evm contract is already the address that the signature of the transaction has been validated against. There isn't functionality in the evm to efficiently support other signature schemes because gas etc.

So somehow holochain has to mimic whatever results in \`msg.sender\` that has to be in a validatable state for any entries that could inform an NFT mint and also be included in whatever is hashed.

### End Goal

You can write a regular happ, and then by following this standard you can get NFT id that points to some snapshot of a hApps state (like a game result)

Furthermore we must:
1. Prevent pre-miniting of something by an attacker, i.e. only the winner of a game can mint, not the first one to try and mint.
2. Prevent attacker from blocking a mint, i.e. the loser of a game can't prevent the winner from minting.
3. Prevent non participants from doing either 1 or 2.
4. Prevent someone on the holochain side pretending to be someone they aren't on the ETH side
`,
            },
            {
              name: "specification",
              sourcePath:`${PROCESS_ROOT}.define`,
              sectionType: SectionType.Content,
              contentType: "text/markdown",
              content: `
### Example

#### Consuming Workflow

0. Axiom: I know the ID and who minted it.
1. Get URL from NFT
2. Treat URL as Holochain HRL
3. Follow HRL to get value from the DHT (using get_links)
4. If something is returned then NFT is valid
5. If you believe you might be under eclipse then also run the validation yourself

#### Minting Workflow

0. Assumptions:
    1. hApp state of NFT value has been committed as an entry (i.e. winning board state) known as the NFT target.
    2. This target is verifiable to be "owned" by an ETH agent via an \`ownerAgentOf(EntryHash)->EthAddress\` (i.e. either it's content contains the EthAddress of the owner, or the address can be retrieved for that state for example by get_link on the game winners AgentPubKey)
1. Get target raw hash (32bytes of EntryHash) from a zome call
2. call \`mintNFT()\` on ethereum side
3. get ID of minted NFT from indexer
4. call \`linkNFT(id, target)\` on the holochain 


Obvious gaps:

- It's not possible in the HDK to hash non-entry data
- We don't have baseless links
- We don't have eth compatibility either in HDK or util crate
    - Nico work for membrane?
    - Per-target ETH signing?

Holochain side:

\`\`\` rust
// Validation:
// - minter == ownerAgentOf(target)
// - sha256(minter + target) == base  (using raw 32)
// Note in validation we have to convert arget to raw hash (32byte version) for the hash to match the base
struct BaselessLink {
    base: TheNFTId,
    target: EntryHash,  
}

extern function linkNFT(id, target) -> ExternResult<()> {
    let base = hash(ownerAgentOf(target)+target)?;
    create_baseless_link(base, target)?;
    Ok(())
}
// from Records
fn link_nft_to_record(input: LinkingInput) -> ExternResult<HeaderHashB64> {
    let target: EntryHash = input.target.into();
    let minter = get_target_minter(target.clone())?;
    let mut hashable : [u8; 64] = [0; 64];
    let (one, two) = hashable.split_at_mut(32);    
    one.copy_from_slice(&minter);
    two.copy_from_slice(&target.get_raw_32());
    let raw_base = hash_keccak256(hashable.to_vec())?;
    if raw_base != input.base {
        return Err(WasmError::Guest("provided nft id doesn't match hash(minter+target)".into()));
    }
    let base = EntryHash::from_raw_32(raw_base);
    let header = create_link(base, target, ())?;
    Ok(header.into())
}

\`\`\`

Ethereum Side:

\`\`\`solidity=
function mintNFT(uint256 memory target_) external {
    uint256 id_;
    // Id is the bytes of the msg.sender and target_
    // concatenated and hashed.
    assembly {
        let mem_ := mload(0x40)
        mstore(mem_, msg.sender)
        mstore(add(mem_, 0x20), target_)
        mstore(0x40, add(mem_, 0x40))
        id_ := keccak256(mem_, 0x40)
    }
    _mint(id_, msg.sender);
}
\`\`\`

`,
            },
          ],
          editors: [progenitor],
          meta: {}
      },
      {
        path: "tech.hc_framework.runtime",
        documentType: DocType.Document,
        content: [
          {
            name: "title",
            sourcePath: "",
            sectionType: SectionType.Content,
            contentType: "text/plain",
            content: 'Runtime Environments',
          },
          {
            name: "purpose",
            sourcePath:"",
            sectionType: SectionType.Content,
            contentType: "text/markdown",
            content: "To provide aligment on standards for Holochain run-time environments",
          },
        ],
        editors: [progenitor],
        meta: {}
      },
      {
        path: "tech.hc_framework.runtime.conductor",
        documentType: DocType.Document,
        content: [
          {
            name: "title",
            sourcePath: "",
            sectionType: SectionType.Content,
            contentType: "text/plain",
            content: 'Conductor',
          },
          {
            name: "purpose",
            sourcePath:"",
            sectionType: SectionType.Content,
            contentType: "text/markdown",
            content: "fixme",
          },
        ],
        editors: [progenitor],
        meta: {}
      },
      {
        path: "tech.hc_framework.runtime.conductor.services",
        documentType: DocType.Document,
        content: [
          {
            name: "title",
            sourcePath: "",
            sectionType: SectionType.Content,
            contentType: "text/plain",
            content: 'Conductor Services',
          },
          {
            name: "purpose",
            sourcePath:"",
            sectionType: SectionType.Content,
            contentType: "text/markdown",
            content: "fixme",
          },
        ],
        editors: [progenitor],
        meta: {}
      },
      {
        path: "tech.hc_framework.runtime.conductor.api",
        documentType: DocType.Document,
        content: [
          {
            name: "title",
            sourcePath: "",
            sectionType: SectionType.Content,
            contentType: "text/plain",
            content: 'Conductor API',
          },
          {
            name: "purpose",
            sourcePath:"",
            sectionType: SectionType.Content,
            contentType: "text/markdown",
            content: "fixme",
          },
        ],
        editors: [progenitor],
        meta: {}
      },
      {
        path: "tech.hc_framework.organism",
        documentType: DocType.Document,
        content: [
          {
            name: "title",
            sourcePath: "",
            sectionType: SectionType.Content,
            contentType: "text/plain",
            content: 'Network Organism',
          },
          {
            name: "purpose",
            sourcePath:"",
            sectionType: SectionType.Content,
            contentType: "text/markdown",
            content: "To provide aligment on standards for Holochain hApps",
          },
        ],
        editors: [progenitor],
        meta: {}
      },
      {
        path: "tech.hc_framework.organism.ui",
        documentType: DocType.Document,
        content: [
          {
            name: "title",
            sourcePath: "",
            sectionType: SectionType.Content,
            contentType: "text/plain",
            content: 'User Interface',
          },
          {
            name: "purpose",
            sourcePath:"",
            sectionType: SectionType.Content,
            contentType: "text/markdown",
            content: "fixme",
          },
        ],
        editors: [progenitor],
        meta: {}
      },
      {
        path: "tech.hc_framework.organism.organ",
        documentType: DocType.Document,
        content: [
          {
            name: "title",
            sourcePath: "",
            sectionType: SectionType.Content,
            contentType: "text/plain",
            content: 'Network Organ',
          },
          {
            name: "purpose",
            sourcePath:"",
            sectionType: SectionType.Content,
            contentType: "text/markdown",
            content: "DNA level standards... fixme",
          },
          {
            name: "host_fn spec",
            sourcePath: SourceManual,
            sectionType: SectionType.CollectionDef,
            contentType: "text/markdown",
            content: '{"description": "specification of host functions"}',
          },
        ],
        editors: [progenitor],
        meta: {}
      },
      {
        path: "tech.hc_framework.organism.organ.dna",
        documentType: DocType.Document,
        content: [
          {
            name: "title",
            sourcePath: "",
            sectionType: SectionType.Content,
            contentType: "text/plain",
            content: 'DNA',
          },
          {
            name: "purpose",
            sourcePath:"",
            sectionType: SectionType.Content,
            contentType: "text/markdown",
            content: "fixme",
          },
        ],
        editors: [progenitor],
        meta: {}
      },
      {
        path: "tech.hc_framework.organism.organ.cell",
        documentType: DocType.Document,
        content: [
          {
            name: "title",
            sourcePath: "",
            sectionType: SectionType.Content,
            contentType: "text/plain",
            content: 'Cell',
          },
          {
            name: "purpose",
            sourcePath:"",
            sectionType: SectionType.Content,
            contentType: "text/markdown",
            content: "fixme",
          },
        ],
        editors: [progenitor],
        meta: {}
      },
      {
        path: "tech.hc_framework.organism.organ.shared_viz",
        documentType: DocType.Document,
        content: [
          {
            name: "title",
            sourcePath: "",
            sectionType: SectionType.Content,
            contentType: "text/plain",
            content: 'Shared Visibility',
          },
          {
            name: "purpose",
            sourcePath:"",
            sectionType: SectionType.Content,
            contentType: "text/markdown",
            content: "fixme",
          },
        ],
        editors: [progenitor],
        meta: {}
      },
      {
        path: "tech.hc_framework.organism.organ.cell.ephemeral",
        documentType: DocType.Document,
        content: [
          {
            name: "title",
            sourcePath: "",
            sectionType: SectionType.Content,
            contentType: "text/plain",
            content: 'Ephemeral State',
          },
          {
            name: "purpose",
            sourcePath:"",
            sectionType: SectionType.Content,
            contentType: "text/markdown",
            content: "fixme",
          },
          {
            name: "host_fn spec",
            sourcePath: "tech.hc_framework.organism.organ",
            sectionType: SectionType.Content,
            contentType: "text/markdown",
            content: 'long spec about ephemeral data',
          },
        ],
        editors: [progenitor],
        meta: {}
      },
      {
        path: "tech.hc_framework.organism.organ.cell.immutable",
        documentType: DocType.Document,
        content: [
          {
            name: "title",
            sourcePath: "",
            sectionType: SectionType.Content,
            contentType: "text/plain",
            content: 'Immutable State',
          },
          {
            name: "purpose",
            sourcePath:"",
            sectionType: SectionType.Content,
            contentType: "text/markdown",
            content: "fixme",
          },
          {
            name: "host_fn spec",
            sourcePath: "tech.hc_framework.organism.organ",
            sectionType: SectionType.Content,
            contentType: "text/markdown",
            content: 'long spec about immutability',
          },
        ],
        editors: [progenitor],
        meta: {}
      },
      {
        path: "social",
        documentType: DocType.Document,
        content: [
          {
            name: "title",
            sourcePath: "",
            sectionType: SectionType.Content,
            contentType: "text/plain",
            content: 'Social Aligments',
          },
          {
            name: "purpose",
            sourcePath:"",
            sectionType: SectionType.Content,
            contentType: "text/markdown",
            content: "To align on all of the human processes and patterns involved in building and governing Holochain and it's ecosystem",
          },
        ],
        editors: [progenitor],
        meta: {}
      },
      {
        path: "social.ops",
        documentType: DocType.Document,
        content: [
          {
            name: "title",
            sourcePath: "",
            sectionType: SectionType.Content,
            contentType: "text/plain",
            content: 'Operations',
          },
          {
            name: "purpose",
            sourcePath:"",
            sectionType: SectionType.Content,
            contentType: "text/markdown",
            content: 'To align on the operational aspects of the Holochain open-source community, including change management process of this tool.',
          },
        ],
        editors: [progenitor],
        meta: {}
      },
      {
        path: "social.biz",
        documentType: DocType.Document,
        content: [
          {
            name: "title",
            sourcePath: "",
            sectionType: SectionType.Content,
            contentType: "text/plain",
            content: 'Business, Legal, Finance, Regulatory',
          },
          {
            name: "purpose",
            sourcePath:"",
            sectionType: SectionType.Content,
            contentType: "text/markdown",
            content: 'To align on how to interface with the world of regulations, banking, and laws. To create visibility and community feedback into significant decision-making happening in these domains.',
          },
        ],
        editors: [progenitor],
        meta: {}
      },
      {
        path: "social.biz.exec",
        documentType: DocType.Document,
        content: [
          {
            name: "title",
            sourcePath: "",
            sectionType: SectionType.Content,
            contentType: "text/plain",
            content: 'Executive Function/ Council',
          },
          {
            name: "purpose",
            sourcePath:"",
            sectionType: SectionType.Content,
            contentType: "text/markdown",
            content: "To have surface area for interfacing with the Holochain Foundation's Executive Council, and make visible the people, and domains in which they are empowered and accountable to act.",
          },
        ],
        editors: [progenitor],
        meta: {}
      },
      {
        path: "social.dev_support",
        documentType: DocType.Document,
        content: [
          {
            name: "title",
            sourcePath: "",
            sectionType: SectionType.Content,
            contentType: "text/plain",
            content: 'Developer Engagment & Support',
          },
          {
            name: "purpose",
            sourcePath:"",
            sectionType: SectionType.Content,
            contentType: "text/markdown",
            content: 'To align on commitments the open-source community has to supporting and engaging with developers in the community',
          },
        ],
        editors: [progenitor],
        meta: {}
      },
      {
        path: PROCESS_ROOT,
        documentType: DocType.Document,
        content: [
          {
            name: "title",
            sourcePath: "",
            sectionType: SectionType.Content,
            contentType: "text/plain",
            content: 'Alignment Processes',
          },
          {
            name: "purpose",
            sourcePath:"",
            sectionType: SectionType.Content,
            contentType: "text/markdown",
            content: 'To specify all the different processes that are used to add new nodes to the tree and come to alignment on them.',
          },
        ],
        editors: [progenitor],
        meta: {}
      },

      {
        path: `${PROCESS_ROOT}.define`,
          documentType: DocType.Document,
          content: [
            {
              name: "title",
              sourcePath:"",
              sectionType: SectionType.Content,
              contentType: "text/plain",
              content: "Definition Process Type",
            },
            {
              name: "purpose",
              sourcePath:"",
              sectionType: SectionType.Content,
              contentType: "text/markdown",
              content: "This process type is used to define some standard in the tree.   All definitions must have a context, as specification and a rationale.",
            },
            {
              name: "threshold",
              sourcePath:SourceManual,
              sectionType: SectionType.Requirement,
              contentType: "text/plain:long",
              content: '{"description": "description of threshold for state to move to refinement"}',
            },
            {
              name: "context",
              sourcePath:`${PROCESS_ROOT}.define`,
              sectionType: SectionType.Process,
              contentType: "text/plain:long",
              content: '{"description": "Description of the context and use-case an why it requires a standard. What problem does it solve? Why should someone want to implement this standard? What benefit does it provide to the Holochain ecosystem? What use cases does this standard address?"}',
            },
            {
              name: "specification",
              sourcePath:`${PROCESS_ROOT}.define`,
              sectionType: SectionType.Process,
              contentType: "text/markdown",
              content: '{"description": "Description of the syntax, semantics, state diagrams, and workflows of any new feature/protocol/process. The specification should be detailed enough to allow for multiple interoperable implementations."}',
            },
            {
              name: "rationale",
              sourcePath:`${PROCESS_ROOT}.define`,
              sectionType: SectionType.Process,
              contentType: "text/plain:long",
              content: '{"description": "Description of what motivated the design and why particular design decisions were made. It should describe alternate designs that were considered and related work, e.g. how the feature is supported in other languages. The rationale may also provide evidence of consensus within the community, and should discuss important objections or concerns raised during discussion."}',
            },
          ],
          editors: [progenitor],
          meta: {},
      },
      {
        path: `${PROCESS_ROOT}.refine`,
          documentType: DocType.Document,
          content: [
            {
              name: "title",
              sourcePath:"",
              sectionType: SectionType.Content,
              contentType: "text/plain",
              content: "Refine Process Type",
            },
            {
              name: "purpose",
              sourcePath:"",
              sectionType: SectionType.Content,
              contentType: "text/markdown",
              content: "This process type is used to refine a standard in the tree.",
            },
            {
              name: "threshold",
              sourcePath:SourceManual,
              sectionType: SectionType.Requirement,
              contentType: "text/plain:long",
              content: '{"description": "description of threshold for state to move to alignment"}',
            },
          ],
          editors: [progenitor],
          meta: {}
      },
      {
        path: `${PROCESS_ROOT}.align`,
          documentType: DocType.Document,
          content: [
            {
              name: "title",
              sourcePath:"",
              sectionType: SectionType.Content,
              contentType: "text/plain",
              content: "Align Process Type",
            },
            {
              name: "purpose",
              sourcePath:"",
              sectionType: SectionType.Content,
              contentType: "text/markdown",
              content: "This process type is used to align on a standard after it has been defined and refined.",
            },
            {
              name: "threshold",
              sourcePath:SourceManual,
              sectionType: SectionType.Requirement,
              contentType: "text/plain:long",
              content: '{"description": "description of threshold for state to move to alive"}',
            },
          ],
          editors: [progenitor],
          meta: {}
      },
      {
        path: `${PROCESS_ROOT}.define.petition`,
          documentType: DocType.Document,
          content: [
            {
              name: "title",
              sourcePath:"",
              sectionType: SectionType.Content,
              contentType: "text/plain",
              content: "Definition by petition",
            },
            {
              name: "purpose",
              sourcePath:"",
              sectionType: SectionType.Content,
              contentType: "text/markdown",
              content: "The petition definition variant allways includes a list of the petitioners",
            },
            {
              name: "threshold",
              sourcePath:`${PROCESS_ROOT}.define`,
              sectionType: SectionType.Content,
              contentType: "text/markdown",
              content: "A petition can move to refine when the threshold number of people have signed on to the petition.",
            },
            {
              name: "petitioners",
              content: '{"description": "who is making the petition"}',
              sourcePath: SourceManual,
              sectionType: SectionType.Process,
              contentType: "json/agents",
            },
          ],
          editors: [progenitor],
          meta: {},
      },
      {
        path: `${PROCESS_ROOT}.define.declaration`,
          documentType: DocType.Document,
          content: [
            {
              name: "title",
              sourcePath:"",
              sectionType: SectionType.Content,
              contentType: "text/plain",
              content: "Definition by declaration",
            },
            {
              name: "purpose",
              sourcePath:"",
              sectionType: SectionType.Content,
              contentType: "text/markdown",
              content: "The declaration definition variant allways includes the zome signatures and an optional reference implementation",
            },
            {
              name: "threshold",
              sourcePath:`${PROCESS_ROOT}.define`,
              sectionType: SectionType.Content,
              contentType: "text/markdown",
              content: "A declaration can move to refinement whenever the stewards decide to.",
            },
          ],
          editors: [progenitor],
          meta: {},
      },
      {
        path: `${PROCESS_ROOT}.refine.comment_period`,
          documentType: DocType.Document,
          content: [
            {
              name: "title",
              sourcePath:"",
              sectionType: SectionType.Content,
              contentType: "text/plain",
              content: "Comment Period",
            },
            {
              name: "purpose",
              sourcePath:"",
              sectionType: SectionType.Content,
              contentType: "text/markdown",
              content: "The Comment Period refinement variant specifies a timeframe for commenting",
            },
            {
              name: "threshold",
              sourcePath:`${PROCESS_ROOT}.refine`,
              sectionType: SectionType.Content,
              contentType: "text/markdown",
              content: "Refinement can complete after the specified number of weeks in the period.",
            },
            { name: "commenting", 
              content: '{"description": "commenting and making change suggestions"}', 
              sourcePath:SourceManual,
              sectionType: SectionType.Process,
              contentType: "control/comments" 
            },
          ],
          editors: [progenitor],
          meta: {},
      },
      {
        path: `${PROCESS_ROOT}.align.vote`,
          documentType: DocType.Document,
          content: [
            {
              name: "title",
              sourcePath:"",
              sectionType: SectionType.Content,
              contentType: "text/plain",
              content: "Votes",
            },
            {
              name: "purpose",
              sourcePath:"",
              sectionType: SectionType.Content,
              contentType: "text/markdown",
              content: "The Votes alignment variant specifies a voting group, and a count of those votes",
            },
            {
              name: "threshold",
              sourcePath:`${PROCESS_ROOT}.align`,
              sectionType: SectionType.Content,
              contentType: "text/markdown",
              content: "Voting can move to Alive when the voting criteria have been fulfilled.",
            },
            { name: "vote", content: '{"description": "voting afforadance"}', sectionType: SectionType.Process,
            contentType: "control/voting", sourcePath:SourceManual },
          ],
          editors: [progenitor],
          meta: {},
      },
      {
        path: `${PROCESS_ROOT}.align.consensus`,
          documentType: DocType.Document,
          content: [
            {
              name: "title",
              sourcePath:"",
              sectionType: SectionType.Content,
              contentType: "text/plain",
              content: "Consensus",
            },
            {
              name: "purpose",
              sourcePath:"",
              sectionType: SectionType.Content,
              contentType: "text/markdown",
              content: "The Consensus alignment variant specifies an outcome of consensus decision that a group has taken",
            },
            {
              name: "threshold",
              sourcePath:`${PROCESS_ROOT}.align`,
              sectionType: SectionType.Content,
              contentType: "text/markdown",
              content: "Consensus can move to Alive when the consensus outcome has been recorded in the outcome section.",
            },
            { name: "outcome", content: '{"description": "results of the consensus decision"}', sectionType: SectionType.Process,
            contentType: "text/markdown", sourcePath:SourceManual },
          ],
          editors: [progenitor],
          meta: {},
      },
      {
        path: `${PROCESS_ROOT}.align.sortition`,
          documentType: DocType.Document,
          content: [
            {
              name: "title",
              sourcePath:"",
              sectionType: SectionType.Content,
              contentType: "text/plain",
              content: "Sortition",
            },
            {
              name: "purpose",
              sourcePath:"",
              sectionType: SectionType.Content,
              contentType: "text/markdown",
              content: "The Sortition alignment variant specifies a group of people who will decide on the unit and it's outcome of consensus decision that a group has taken",
            },
            {
              name: "threshold",
              sourcePath:`${PROCESS_ROOT}.align`,
              sectionType: SectionType.Content,
              contentType: "text/markdown",
              content: "Sortition can move to Alive when the sortition decision has been recorded in the outcome section by the stewards and the agents in the people section have all marked it as approved.",
            },
            { name: "people", content: '{"description": "list of people who will decide"}', sectionType: SectionType.Process,
            contentType: "json/agents", sourcePath:SourceManual },
            { name: "outcome", content: '{"description": "results of the sorition decision"}', sectionType: SectionType.Process,
            contentType: "text/markdown", sourcePath:SourceManual },
          ],
          editors: [progenitor],
          meta: {},
      }
    ],
  };
  return init;
}
