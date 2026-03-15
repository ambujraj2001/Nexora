import { GraphState } from "../graphs/state";
import { generateEmbedding } from "../services/embedding.service";
import { supabase } from "../config/supabase";
import { log } from "../utils/logger";
import { debugGraphState } from "../utils/debugGraphState";

/**
 * graphMemoryNode: Retrieves relational context from the Knowledge Graph.
 * 1. Generates embedding for the user message.
 * 2. Finds relevant entities via vector search (RPC: match_entities).
 * 3. Fetches relationships for those entities.
 * 4. Produces a "GRAPH MEMORY" block for the LLM.
 */
export const graphMemoryNode = async (state: GraphState, config?: any) => {
  debugGraphState("graphMemoryNode_start", state);
  
  const onEvent = config?.configurable?.onEvent;
  const emit = (type: string, msg: string, status: string = 'info', data?: any) => {
    onEvent?.(type, msg, status, data);
  };

  const lastUserMessage = [...state.messages]
    .reverse()
    .find((m) => m._getType() === "human");

  if (!lastUserMessage) {
    return { graphMemoryContext: "" };
  }

  const query = lastUserMessage.content as string;
  const user = config?.configurable?.user || state.user;
  const userId = user.id;

  try {
    emit('graph_memory_started', 'Searching Knowledge Graph entities...', 'pending');

    // 1. Generate Embedding
    const queryEmbedding = await generateEmbedding(query);

    // 2. Match Entities via Semantic Search
    // Note: match_entities RPC must be defined in Supabase to handle VECTOR(768) or VECTOR(1024)
    const { data: entities, error: entityError } = await supabase.rpc("match_entities", {
      query_embedding: queryEmbedding,
      match_threshold: 0.6,
      match_count: 5,
      p_user_id: userId
    });

    if (entityError) {
      log({ event: "graph_memory_rpc_error", error: entityError.message });
      return { graphMemoryContext: "" };
    }

    if (!entities || entities.length === 0) {
      emit('graph_memory_completed', 'No relevant entities found in graph', 'info');
      return { graphMemoryContext: "" };
    }

    const entityIds = entities.map((e: any) => e.id);
    const entityNames = entities.map((e: any) => e.name).join(", ");
    emit('graph_entities_found', `Found relevant entities: ${entityNames}`, 'info');

    // 3. Query Relationships
    // We fetch relations where these entities are either source or target
    const { data: relationships, error: relError } = await supabase
      .from("relationships")
      .select(`
        relation,
        source:entities!source_entity_id(name),
        target:entities!target_entity_id(name)
      `)
      .or(`source_entity_id.in.(${entityIds.join(",")}),target_entity_id.in.(${entityIds.join(",")})`)
      .eq("user_id", userId);

    if (relError) {
      log({ event: "graph_memory_rel_error", error: relError.message });
      return { graphMemoryContext: "" };
    }

    if (!relationships || relationships.length === 0) {
      return { graphMemoryContext: "" };
    }

    // 4. Build Context String
    const facts = relationships.map((r: any) => {
      const source = r.source?.name || "Unknown";
      const target = r.target?.name || "Unknown";
      return `${source} ${r.relation} ${target}`;
    });

    // Remove duplicates
    const uniqueFacts = Array.from(new Set(facts));
    const context = `GRAPH MEMORY\n${uniqueFacts.join("\n")}`;

    emit('graph_memory_completed', `Retrieved ${uniqueFacts.length} relational facts`, 'success');

    return { 
      graphMemoryContext: context 
    };
  } catch (error) {
    log({ event: "graph_memory_unexpected_error", error: String(error) });
    return { graphMemoryContext: "" };
  }
};
