import {css, html, LitElement} from "lit";
import {property, query} from "lit/decorators.js";

import {contextProvided} from "@lit-labs/context";
import {StoreSubscriber} from "lit-svelte-stores";

import {sharedStyles} from "../sharedStyles";
import {Node, howContext} from "../types";
import {HowStore} from "../how.store";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {ProfilesStore, profilesStoreContext,} from "@holochain-open-dev/profiles";
import {
  Button, 
} from "@scoped-elements/material-web";
//import {Button, Dialog, TextField, Fab, Slider} from "@scoped-elements/material-web";

/**
 * @element how-tree
 */
export class HowTree extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  @property() currentNode = "";

  @contextProvided({ context: howContext })
  _store!: HowStore;

  @contextProvided({ context: profilesStoreContext })
  _profiles!: ProfilesStore;

  _myProfile = new StoreSubscriber(this, () => this._profiles.myProfile);
  _tree = new StoreSubscriber(this, () => this._store.tree);
  _alignments = new StoreSubscriber(this, () => this._store.alignments);
 
  select(id: string) : void {
    this.currentNode = id
    this.dispatchEvent(new CustomEvent('node-selected', { detail: id, bubbles: true, composed: true }));
  }

  getNodeId(node: Node) : string {
    return node.val.alignments.length>0 ? node.val.alignments[0] : node.id
  }

  buildTree(node: Node):any {
    const nodeId = this.getNodeId(node)
    return html`
    <li>
      <span class="${nodeId == this.currentNode ? "current" : ""}" @click=${()=>this.select(nodeId)}>
        ${node.id=="0" ? "Holochain Community Standards" : node.val.name} : ${node.val.documents.length}
        <mwc-button icon="add_circle" @click=${
          () => this.dispatchEvent(new CustomEvent('add-child', { detail: nodeId, bubbles: true, composed: true }))}>
          </mwc-button>
      </span>

      ${node.children.length>0 ? html`<ul>${node.children.map(n => this.buildTree(n))}</ul>` :html``}
    </li>`
}
  render() {
    return html`<ul class="tree">${this.buildTree(this._tree.value)}</ul>
          `
  }


  static get scopedElements() {
    return {
        "mwc-button": Button,
      };
  }
  static get styles() {
    return [
      sharedStyles,
      css`
      mwc-button {
        width: 30px;
      }
/* It's supposed to look like a tree diagram */
.tree, .tree ul, .tree li {
    list-style: none;
    margin: 0;
    padding: 0;
    position: relative;
}

.tree {
    margin: 0 0 1em;
    text-align: center;
}
.tree, .tree ul {
    display: table;
}
.tree ul {
  width: 100%;
}
.tree span.current {
  background-color: palegreen;
}
.tree span {
  background-color: white;
}
    .tree li {
      cursor: pointer;
        display: table-cell;
        padding: .5em 0;
        vertical-align: top;
    }
        /* _________ */
        .tree li:before {
            outline: solid 1px #666;
            content: "";
            left: 0;
            position: absolute;
            right: 0;
            top: 0;
        }
        .tree li:first-child:before {left: 50%;}
        .tree li:last-child:before {right: 50%;}

        .tree code, .tree span {
            border: solid .1em #666;
            border-radius: .2em;
            display: inline-block;
            margin: 0 .2em .5em;
            padding: .2em .5em;
            position: relative;
        }
        /* If the tree represents DOM structure */
        .tree code {
            font-family: monaco, Consolas, 'Lucida Console', monospace;
        }

            /* | */
            .tree ul:before,
            .tree code:before,
            .tree span:before {
                outline: solid 1px #666;
                content: "";
                height: .5em;
                left: 50%;
                position: absolute;
            }
            .tree ul:before {
                top: -.5em;
            }

            .tree code:before,
            .tree span:before {
                top: -.55em;
            }

            .tree>li {
                margin-top: 0;
            }

            .tree>li:before,
            .tree>li:after,
            .tree>li>code:before,
            .tree>li>span:before {
                outline: none;
            }
`,
    ];
  }
}
