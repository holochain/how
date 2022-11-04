import {css, html, LitElement} from "lit";
import {property, query} from "lit/decorators.js";

import {sharedStyles} from "../sharedStyles";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";

/**
 * @element info-item
 */
export class InfoItem extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  @property() size: string = "";
  @property() item: string = "";
  @property() name: string = "";
  @property() title: string = "";
  @property() layout: string = "column";
  @property() click = ()=>{};


  render() {
    return html`
        <div class="info ${this.layout}">
        <div style=${this.size ? `font-size:${this.size};`:''} .title=${this.title} class="info-item">${this.item}</div><div class="info-item-name">${this.name}</div>
        </div>
    `;
  }
  static get styles() {
    return [
      sharedStyles,
      css`
        .info {
          margin-bottom: 12px;
        }
      `,
    ];
  }
}
