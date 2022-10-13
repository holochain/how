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
  @property() state:string = "";

  @contextProvided({ context: howContext })
  _store!: HowStore;

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
    if (this.state) {
        const processes = []
        let i = 0;
        const sweep = 360/this.unit.processes.length
        const stateIndex = ORDER.indexOf(this.state)

        let currentState = ""
        for (const [procType, procName] of this.unit.processes) {
            //const path = `${procType}.${procName}`
            const elems = procType.split(".")
            const typeName = elems[elems.length-1]
            //@ts-ignore
            const color: string = i > stateIndex ? "#ccc" : COLORS[typeName]
            if (this.state == typeName) {
                currentState = procName
            }
            processes.push(
                {title:procName, color, start:sweep*i+.75, end:sweep*(i+1)-.75}
            )
            i+=1
        } 
        return html`
        <div class="circle">${this.circle(processes)}</div>
        `

    } else {    
        return html`
        ${this.circle([
            {title:"Not Defined", color:"#ccc", start:0, end:360},
        ])}    
        `
    }
  }

  static get styles() {
    return [
      sharedStyles,
      css`
      `,
    ];
  }
}