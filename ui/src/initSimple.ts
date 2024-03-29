import {
  Initialization,
  DocType,
  ProcessType,
  ProcessName,
  SysState,
  Document,
  SectionType,
  SourceManual,
  Unit
} from "./types";
import { AgentPubKeyB64 } from "@holochain/client";

const PROCESS_ROOT = "soc_proto.process"

const std_procs: Array<[ProcessType, ProcessName]> = [
  [`${PROCESS_ROOT}.define`, "declaration"],
  [`${PROCESS_ROOT}.refine`, "comment_period"],
  [`${PROCESS_ROOT}.align`, "vote"],
];

export function initialTreeSimple(progenitor: AgentPubKeyB64) {
  const init: Initialization = {
    units: [
      [SysState.Alive, new Unit({
        parents: [], // full paths to parent nodes (remember it's a DAG)
        version: "vidx:1",
        pathAbbreviation: "", // max 10 char
        shortName: "Alignments", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
      })],
      [SysState.Alive, new Unit({
        parents: [], // full paths to parent nodes (remember it's a DAG)
        version: "vidx:1",
        pathAbbreviation: "soc_proto", // max 10 char
        shortName: "Social Protocols", // max 25 char        stewards: [progenitor], // people who can change this document
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      [SysState.Alive, new Unit({
        parents: [], // full paths to parent nodes (remember it's a DAG)
        version: "vidx:1",
        pathAbbreviation: "projects", // max 10 char
        shortName: "Projects", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      [SysState.Alive, new Unit({
        parents: ["soc_proto"], // full paths to parent nodes (remember it's a DAG)
        version: "vidx:1",
        pathAbbreviation: "process", // max 10 char
        shortName: "How Processes", // max 25 charAgent
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      [SysState.Alive, new Unit({
        parents: [PROCESS_ROOT], // full paths to parent nodes (remember it's a DAG)
        version: "vidx:1",
        pathAbbreviation: "define", // max 10 char
        shortName: "Proposal procesess", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      [SysState.Alive, new Unit({
        parents: [`${PROCESS_ROOT}.define`], // full paths to parent nodes (remember it's a DAG)
        version: "vidx:1",
        pathAbbreviation: "declaration", // max 10 char
        shortName: "Declaration", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      [SysState.Alive, new Unit({
        parents: [`${PROCESS_ROOT}.define`], // full paths to parent nodes (remember it's a DAG)
        version: "vidx:1",
        pathAbbreviation: "petition", // max 10 char
        shortName: "Petition", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      [SysState.Alive, new Unit({
        parents: [PROCESS_ROOT], // full paths to parent nodes (remember it's a DAG)
        version: "vidx:1",
        pathAbbreviation: "refine", // max 10 char
        shortName: "Refinement Processes", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      [SysState.Alive, new Unit({
        parents: [`${PROCESS_ROOT}.refine`], // full paths to parent nodes (remember it's a DAG)
        version: "vidx:1",
        pathAbbreviation: "comment_period", // max 10 char
        shortName: "Comment Period", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      [SysState.Alive, new Unit({
        parents: [PROCESS_ROOT], // full paths to parent nodes (remember it's a DAG)
        version: "vidx:1",
        pathAbbreviation: "align", // max 10 char
        shortName: "Unit Processes", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      [SysState.Alive, new Unit({
        parents: [`${PROCESS_ROOT}.align`], // full paths to parent nodes (remember it's a DAG)
        version: "vidx:1",
        pathAbbreviation: "vote", // max 10 char
        shortName: "Voting", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      [SysState.Alive, new Unit({
        parents: [`${PROCESS_ROOT}.align`], // full paths to parent nodes (remember it's a DAG)
        version: "vidx:1",
        pathAbbreviation: "consensus", // max 10 char
        shortName: "Consensus", // max 25 char
        stewards: [progenitor], // people who can change this document
        processes: std_procs,
        })],
      [SysState.Alive, new Unit({
        parents: [`${PROCESS_ROOT}.align`], // full paths to parent nodes (remember it's a DAG)
        version: "vidx:1",
        pathAbbreviation: "sortition", // max 10 char
        shortName: "Sortition", // max 25 char
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
              name: "Alignments",
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
        path: "projects",
          documentType: DocType.Document,
          content: [
            {
              name: "title",
              sourcePath:"",
              sectionType: SectionType.Content,
              contentType: "text/plain",
              content: "Projects",
            },
            {
              name: "purpose",
              sourcePath:"",
              sectionType: SectionType.Content,
              contentType: "text/markdown",
              content: "Projects the group has taken on",
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
