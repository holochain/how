import {css, html, LitElement} from "lit";
import {property, query, state} from "lit/decorators.js";

import {sharedStyles} from "../sharedStyles";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import { DocumentOutput } from "../types";
import { serializeHash } from "@holochain-open-dev/utils";
import { AgentAvatar } from "@holochain-open-dev/profiles";
/**
 * @element info-item
 */
export class HowComment extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  @property() comment: DocumentOutput | undefined;
  
  render() {
    if (this.comment) {
      return html` 
        <div class="comment">
            <agent-avatar agent-pub-key=${serializeHash(this.comment.actions[0].author)}> </agent-avatar>:
            ${this.comment.content.content[0].content}
          
        </div>`
    }
  }
  static get scopedElements() {
    return {
      "agent-avatar": AgentAvatar,
    };
  }
static get styles() {
    return [
      sharedStyles,
      css`
        .comment {
            border: solid 1px;
        }
      `,
    ];
  }
}
