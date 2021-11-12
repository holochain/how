import {css, html, LitElement} from "lit";
import {unsafeHTML} from "lit/directives/unsafe-html.js";
import {property, query} from "lit/decorators.js";

import {contextProvided} from "@lit-labs/context";
import {StoreSubscriber} from "lit-svelte-stores";

import {sharedStyles} from "../sharedStyles";
import {Node, howContext} from "../types";
import {HowStore} from "../how.store";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {ProfilesStore, profilesStoreContext,} from "@holochain-open-dev/profiles";
import { CytoscapeDagre } from '@scoped-elements/cytoscape';
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
 
  select(id: string) : void {
    this.currentNode = id
  }
  buildTree(node: Node):any {
    return html`<li><span class="${node.id == this.currentNode ? "current" : ""}"} @click=${()=>this.select(node.id)}>${node.val}</span>
    ${node.children.length>0 ? html`<ul>${node.children.map(n => this.buildTree(n))}</ul>` :html``}
    </li>`
}
  render() {
    return html`<ul class="tree">${this.buildTree(this._tree.value)}</ul>`
  }


  static get scopedElements() {
    return {
        'cytoscape-dagre': CytoscapeDagre,
    };
  }
  static get styles() {
    return [
      sharedStyles,
      css`
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
    background-color: red;
}
    .tree li {
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
                top: -.5em;import {}

    }
`,
    ];
  }
}
