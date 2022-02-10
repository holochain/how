import {
  Initialization,
  DocType,
  ProcessType,
  ProcessName,
  SysState,
  Document
} from "./types";
import { AgentPubKeyB64 } from "@holochain-open-dev/core-types";

const std_procs: Array<[ProcessType, ProcessName]> = [
  ["soc_proto.process.define", "declaration"],
  ["soc_proto.process.refine", "prototyped"],
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
            content_type: "text/plain",
            content: "{title of the standard being defined}",
          },
          {
            name: "summary",
            content_type: "text/markdown",
            content:
              "{a multi-sentence (short paragraph) technical summary. This should be a very terse and human-readable version of the specification section. Someone should be able to read only the abstract to get the gist of what this specification does.}",
          },
        ],
        stewards: [progenitor], // people who can change this document
        processes: std_procs, // paths to process template to use
        history: {},
        meta: {},
      },
      {
        parents: [], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "soc_proto", // max 10 char
        short_name: "Social Protocols", // max 25 char
        required_sections: [],
        stewards: [progenitor], // people who can change this document
        processes: std_procs, // paths to process template to use
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
            content_type: "text/markdown",
            content:
              "{a description of what this process or process type looks like to people}",
          },
        ],
        stewards: [progenitor], // people who can change this document
        processes: std_procs, // paths to process template to use
        history: {},
        meta: {},
      },
      {
        parents: ["soc_proto.process"], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "define", // max 10 char
        short_name: "Proposal procesess", // max 25 char
        required_sections: [],
        stewards: [progenitor], // people who can change this document
        processes: std_procs, // paths to process template to use
        history: {},
        meta: {},
      },
      {
        parents: ["soc_proto.process.define"], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "declaration", // max 10 char
        short_name: "Declaration", // max 25 char
        required_sections: [],
        stewards: [progenitor], // people who can change this document
        processes: std_procs, // paths to process template to use
        history: {},
        meta: {},
      },
      {
        parents: ["soc_proto.process.define"], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "petition", // max 10 char
        short_name: "Petition", // max 25 char
        required_sections: [],
        stewards: [progenitor], // people who can change this document
        processes: std_procs, // paths to process template to use
        history: {},
        meta: {},
      },
      {
        parents: ["soc_proto.process"], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "refine", // max 10 char
        short_name: "Refinement Processes", // max 25 char
        required_sections: [],
        stewards: [progenitor], // people who can change this document
        processes: std_procs, // paths to process template to use
        history: {},
        meta: {},
      },
      {
        parents: ["soc_proto.process.refine"], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "prototyped", // max 10 char
        short_name: "Prototyped refinements", // max 25 char
        required_sections: [],
        stewards: [progenitor], // people who can change this document
        processes: std_procs, // paths to process template to use
        history: {},
        meta: {},
      },
      {
        parents: ["soc_proto.process"], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "align", // max 10 char
        short_name: "Alignment Processes", // max 25 char
        required_sections: [],
        stewards: [progenitor], // people who can change this document
        processes: std_procs, // paths to process template to use
        history: {},
        meta: {},
      },
      {
        parents: ["soc_proto.process.align"], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "vote", // max 10 char
        short_name: "Voting", // max 25 char
        required_sections: [],
        stewards: [progenitor], // people who can change this document
        processes: std_procs, // paths to process template to use
        history: {},
        meta: {},
      },
      {
        parents: ["soc_proto.process.align"], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "consensus", // max 10 char
        short_name: "Consensus", // max 25 char
        required_sections: [],
        stewards: [progenitor], // people who can change this document
        processes: std_procs, // paths to process template to use
        history: {},
        meta: {},
      },
      {
        parents: ["soc_proto.process.align"], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "sortition", // max 10 char
        short_name: "Sortition", // max 25 char
        required_sections: [],
        stewards: [progenitor], // people who can change this document
        processes: std_procs, // paths to process template to use
        history: {},
        meta: {},
      },
      {
        parents: ["soc_proto.process.align"], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "fiat", // max 10 char
        short_name: "Fiat", // max 25 char
        required_sections: [],
        stewards: [progenitor], // people who can change this document
        processes: std_procs, // paths to process template to use
        history: {},
        meta: {},
      },
      {
        parents: [], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "hc_system", // max 10 char
        short_name: "Holochain System", // max 25 char
        required_sections: [],
        stewards: [progenitor], // people who can change this document
        processes: std_procs, // paths to process template to use
        history: {},
        meta: {},
      },
      {
        parents: ["hc_system"], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "conductor", // max 10 char
        short_name: "Holochain Conductor", // max 25 char
        required_sections: [],
        stewards: [progenitor], // people who can change this document
        processes: std_procs, // paths to process template to use
        history: {},
        meta: {},
      },
      {
        parents: ["hc_system.conductor"], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "api", // max 10 char
        short_name: "Holochain Conductor API", // max 25 char
        required_sections: [],
        stewards: [progenitor], // people who can change this document
        processes: std_procs, // paths to process template to use
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
              content_type: "text/plain",
              content: "Holochain Community Standards",
            },
            {
              name: "summary",
              content_type: "text/markdown",
              content: "A standard is something defined in this tree.  ",
            },
          ],
          editors: [progenitor],
          state: SysState.Alive
        })
      },
      {
        path: "soc_proto.process.define",
        document: new Document( {
          document_type: DocType.Template,
          content: [
            {
              name: "context",
              content_type: "text/plain:long",
              content:
                "{Description of the context and use-case an why it requires a standard. What problem does it solve? Why should someone want to implement this standard? What benefit does it provide to the Holochain ecosystem? What use cases does this standard address?}",
            },
            {
              name: "specification",
              content_type: "text/markdown",
              content:
                "{**Description** of the syntax, semantics, state diagrams, and workflows of any new feature/protocol/process. The specification should be detailed enough to allow for multiple interoperable implementations.}",
            },
            {
              name: "rationale",
              content_type: "text/plain:long",
              content:
                "{Description of what motivated the design and why particular design decisions were made. It should describe alternate designs that were considered and related work, e.g. how the feature is supported in other languages. The rationale may also provide evidence of consensus within the community, and should discuss important objections or concerns raised during discussion.}",
            },
          ],
          editors: [progenitor],
          state: SysState.Alive,
        }),
      },
      {
        path: "soc_proto.process.define.petition",
        document: new Document( {
          document_type: DocType.Template,
          content: [
            {
              name: "petition",
              content: "{what is being requestes}",
              content_type: "text/plain",
            },
          ],
          editors: [progenitor],
          state: SysState.Alive,
        }),
      },
      {
        path: "soc_proto.process.define.declaration",
        document: new Document( {
          document_type: DocType.Template,
          content: [
            {
              name: "zome signatures",
              content_type: "text/json",
              content:
                "{Machine readable function signatures to expect of zomes that implement this standard.",
            },
            {
              name: "reference implementation",
              content_type: "text/rust",
              content:
                "{An optional section that contains a reference/example implementation that people can use to assist in understanding or implementing this specification.}",
            },
          ],
          editors: [progenitor],
          state: SysState.Alive,
        }),
      },
      {
        path: "soc_proto.process.refine.prototyped",
        document: new Document( {
          document_type: DocType.Template,
          content: [
            { name: "prototype", content: "{pointers to the prototypes}", content_type: "text/markdown" },
          ],
          editors: [progenitor],
          state: SysState.Alive,
        }),
      },
      {
        path: "soc_proto.process.align.vote",
        document: new Document( {
          document_type: DocType.Template,
          content: [
            { name: "votes", content: "{record of the votes taken}", content_type: "text/plain" },
          ],
          editors: [progenitor],
          state: SysState.Alive,
        }),
      },
      {
        path: "soc_proto.process.align.consensus",
        document: new Document( {
          document_type: DocType.Template,
          content: [
            { name: "discussion", content: "{results of the consensus discussion}", content_type: "text/plain" },
          ],
          editors: [progenitor],
          state: SysState.Alive,
        }),
      },
      {
        path: "soc_proto.process.align.sortition",
        document: new Document( {
          document_type: DocType.Template,
          content: [
            { name: "people", content: "{list of people who will decide}", content_type: "text/plain" },
          ],
          editors: [progenitor],
          state: SysState.Alive,
        }),
      },
      {
        path: "soc_proto.process.align.fiat",
        document: new Document( {
          document_type: DocType.Template,
          content: [
            { name: "fiat", content: "{record of who declared this by fiat}", content_type: "text/plain" },
          ],
          editors: [progenitor],
          state: SysState.Alive,
        }),
      },
    ],
  };
  return init;
}
