import { Orchestrator } from "@holochain/tryorama";
import how from "./how";

let orchestrator = new Orchestrator();
how(orchestrator);
orchestrator.run();
/*
orchestrator = new Orchestrator()
require('./profile')(orchestrator)
orchestrator.run()
*/
