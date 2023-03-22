import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { localized, msg } from '@lit/localize';
import { sharedStyles } from '@holochain-open-dev/elements';


@localized()
@customElement('how-applet-main')
export class HowAppletMain extends LitElement {
  @state() _loading = true;


  render() {
    return html`FIXME!`

  }

  static styles = [
    css`
      :host {
        display: flex;
        flex: 1;
      }
    `,
    sharedStyles,
  ];
}
