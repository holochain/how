import {css, html, LitElement} from "lit";
import {property, query, state} from "lit/decorators.js";

import { StoreSubscriber } from '@holochain-open-dev/stores';

import {sharedStyles} from "../sharedStyles";
import {Node, howContext, UnitInfo} from "../types";
import {HowStore} from "../how.store";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {ProfilesStore, profilesStoreContext,} from "@holochain-open-dev/profiles";
import {
  Button, 
} from "@scoped-elements/material-web";
import { HowNode } from "./how-node";
import { EntryHashB64, encodeHashToBase64 } from "@holochain/client";
//import {Button, Dialog, TextField, Fab, Slider} from "@scoped-elements/material-web";
import { consume } from '@lit-labs/context';

/**
 * @element how-tree
 */
export class HowTree extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }
  // TODO: distinguis between different Units selected at the same node
  @property() currentNode = "";
  @property() treeType = "tree";

  @consume({ context: howContext, subscribe: true })
  _store!: HowStore;

  @consume({ context: profilesStoreContext, subscribe: true })
  _profiles!: ProfilesStore;


  _tree = new StoreSubscriber(this, () => this._store.tree);
  _units = new StoreSubscriber(this, () => this._store.units);
  _documents = new StoreSubscriber(this, () => this._store.documents);

  select(id: EntryHashB64) : void {
    this.currentNode = id
    this.dispatchEvent(new CustomEvent('node-selected', { detail: id, bubbles: true, composed: true }));
  }

  getUnitInfo(node: Node) : UnitInfo | undefined {
    return node.val.units[0]
  }

  buildTree(node: Node):any {
    const unitInfo = this.getUnitInfo(node)
    const nodeId = unitInfo ? encodeHashToBase64(unitInfo.hash) : node.id
    const documentsMap = this._documents.value
   // const docs = node.val.documents.map(hash => documentsMap[encodeHashToBase64(hash)])
    const state = node.val.units.length ? node.val.units[0].state : ""// docs[docs.length-1]? docs[docs.length-1].state : ""
    return html`
    <li class="${this.treeType}">
      <span class="${nodeId == this.currentNode ? "current" : ""}" @click=${()=>this.select(nodeId)}>
        <div class="progress" title=${`document count: ${node.val.documents.length}`}>
          <how-node .unit=${this._units.value[nodeId]} state=${state}> </how-node>
        </div>
        ${node.id=="0" ? this._store.treeName : node.val.name}
        <!-- <mwc-button icon="add_circle" @click=${
          () => this.dispatchEvent(new CustomEvent('add-child', { detail: nodeId, bubbles: true, composed: true }))}>
          </mwc-button> -->
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
      .progress {
        width: 50px;
        margin: auto;
      }
      .file-tree .progress {
        width: 20px;
        display: inline-block;
        vertical-align: middle;
      }
      mwc-button {
        width: 30px;
      }
      .file-tree mwc-button {
        height: 0px;
      }
      .file-tree span.current {
        border-radius: 7%;
        box-shadow: rgba(102, 102, 102, 0.7) 0px 0px 0px 3px inset;
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
        .file-tree span {
          display: inline-block;
          cursor: pointer;
          padding: 2px;
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
          line-height: 1em;
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
  box-shadow: inset 0px 0px 0px 3px #666;
}
/* .tree span {
  background-color: white;
} */
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
            border-radius: 1em;
            display: inline-block;
            margin: 0 .2em .5em;
            padding: .3em .5em;
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
