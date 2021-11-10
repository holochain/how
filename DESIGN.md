# Holochain Standards Alignment Protocols (How)
###### tags: `holochain` `design doc`

## Intent
To create a process and embodied tool for how the Holochain community comes to alignment about technical and social matters.

## Context
In the world of Holochain DNAs the ecosystem needs a way to converge on technicial standards, including changes and feature additions to Holochain and it's HDK, classes of DNAs that meet specific needs, and technical community social processe like this one.  This is similar to IETF RFC process, or the Ethereum Request for Comment (ERC) process that standardized for example, on ERC-20 for describing the behavior of tokens.

We want this process to maximize collective alignment both on specific needs but in relations to other emerging standards.  Thus we propose the Holochain Emerging Standards protocol.

## Notes
- Standards are named, not numbered (They are versioned, but they proposal identifier is not a number like RFCs or ERCs)
- Standards are tree structured to help with dependencies and relations
- A standard is a collection of Documents that have gone through an alignment process (that itself is a standard in the tree). The initial processes are Proposal, Review, Approval

### Template for Submitting Feature Request Proposal
- Feature Name (alias names may be added shared sensemaking develops)
- Need / Use Case: Describe what you're trying to accomplish, and some clear/compelling use cases for why it needs to happen
- Suggested Approach: narrative outlining 
- Proposed Embodiment (see Embodiment format below)

### Template for Protocol for Feature Reviews
- Evaluation of Need: Is this a common or extremely uncommon need? Are there existing ways of accomplishing the outcome?
- Evaluation of Suggested Approach:


### Protocol for Converging on Standards
- Standard Name (may evolve over time as shared sensemaking occurs)
- 


## Template for Completed Standard Embodiment
- Name (full path)
- Short Description: 
- Long Description: 
- Content:
    - Holochain feature: HDK Functions (fn-names & signatures)
    - hApp type: Zome (fn-names with signatures )
    - Social process: Document following the social process format (like this one)


-----
# hApp: code-name How

## Standards Tree/DAG

The app implements the social protocol for editing the Tree of standards. [See example Miro board](https://miro.com/app/board/o9J_llxYUr8=/) of possible tree format.

The tree is implemented as holochain paths, where the links off the nodes are `AlignmentBundle` entries.   The names of each segment are abbreviated names with max ~10 chars so we can get 25 levels of depth.  Standards have Short names max 200char which can be stored in a glossary for rendering (stored as a composite path of abbreviated name/Short name and thus retreivable in one get_links).

The link tags to AlignmentBundles follow this format:

```
[phase]-[version]
```
where `phase` is one of:
- proposed (wip)
- review (presumed complete ready for review)
- final (approved)

The protocol for each one of these phases must be named in the bundle and point to the protocol standard on the tree being used.

where `version` is:
```
[version-prefix][version-num]
```
And version-prefix is a `v` followed by three characters that function as a self-describing pointer to the version protocol besing used.  Initial ones will include `vsem` and `vint`, which are described in the tree as well.

### Alignment Bundle

```rust=
struct Alignment {
  parent: Vec<String>, // full paths to parent nodes (remember it's a DAG)
  path_abbreviation: String, // max 10 char
  short_name: String, // max 25 char
  title: String,
  summary: String,
  stewards: Vec<AgentPubKey>,  // people who can change this document
  procesess: Vec<(ProcessType, String)>, // paths to process template to use
  history: BtreeMap<(ProcessType, String), EntryHash>,
  meta: BTreeMap<String, String>, // for UI to do things
}

struct Document {
  document_type: String, // template path (i.e. a process template) or "_comment" "_reply", "_template"(or other reserved types which start with _)
  editors: Vec<AgentPubKey>,  // people who can change this document, if empty anyone can
  content: BTreeMap<String, String>, // semantically identified content components
  meta: BTreeMap<String, String>, // semantically identified meta
}
```

### Document Meta Data
- See below for using meta data for comments and replies
- Used for marking approvals, ratings, votes.
- Used for influencing UI layout or other rendering hints
- Used for instructions on how to use processes (because the content contains templates for other documents)

### Comments 
Comments are implement by putting the comment text in the value of a content element keyed as "comment" and a sugested change in a content element keyed as "suggestion" with and the following in the meta:

```rust=
  document: EntryHash, // points to document being commented on
  content_key: String, // key of content component being commented on
  start_index: u32, 
  end_index: u32,
```
A reply to a comment is just a comment that has a document hash that references a comment.  Note that a reply might comment on either the comment or the suggestion.

### Templates
Templates are documents of type ``"_template"`` which have the required content keys, and optional boilerplate in the content values.  Meta may include template instructions? 


## Zome Calls
Tree gets built by creating and modifying bundles.  Create checks to make sure path exists before creating.  Update may include changing the parents which requires non-constructively checking that they exist.  To move to as a new child the abbrevation would be copied into the parent with a new abbreviation
- Crud on Bundles keyed to a path
- Crud on Documents/Comments/Replies keyed to a bundle
- `init_tree` (can only be called by progenitor)
- `get_tree` -> Tree
- `get_bundle`
- `get_document`

## Initialization/Treestrapping
The progenitor must provide some initialization data that includes initial final processes to add to the process part of the tree so that other users can pick processes when creating new `AlignmentBundles` the validation can allow the progenitor to create bundles with an `_init` process which should then be deleted by the init process itself.

This data is passed in to a `init_tree` zome call which can only be called by the progenitor.

## Import for Updates
This app needs to be able to import all the tree data at Progenitor init time, thus it must either get it from an explicit export, or by bridge call.

## UI Notes
- Limit bundle parents to 3 to prevent tree-spam
- Pick bundle parent from existing tree not by typing
- Documents with comments should have tabs for comment versions so replies on versions are all visible.
- Tree auto-layout by creation order (for stability)
- Feed of recent changes, and or tree hilight like miro

## Gaps
- out of hApp notification (eg email)

