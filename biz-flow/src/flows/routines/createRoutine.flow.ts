import { IFlow, FlowContext, FlowResult, FlowSession } from "../types";

export class CreateRoutineFlow implements IFlow {
  id = "create_routine";
  version = 1;
  priority = 110;

  match(message: string): boolean {
    const patterns = [
      /create.*routine/i,
      /add.*routine/i,
      /new.*routine/i,
      /schedule.*routine/i
    ];
    return patterns.some(regex => regex.test(message));
  }

  async execute(context: FlowContext, session?: FlowSession): Promise<FlowResult> {
    const message = context.parameters.originalMessage || "";
    
    // Routines are complex (name, instruction, cron). 
    // If the message is just a simple "create routine", 
    // it's better to let the Agent handle it via conversation to gather all details.
    
    // However, if they provide something semi-structured like "create routine 'daily sync' at 9am to check email"
    // we could try to parse, but it's risky for routines.
    
    // We'll fallback to the agent for creation to ensure high quality cron expressions 
    // and comprehensive instructions.
    
    context.logger.info("Create routine intent matched, delegating to agent for detailed extraction", { message });
    return { type: "fallback" };
  }
}

export const createRoutineFlow = new CreateRoutineFlow();
