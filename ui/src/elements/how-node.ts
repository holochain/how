import {css, html, LitElement} from "lit";
import {property, query} from "lit/decorators.js";
import { consume } from '@lit/context';
import {sharedStyles} from "../sharedStyles";
import {Unit, DocType, howContext, Document, DocumentOutput, SysState, Progress, UnitFlags} from "../types";
import {HowStore} from "../how.store";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import { StoreSubscriber } from "@holochain-open-dev/stores";
import {unsafeHTML} from "lit/directives/unsafe-html.js";
import { aliveImage } from "../images";
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
    opacity?: string;
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
  @property() flags:string = "";
  @property() progress:Progress| undefined = undefined;

  @consume({ context: howContext })
  _store!: HowStore;

  circle(segments: Array<Segment>, cross?: boolean) {
    const width = 200
    const x = width/2
    const y = width/2
    const r = x*.75
    const svg = `
    <svg style="fill:none; stroke-width:30" width="100%" height="100%" viewbox="0 0 ${width} ${width}">
        ${segments.map((segment,i) => {
            return `<path style="stroke:${segment.color}";${segment.opacity?` stroke-opacity="${segment.opacity}"`:""} d=" ${arc(x,y,r,segment.start,segment.end)}"><title>${segment.title}</title></path>`
        }).join('')}
        ${cross ? '<path style="stroke:black; stroke-width:30" d=" M 40 40 l 120 120">' : ''}
    </svg>
    `
    return unsafeHTML(svg)
  }
  
  render() {
    if (!this.unit) {
      return;
    }
    if (this.state == SysState.Defunct) {
      return html`
      ${this.circle([
          {title:"Defunct", color:"#0c0c2e", start:0, end:360},
      ], true)}    
      `
  } else if (this.state) {
        const segments = []
        let i = 0;
        const sweep = 360/this.unit.processes.length
        const stateIndex = ORDER.indexOf(this.state)

        let currentState = ""
        let opacity = ""
        for (const [procType, procName] of this.unit.processes) {
            //const path = `${procType}.${procName}`
            const elems = procType.split(".")
            const typeName = elems[elems.length-1]
            //@ts-ignore
            const color: string = i > stateIndex ? "#ccc" : COLORS[typeName]
            if (this.state == typeName) {
                currentState = procName
                const start = sweep*i+.75
                const end = sweep*(i+1)-.75
                const len = end - start

                if (this.progress) {
                  const seg = len/this.progress.total
                  const progressText = `${procName}: ${this.progress.count} of ${this.progress.total}`

                  segments.push({title: progressText, color, start, end:start+ seg*this.progress.count })
                  segments.push({title: progressText, color:"#ccc", start: start+ seg*this.progress.count, end })

                } else {
                  // create a gradient because we don't know the progress
                  const seg = len/100
                  let o = 100;
                  for (let j= start; j <= end; j+=seg) {
                    segments.push({title:procName, opacity:`${o}%`, color, start:j, end:j+seg})
                    o-=1
                  }  
                }
            } else {
              segments.push({title:procName, color, start:sweep*i+.75, end:sweep*(i+1)-.75})
            }
            i+=1
        }
        
        if (this.state == SysState.Alive) {
          return html`
            <div class="${this.flags.includes(UnitFlags.Placeholder)?" placeholder":""}"><img src=${aliveImage}></div>
            `
        } else {
          return html`
            <div class="${this.flags.includes(UnitFlags.Placeholder)?" placeholder":""}">${this.circle(segments)}</div>
          `
        }
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
      img {
        width: 100%;
      }
      .placeholder {
        background-color: lightyellow;
        border-radius: 50%;
      }
      `,
    ];
  }
}


