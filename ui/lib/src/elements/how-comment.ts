import {css, html, LitElement} from "lit";
import {property, query, state} from "lit/decorators.js";

import {sharedStyles} from "../sharedStyles";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
/**
 * @element info-item
 */
export class HowComment extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  @property() comment: string | undefined;
  
  render() {
    if (this.comment) {
      return html` 
        <div class="comment">
            ${this.comment}
        </div>`
    }
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
