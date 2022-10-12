import {css, html, LitElement} from "lit";
import {property, query} from "lit/decorators.js";
import { contextProvided } from "@lit-labs/context";
import {sharedStyles} from "../sharedStyles";
import {EntryHashB64, AgentPubKeyB64} from "@holochain-open-dev/core-types";
import { deserializeHash } from "@holochain-open-dev/utils";
import {Unit, DocType, howContext, Document, DocumentOutput} from "../types";
import {HowStore} from "../how.store";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import { StoreSubscriber } from "lit-svelte-stores";
import {unsafeHTML} from "lit/directives/unsafe-html.js";

const angleInRadians = (angleInDegrees: number) => (angleInDegrees - 90) * (Math.PI / 180.0);

const polarToCartesian = (centerX:number, centerY:number, radius:number, angleInDegrees:number) => {
    const a = angleInRadians(angleInDegrees);
    return {
        x: centerX + (radius * Math.cos(a)),
        y: centerY + (radius * Math.sin(a)),
    };
};

const arc = (x:number, y:number, radius:number, startAngle:number, endAngle:number) => {
    const fullCircle = endAngle - startAngle === 360;
    const start = polarToCartesian(x, y, radius, endAngle - 0.01);
    const end = polarToCartesian(x, y, radius, startAngle);
    const arcSweep = endAngle - startAngle <= 180 ? '0' : '1';

    const d = [
        'M', start.x, start.y,
        'A', radius, radius, 0, arcSweep, 0, end.x, end.y,
    ];

    if (fullCircle) d.push('z');
    return d.join(' ');
};

interface Segment {
    title: string;
    color: string;
    start: number;
    end: number;
}
const COLORS = {"define":"#65DAD2", "refine":"#9F4EE8", align:"#402ADA"}
const ORDER = ['define', 'refine', 'align','_alive']
/**
 * @element how-node
 */
export class HowNode extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }
  @property() unit:Unit|undefined;
  @property() documents:DocumentOutput[]|undefined;

  @contextProvided({ context: howContext })
  _store!: HowStore;
  _documents = new StoreSubscriber(this, () => this._store.documents);

  circle(segments: Array<Segment>) {
    const width = 200
    const x = width/2
    const y = width/2
    const r = x*.75
    const svg = `
    <svg style="fill:none; stroke-width:30" width="100%" height="100%" viewbox="0 0 ${width} ${width}">
        ${segments.map((segment,i) => {
            return `<path style="stroke:${segment.color};" d=" ${arc(x,y,r,segment.start,segment.end)}"><title>${segment.title}</title></path>`
        }).join('')}
    </svg>
    `
    return unsafeHTML(svg)
  }
  
  render() {
    if (!this.unit) {
      return;
    }
    if (this.documents) {
        const doc: Document = this.documents[this.documents.length-1].content
        const docOutput: DocumentOutput = this.documents[this.documents.length-1]
        const processes = []
        let i = 0;
        const sweep = 360/this.unit.processes.length
        const stateIndex = ORDER.indexOf(doc.state)

        let currentState = ""
        for (const [procType, procName] of this.unit.processes) {
            //const path = `${procType}.${procName}`
            const elems = procType.split(".")
            const typeName = elems[elems.length-1]
            //@ts-ignore
            const color: string = i > stateIndex ? "#ccc" : COLORS[typeName]
            if (doc.state == typeName) {
                currentState = procName
            }
            processes.push(
                {title:procName, color, start:sweep*i+.5, end:sweep*(i+1)-.5}
            )
            i+=1
        } 
        const state = doc.state == '_alive'? 
            html`<div class="info-item">4/18/22<div class="info-item-name">completion time</div></div>` : 
            html`<div class="info-item">${currentState}<div class="info-item-name">state: ${doc.state}</div></div>`
        return html`
        <div class="circle">${this.circle(processes)}</div>
        <div class="state">
            ${state}
        </div>
        `

    } else {
        const width = 200
        const x = width/2
        const y = width/2
        const r = x*.75
    
        return html`
        <div>${this.unit.shortName}</div>
        ${this.circle([
            {title:"x", color:"#ccc", start:0, end:360},
        ])}    
        `
    }
    // const processes = []
    // for (const [procType, procName] of this.unit.processes) {
    //     const path = `${procType}.${procName}`
    //     const elems = procType.split(".")
    //     const typeName = elems[elems.length-1]
    //     processes.push(html`<p>${typeName}: <span class="node-link" @click=${()=>this.handleNodelink(path)}>${procName}</span></p>`)
    //     } 
  }

//   static get scopedElements() {
//     return {
//       "how-document-dialog": HowDocumentDialog,
//     };
//   }
  static get styles() {
    return [
      sharedStyles,
      css`

      `,
    ];
  }
}