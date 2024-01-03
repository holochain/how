import {css, html, LitElement} from "lit";
import {property, query} from "lit/decorators.js";

import {sharedStyles} from "../sharedStyles";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {unsafeHTML} from "lit/directives/unsafe-html.js";
import {SVG} from "./svg-icons"


/**
 * @element svg-button
 */
export class SvgButton extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  @property() button: string = "";
  @property() info: string = "";
  @property() infoPosition: string = "left";
  @property() enabled = true;
  @property() click = ()=>{};

  handleClick(e:any) {
    if (this.enabled) {
      e.stopPropagation()
      this.click()
    }
  }
  render() {
    //@ts-ignore
    const svg = SVG[this.button]
    return html`
      <div class="button row" uselectable="on">
        ${this.info && this.infoPosition==="left" ? html`<div class="info-item-name">${this.info}</div>`:""}
        <div class="icon ${this.enabled ? '' : 'disabled'}" @click=${this.handleClick}> ${unsafeHTML(svg)}</div>
        ${this.info && this.infoPosition==="right" ? html`<div class="info-item-name">${this.info}</div>`:""}
      </div>
    `;
  }
  static get styles() {
    return [
      sharedStyles,
      css`
      .button {
        align-items: center;
        -khtml-user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
      }
      .icon:hover {
        background-color: #eee;
      }
      .icon {
        border-radius: 50%;
        display: flex;
        justify-content: space-around;
        padding: 3px;
        cursor: pointer;
      }
      .disabled {
        opacity: 30%;
        cursor: default;
      }
      .icon:hover.disabled  {
        background-color: transparent
      }
      .info-item-name {
        margin-right: 7px;
      }
      `,
    ];
  }
}
