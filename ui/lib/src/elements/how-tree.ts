import {css, html, LitElement} from "lit";
import {property, query, state} from "lit/decorators.js";

import { contextProvided } from "@lit-labs/context";
import {StoreSubscriber} from "lit-svelte-stores";

import {sharedStyles} from "../sharedStyles";
import {Node, howContext} from "../types";
import {HowStore} from "../how.store";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {ProfilesStore, profilesStoreContext,} from "@holochain-open-dev/profiles";
import {
  Button, 
} from "@scoped-elements/material-web";
import { HowNode } from "./how-node";
import { serializeHash } from "@holochain-open-dev/utils";
//import {Button, Dialog, TextField, Fab, Slider} from "@scoped-elements/material-web";

/**
 * @element how-tree
 */
export class HowTree extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  @property() currentNode = "";
  @property() treeType = "tree";

  @contextProvided({ context: howContext })
  _store!: HowStore;

  @contextProvided({ context: profilesStoreContext })
  _profiles!: ProfilesStore;

  _tree = new StoreSubscriber(this, () => this._store.tree);
  _units = new StoreSubscriber(this, () => this._store.units);
  _documents = new StoreSubscriber(this, () => this._store.documents);

  select(id: string) : void {
    this.currentNode = id
    this.dispatchEvent(new CustomEvent('node-selected', { detail: id, bubbles: true, composed: true }));
  }

  getNodeId(node: Node) : string {
    return node.val.units.length>0 ? serializeHash(node.val.units[0].hash) : node.id
  }

  buildTree(node: Node):any {
    const nodeId = this.getNodeId(node)
    //const documentsMap = this._documents.value
    //const docs = node.val.documents.map(hash => documentsMap[serializeHash(hash)])
    const state = node.val.units[0].state// docs[docs.length-1]? docs[docs.length-1].state : ""
    return html`
    <li class="${this.treeType}">
      <span class="${nodeId == this.currentNode ? "current" : ""}" @click=${()=>this.select(nodeId)}>
        ${node.id=="0" ? "Holochain Community Standards" : node.val.name} : ${node.val.documents.length}
        <!-- <mwc-button icon="add_circle" @click=${
          () => this.dispatchEvent(new CustomEvent('add-child', { detail: nodeId, bubbles: true, composed: true }))}>
          </mwc-button> -->
          <div style="width:50px">
          <how-node .unit=${this._units.value[nodeId]} state=${state}> </how-node>
          </div>
      </span>

      ${node.children.length>0 ? html`<ul>${node.children.map(n => this.buildTree(n))}</ul>` :html``}
    </li>`
}
  render() {
    return html`
<ul class="${this.treeType}">${this.buildTree(this._tree.value)}</ul>
          `
  }


  static get scopedElements() {
    return {
        "mwc-button": Button,
        "how-node": HowNode
      };
  }
  static get styles() {
    return [
      sharedStyles,
      css`
      mwc-button {
        width: 30px;
      }
      .file-tree mwc-button {
        height: 0px;
      }
      .file-tree span.current {
          background-color: palegreen;
        }

        .file-tree {
          font:normal normal 13px/1.4 Segoe,"Segoe UI",Calibri,Helmet,FreeSans,Sans-Serif;
        }
        .file-tree,
        .file-tree ul {
          margin: 0 0 0 1em; /* indentation */
          padding: 0;
          list-style: none;
          color: black;
          position: relative;
        }

        .file-tree ul {
          margin-left: 0.5em;
        } /* (indentation/2) */

        .file-tree:before,
        .file-tree ul:before {
          content: "";
          display: block;
          width: 0;
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          border-left: 1px solid;
        }

        .file-tree li {
          margin: 0;
          padding: 0 1em; /* indentation + .5em */
          line-height: 2em;
          position: relative;
        }

        .file-tree li:before {
          content: "";
          display: block;
          width: 10px; /* same with indentation */
          height: 0;
          border-top: 1px solid;
          margin-top: -1px; /* border top width */
          position: absolute;
          top: 1em; /* (line-height/2) */
          left: 0;
        }

        .file-tree li:last-child:before {
          height: auto;
          top: 1em; /* (line-height/2) */
          bottom: 0;
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
