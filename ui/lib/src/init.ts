import {
  Initialization,
  DocType,
  ProcessType,
  ProcessName,
  SysState,
  Document,
  SectionType
} from "./types";
import { AgentPubKeyB64 } from "@holochain-open-dev/core-types";

const std_procs: Array<[ProcessType, ProcessName]> = [
  ["soc_proto.process.define", "declaration"],
  ["soc_proto.process.refine", "comment_period"],
  ["soc_proto.process.align", "consensus"],
];

export function initialTree(progenitor: AgentPubKeyB64) {
  const init: Initialization = {
    alignments: [
      {
        parents: [], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "", // max 10 char
        short_name: "Holochain Standards", // max 25 char
        required_sections: [
          {
            name: "title",
            section_type: SectionType.Content,
            content_type: "text/plain",
            content: "{title of the standard being defined}",
          },
          {
            name: "summary",
            section_type: SectionType.Content,
            content_type: "text/markdown",
            content:
              "{a multi-sentence (short paragraph) technical summary. This should be a very terse and human-readable version of the specification section. Someone should be able to read only the abstract to get the gist of what this specification does.}",
          },
        ],
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        history: {},
        meta: {},
      },
      {
        parents: [], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "soc_proto", // max 10 char
        short_name: "Social Protocols", // max 25 char
        required_sections: [],
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        history: {},
        meta: {},
      },
      {
        parents: [], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "hApps", // max 10 char
        short_name: "hApp Standards", // max 25 char
        required_sections: [],
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        history: {},
        meta: {},
      },
      {
        parents: ["hApps"], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "ERC721_interop", // max 10 char
        short_name: "ERC721 Interoperability Statandard", // max 25 char
        required_sections: [],
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        history: {},
        meta: {},
      },
      {
        parents: ["soc_proto"], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "process", // max 10 char
        short_name: "How Processes", // max 25 charAgent
        required_sections: [
          {
            name: "people story",
            section_type: SectionType.Content,
            content_type: "text/markdown",
            content:
              "{a description of what this process or process type looks like to people}",
          },
        ],
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        history: {},
        meta: {},
      },
      {
        parents: ["soc_proto.process"], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "define", // max 10 char
        short_name: "Proposal procesess", // max 25 char
        required_sections: [],
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        history: {},
        meta: {},
      },
      {
        parents: ["soc_proto.process.define"], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "declaration", // max 10 char
        short_name: "Declaration", // max 25 char
        required_sections: [],
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        history: {},
        meta: {},
      },
      {
        parents: ["soc_proto.process.define"], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "petition", // max 10 char
        short_name: "Petition", // max 25 char
        required_sections: [],
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        history: {},
        meta: {},
      },
      {
        parents: ["soc_proto.process"], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "refine", // max 10 char
        short_name: "Refinement Processes", // max 25 char
        required_sections: [],
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        history: {},
        meta: {},
      },
      {
        parents: ["soc_proto.process.refine"], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "comment_period", // max 10 char
        short_name: "Comment Period", // max 25 char
        required_sections: [],
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        history: {},
        meta: {},
      },
      {
        parents: ["soc_proto.process"], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "align", // max 10 char
        short_name: "Alignment Processes", // max 25 char
        required_sections: [],
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        history: {},
        meta: {},
      },
      {
        parents: ["soc_proto.process.align"], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "vote", // max 10 char
        short_name: "Voting", // max 25 char
        required_sections: [],
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        history: {},
        meta: {},
      },
      {
        parents: ["soc_proto.process.align"], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "consensus", // max 10 char
        short_name: "Consensus", // max 25 char
        required_sections: [],
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        history: {},
        meta: {},
      },
      {
        parents: ["soc_proto.process.align"], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "sortition", // max 10 char
        short_name: "Sortition", // max 25 char
        required_sections: [],
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        history: {},
        meta: {},
      },
      {
        parents: [], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "hc_system", // max 10 char
        short_name: "Holochain System", // max 25 char
        required_sections: [],
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        history: {},
        meta: {},
      },
      {
        parents: ["hc_system"], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "conductor", // max 10 char
        short_name: "Holochain Conductor", // max 25 char
        required_sections: [],
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        history: {},
        meta: {},
      },
      {
        parents: ["hc_system.conductor"], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "api", // max 10 char
        short_name: "Holochain Conductor API", // max 25 char
        required_sections: [],
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        history: {},
        meta: {},
      },
    ],
    documents: [
      {
        path: "",
        document: new Document( {
          document_type: DocType.Document,
          content: [
            {
              name: "title",
              section_type: SectionType.Requirement,
              content_type: "text/plain",
              content: "{title of the standard being defined}",
            },
            {
              name: "summary",
              section_type: SectionType.Requirement,
              content_type: "text/markdown",
              content: "{a multi-sentence (short paragraph) technical summary. This should be a very terse and human-readable version of the specification section. Someone should be able to read only the abstract to get the gist of what this specification does.}",
            },
          ],
          editors: [progenitor],
          state: SysState.Alive
        })
      },
      {
        path: "hApps",
        document: new Document( {
          document_type: DocType.Document,
          content: [
            {
              name: "title",
              section_type: SectionType.Content,
              content_type: "text/plain",
              content: "hApp Standards",
            },
            {
              name: "summary",
              section_type: SectionType.Content,
              content_type: "text/markdown",
              content: "Standards for classes of holochain hApps",
            },
          ],
          editors: [progenitor],
          state: SysState.Alive
        })
      },
      {
        path: "hApps.ERC721_interop",
        document: new Document( {
          document_type: DocType.Document,
          content: [
            {
              name: "title",
              section_type: SectionType.Content,
              content_type: "text/plain",
              content: "ERC721 Interoperation Standard",
            },
            {
              name: "summary",
              section_type: SectionType.Content,
              content_type: "text/markdown",
              content: "An agent or agents in a Holochain DHT commit an entry who’s HRL will be used as the referenced in the minted NFT. The minted NFT’s id a hash of the minter plus Holochain entry hash. This id then is used on the Holochain side to create a baseless link to the NFT entry. The validation rules of that link ensure the trustability of any returned value for off-ethereum-chain reference by third parties. This creates a simple, fully-decentralized mechanism to provide a non-oracle based provenance of an NFT’s resource by preventing front-running.",
            },
            {
              name: "context",
              section_type: SectionType.Content,
              content_type: "text/markdown",
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
          ],
          editors: [progenitor],
          state: "define"
        })
      },
     
      {
        path: "soc_proto.process.define",
        document: new Document( {
          document_type: DocType.Document,
          content: [
            {
              name: "title",
              section_type: SectionType.Content,
              content_type: "text/plain",
              content: "Definition Process Type",
            },
            {
              name: "summary",
              section_type: SectionType.Content,
              content_type: "text/markdown",
              content: "This process type is used to define some standard in the tree.   All definitions must have a context, as specification and a rationale.",
            },
            {
              name: "context",
              section_type: SectionType.Process,
              content_type: "text/plain:long",
              content:
                "{Description of the context and use-case an why it requires a standard. What problem does it solve? Why should someone want to implement this standard? What benefit does it provide to the Holochain ecosystem? What use cases does this standard address?}",
            },
            {
              name: "specification",
              section_type: SectionType.Process,
              content_type: "text/markdown",
              content:
                "{**Description** of the syntax, semantics, state diagrams, and workflows of any new feature/protocol/process. The specification should be detailed enough to allow for multiple interoperable implementations.}",
            },
            {
              name: "rationale",
              section_type: SectionType.Process,
              content_type: "text/plain:long",
              content:
                "{Description of what motivated the design and why particular design decisions were made. It should describe alternate designs that were considered and related work, e.g. how the feature is supported in other languages. The rationale may also provide evidence of consensus within the community, and should discuss important objections or concerns raised during discussion.}",
            },
          ],
          editors: [progenitor],
          state: SysState.Alive,
          meta: {},
        }),
      },
      {
        path: "soc_proto.process.refine",
        document: new Document( {
          document_type: DocType.Document,
          content: [
            {
              name: "title",
              section_type: SectionType.Content,
              content_type: "text/plain",
              content: "Refine Process Type",
            },
            {
              name: "summary",
              section_type: SectionType.Content,
              content_type: "text/markdown",
              content: "This process type is used to refine astandard in the tree.",
            },
          ],
          editors: [progenitor],
          state: SysState.Alive,
        }),
      },
      {
        path: "soc_proto.process.align",
        document: new Document( {
          document_type: DocType.Document,
          content: [
            {
              name: "title",
              section_type: SectionType.Content,
              content_type: "text/plain",
              content: "Align Process Type",
            },
            {
              name: "summary",
              section_type: SectionType.Content,
              content_type: "text/markdown",
              content: "This process type is used to align on a standard after it has been defined and refined.",
            },
          ],
          editors: [progenitor],
          state: SysState.Alive,
        }),
      },
      {
        path: "soc_proto.process.define.petition",
        document: new Document( {
          document_type: DocType.Document,
          content: [
            {
              name: "title",
              section_type: SectionType.Content,
              content_type: "text/plain",
              content: "Definition by petition",
            },
            {
              name: "summary",
              section_type: SectionType.Content,
              content_type: "text/markdown",
              content: "The petition definition variant allways includes a list of the pettioners",
            },
            {
              name: "pettioners",
              content: "{who is making the petition}",
              section_type: SectionType.Process,
              content_type: "text/plain",
            },
          ],
          editors: [progenitor],
          state: SysState.Alive,
          meta: {},
        }),
      },
      {
        path: "soc_proto.process.define.declaration",
        document: new Document( {
          document_type: DocType.Document,
          content: [
            {
              name: "title",
              section_type: SectionType.Content,
              content_type: "text/plain",
              content: "Definition by declaration",
            },
            {
              name: "summary",
              section_type: SectionType.Content,
              content_type: "text/markdown",
              content: "The declaration definition variant allways includes the zome signatures and an optional reference implementation",
            },
            {
              name: "zome signatures",
              section_type: SectionType.Process,
              content_type: "text/json",
              content:
                "{Machine readable function signatures to expect of zomes that implement this standard.",
            },
            {
              name: "reference implementation",
              section_type: SectionType.Process,
              content_type: "text/rust",
              content:
                "{An optional section that contains a reference/example implementation that people can use to assist in understanding or implementing this specification.}",
            },
          ],
          editors: [progenitor],
          state: SysState.Alive,
          meta: {},
        }),
      },
      {
        path: "soc_proto.process.refine.comment_period",
        document: new Document( {
          document_type: DocType.Document,
          content: [
            {
              name: "title",
              section_type: SectionType.Content,
              content_type: "text/plain",
              content: "Comment Period",
            },
            {
              name: "summary",
              section_type: SectionType.Content,
              content_type: "text/markdown",
              content: "The Comment Period refinement variant specifies a timeframe for commenting",
            },
            { name: "period", 
              content: "{number of weeks in the comment period}", 
              section_type: SectionType.Process,
              content_type: "text/integer" 
            },
          ],
          editors: [progenitor],
          state: SysState.Alive,
          meta: {},
        }),
      },
      {
        path: "soc_proto.process.align.vote",
        document: new Document( {
          document_type: DocType.Document,
          content: [
            {
              name: "title",
              section_type: SectionType.Content,
              content_type: "text/plain",
              content: "Votes",
            },
            {
              name: "summary",
              section_type: SectionType.Content,
              content_type: "text/markdown",
              content: "The Votes aligment variant specifies a voting group, and a count of those votes",
            },
            { name: "voters", content: "{list of people who may vote}", section_type: SectionType.Process,
            content_type: "text/plain" },
            { name: "votes", content: "{record of the votes taken}", section_type: SectionType.Process,
            content_type: "text/plain" },
          ],
          editors: [progenitor],
          state: SysState.Alive,
          meta: {},
        }),
      },
      {
        path: "soc_proto.process.align.consensus",
        document: new Document( {
          document_type: DocType.Document,
          content: [
            {
              name: "title",
              section_type: SectionType.Content,
              content_type: "text/plain",
              content: "Consensus",
            },
            {
              name: "summary",
              section_type: SectionType.Content,
              content_type: "text/markdown",
              content: "The Consensus aligment variant specifies an outcome of consensus decision that a group has taken",
            },
            { name: "outcome", content: "{results of the consensus decision}", section_type: SectionType.Process,
            content_type: "text/markdown" },
          ],
          editors: [progenitor],
          state: SysState.Alive,
          meta: {},
        }),
      },
      {
        path: "soc_proto.process.align.sortition",
        document: new Document( {
          document_type: DocType.Document,
          content: [
            {
              name: "title",
              section_type: SectionType.Content,
              content_type: "text/plain",
              content: "Sortition",
            },
            {
              name: "summary",
              section_type: SectionType.Content,
              content_type: "text/markdown",
              content: "The Sortition aligment variant specifies a group of people who will decide on the alignment and it's outcome of consensus decision that a group has taken",
            },
            { name: "people", content: "{list of people who will decide}", section_type: SectionType.Process,
            content_type: "text/plain" },
            { name: "outcome", content: "{results of the sorition decision}", section_type: SectionType.Process,
            content_type: "text/markdown" },
          ],
          editors: [progenitor],
          state: SysState.Alive,
          meta: {},
        }),
      }
    ],
  };
  return init;
}
