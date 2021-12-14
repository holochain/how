import {Initialization, DOC_TEMPLATE, ProcessType, ProcessName,STAUTS_COMPLETED} from "./types";
import { AgentPubKeyB64 } from "@holochain-open-dev/core-types";

const std_procs: Array<[ProcessType, ProcessName]> = [["soc_proto.process.define","declaration"], ["soc_proto.process.refine", "prototyped"], ["soc_proto.process.align", "consensus"]]

export function initialTree(progenitor: AgentPubKeyB64)  {
    const init:Initialization ={
    alignments: [
      {
        parents: [], // full paths to parent nodes (remember it's a DAG)
        path_abbreviation: "", // max 10 char
        short_name: "Holochain Standards", // max 25 char
        title: "Holochain Community Standards",
        summary: "All the protocols and process and standards used by the holochain community",
        stewards: [progenitor],  // people who can change this document
        status: STAUTS_COMPLETED,
        processes: std_procs, // paths to process template to use
        history: {},
        meta: {}
      },
      {
      parents: [], // full paths to parent nodes (remember it's a DAG)
      path_abbreviation: "soc_proto", // max 10 char
      short_name: "Social Protocols", // max 25 char
      title: "Social Protocols used by the Holochain Community",
      summary: "The holochain community uses social protocols to get its work done.",
      stewards: [progenitor],  // people who can change this document
      status: STAUTS_COMPLETED,
      processes: std_procs, // paths to process template to use
      history: {},
      meta: {}
    },
    {
      parents: ["soc_proto"], // full paths to parent nodes (remember it's a DAG)
      path_abbreviation: "process", // max 10 char
      short_name: "How Processes", // max 25 charAgent
      title: "Processes types used for making changes to this tree",
      summary: "blah blah",
      stewards: [progenitor],  // people who can change this document
      status: STAUTS_COMPLETED,
      processes: std_procs, // paths to process template to use
      history: {},
      meta: {}
    },
    {
      parents: ["soc_proto.process"], // full paths to parent nodes (remember it's a DAG)
      path_abbreviation: "define", // max 10 char
      short_name: "Proposal procesess", // max 25 char
      title: "",
      summary: "blah blah",
      stewards: [progenitor],  // people who can change this document
      status: STAUTS_COMPLETED,
      processes: std_procs, // paths to process template to use
      history: {},
      meta: {}
    },
    {
      parents: ["soc_proto.process.define"], // full paths to parent nodes (remember it's a DAG)
      path_abbreviation: "declaration", // max 10 char
      short_name: "Declaration", // max 25 char
      title: "Making a proposal via declaration",
      summary: "blah blah",
      stewards: [progenitor],  // people who can change this document
      status: STAUTS_COMPLETED,
      processes: std_procs, // paths to process template to use
      history: {},
      meta: {}
    },
    {
      parents: ["soc_proto.process.define"], // full paths to parent nodes (remember it's a DAG)
      path_abbreviation: "petition", // max 10 char
      short_name: "Petition", // max 25 char
      title: "Making a proposal via petition",
      summary: "blah blah",
      stewards: [progenitor],  // people who can change this document
      status: STAUTS_COMPLETED,
      processes: std_procs, // paths to process template to use
      history: {},
      meta: {}
    },
    {
      parents: ["soc_proto.process"], // full paths to parent nodes (remember it's a DAG)
      path_abbreviation: "refine", // max 10 char
      short_name: "Refinement Processes", // max 25 char
      title: "Processes for reviewing proposals",
      summary: "blah blah",
      stewards: [progenitor],  // people who can change this document
      status: STAUTS_COMPLETED,
      processes: std_procs, // paths to process template to use
      history: {},
      meta: {}
    },
    {
      parents: ["soc_proto.process.refine"], // full paths to parent nodes (remember it's a DAG)
      path_abbreviation: "prototyped", // max 10 char
      short_name: "Prototyped refinements", // max 25 char
      title: "Refining a standard with prototypes",
      summary: "blah blah",
      stewards: [progenitor],  // people who can change this document
      status: STAUTS_COMPLETED,
      processes: std_procs, // paths to process template to use
      history: {},
      meta: {}
    },    {
      parents: ["soc_proto.process"], // full paths to parent nodes (remember it's a DAG)
      path_abbreviation: "align", // max 10 char
      short_name: "Alignment Processes", // max 25 char
      title: "Processes for approving proposals",
      summary: "blah blah",
      stewards: [progenitor],  // people who can change this document
      status: STAUTS_COMPLETED,
      processes: std_procs, // paths to process template to use
      history: {},
      meta: {}
    },
    {
      parents: ["soc_proto.process.align"], // full paths to parent nodes (remember it's a DAG)
      path_abbreviation: "vote", // max 10 char
      short_name: "Voting", // max 25 char
      title: "Process for approving reviewed proposals by voting",
      summary: "blah blah",
      stewards: [progenitor],  // people who can change this document
      status: STAUTS_COMPLETED,
      processes: std_procs, // paths to process template to use
      history: {},
      meta: {}
    },
    {
      parents: ["soc_proto.process.align"], // full paths to parent nodes (remember it's a DAG)
      path_abbreviation: "consensus", // max 10 char
      short_name: "Consensus", // max 25 char
      title: "Process for approving reviewed proposals by consensus",
      summary: "blah blah",
      stewards: [progenitor],  // people who can change this document
      status: STAUTS_COMPLETED,
      processes: std_procs, // paths to process template to use
      history: {},
      meta: {}
    },
    {
      parents: ["soc_proto.process.align"], // full paths to parent nodes (remember it's a DAG)
      path_abbreviation: "sortition", // max 10 char
      short_name: "Sortition", // max 25 char
      title: "Process for approving reviewed proposals by sortition",
      summary: "blah blah",
      stewards: [progenitor],  // people who can change this document
      status: STAUTS_COMPLETED,
      processes: std_procs, // paths to process template to use
      history: {},
      meta: {}
    },
    {
      parents: [], // full paths to parent nodes (remember it's a DAG)
      path_abbreviation: "hc_system", // max 10 char
      short_name: "Holochain System", // max 25 char
      title: "Holochain complete system",
      summary: "blah blah",
      stewards: [progenitor],  // people who can change this document
      status: STAUTS_COMPLETED,
      processes: std_procs, // paths to process template to use
      history: {},
      meta: {}
    },
    {
      parents: ["hc_system"], // full paths to parent nodes (remember it's a DAG)
      path_abbreviation: "conductor", // max 10 char
      short_name: "Holochain Conductor", // max 25 char
      title: "Holochain Conductor",
      summary: "blah blah",
      stewards: [progenitor],  // people who can change this document
      status: STAUTS_COMPLETED,
      processes: std_procs, // paths to process template to use
      history: {},
      meta: {}
    },
    {
      parents: ["hc_system.conductor"], // full paths to parent nodes (remember it's a DAG)
      path_abbreviation: "api", // max 10 char
      short_name: "Holochain Conductor API", // max 25 char
      title: "specification of the holochain conductor api",
      summary: "blah blah",
      stewards: [progenitor],  // people who can change this document
      status: STAUTS_COMPLETED,
      processes: std_procs, // paths to process template to use
      history: {},
      meta: {}
    }],
    documents: [
    {
      path: "soc_proto.process.define.petition",
      document: {  
        document_type: DOC_TEMPLATE,
        content: [
          {name: "title", content: "{title of the standard being defined (max 255 chars)}", content_type:"text/plain"},
          {name: "summary", content: "{a multi-sentence (short paragraph) technical summary. This should be a very terse and human-readable version of the specification section. Someone should be able to read only the abstract to get the gist of what this specification does.}", content_type:"text/plain"},
        ],
        editors: [progenitor],
        meta: {"required": "[\"title\", \"summary\"]"}
      }
    },
    {
        path: "soc_proto.process.define.declaration",
        document: {  
          document_type: DOC_TEMPLATE,
          content: [
            {name: "title", content: "{title of the standard being defined}", content_type:"text/plain"},
            {name: "summary", content: "{a multi-sentence (short paragraph) technical summary. This should be a very terse and human-readable version of the specification section. Someone should be able to read only the abstract to get the gist of what this specification does.}", content_type:"text/plain"},
            {name: "context", content: "{Description of the context and use-case an why it requires a standard. What problem does it solve? Why should someone want to implement this standard? What benefit does it provide to the Holochain ecosystem? What use cases does this standard address?}", content_type:"text/plain" },
            {name: "specification", content: "{Description of the syntax, semantics, state diagrams, and workflows of any new feature/protocol/process. The specification should be detailed enough to allow for multiple interoperable implementations.}", content_type:"text/markdown"},
            {name: "zome siganures", content: "{Machine readable function signatures to expect of zomes that implement this standard.", content_type:"text/json"},
            {name: "rationale", content: "{Description of what motivated the design and why particular design decisions were made. It should describe alternate designs that were considered and related work, e.g. how the feature is supported in other languages. The rationale may also provide evidence of consensus within the community, and should discuss important objections or concerns raised during discussion.}", content_type:"text/plain"},
            {name: "reference implementation", content: "{An optional section that contains a reference/example implementation that people can use to assist in understanding or implementing this specification.}", content_type:"text/rust"},
          ],
          editors: [progenitor],
          meta: {}
        }
      },
      {
        path: "soc_proto.process.refine.prototyped",
        document: {  
          document_type: DOC_TEMPLATE,
          content: [
            {name: "title", content: "{}", content_type:"text/plain"},
            {name: "summary", content: "{}", content_type:"text/plain"},
          ],
          editors: [progenitor],
          meta: {}
        }
      },
      {
        path: "soc_proto.process.align.vote",
        document: {  
          document_type: DOC_TEMPLATE,
          content: [
            {name: "title", content: "Voting", content_type:"text/plain"},
            {name: "summary", content: "{}", content_type:"text/plain"},
          ],
          editors: [progenitor],
          meta: {}
        }
      },
      {
      path: "soc_proto.process.align.consensus",
      document: {  
        document_type: DOC_TEMPLATE,
        content: [
          {name: "title", content: "Consensus", content_type:"text/plain"},
          {name: "summary", content: "{}", content_type:"text/plain"},
        ],
        editors: [progenitor],
        meta: {}
      }
    },
    {
      path: "soc_proto.process.align.sortition",
      document: {  
        document_type: DOC_TEMPLATE,
        content: [
          {name: "title", content: "Sortition", content_type:"text/plain"},
          {name: "summary", content: "{}", content_type:"text/plain"},
        ],
        editors: [progenitor],
        meta: {}
      }
    },
    ]}
    return init
}