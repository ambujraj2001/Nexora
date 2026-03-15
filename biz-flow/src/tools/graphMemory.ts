import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { supabase } from "../config/supabase";
import { generateEmbedding } from "../services/embedding.service";
import { findUserByAccessCode } from "../services/user.service";
import { log } from "../utils/logger";


const validateUser = async (accessCode: string) => {
  const user = await findUserByAccessCode(accessCode);
  if (!user) throw new Error("Invalid access code.");
  return user;
};

/**
 * syncGraphMemoryTool: Finds entities with NULL embeddings and populates them.
 */
export const syncGraphMemoryTool = tool(
  async ({ accessCode }: { accessCode: string }) => {
    try {
      const user = await validateUser(accessCode);
      
      // 1. Fetch entities missing embeddings
      const { data: missing, error: fetchError } = await supabase
        .from("entities")
        .select("id, name")
        .eq("user_id", user.id)
        .is("embedding", null);

      if (fetchError) throw fetchError;
      if (!missing || missing.length === 0) return "Graph memory is already fully synced.";

      let syncedCount = 0;
      for (const entity of missing) {
        const embedding = await generateEmbedding(entity.name);
        const { error: updateError } = await supabase
          .from("entities")
          .update({ embedding })
          .eq("id", entity.id);
        
        if (!updateError) syncedCount++;
      }

      return `Successfully synced ${syncedCount} entities. Your Graph Memory is now searchable!`;
    } catch (error: any) {
      log({ event: "sync_graph_failed", error: error.message });
      return `Error syncing graph: ${error.message}`;
    }
  },
  {
    name: "sync_graph_memory",
    description: "Generates missing embeddings for Knowledge Graph entities. Use this if vector search isn't finding newly inserted entities.",
    schema: z.object({
      accessCode: z.string().describe("The user access code."),
    }),
  }
);

/**
 * createGraphFactTool: Allows the AI to store new relational facts.
 */
export const createGraphFactTool = tool(
  async ({ accessCode, source, relation, target }: { accessCode: string; source: string; relation: string; target: string }) => {
    try {
      const user = await validateUser(accessCode);

      // Helper to get or create entity
      const getOrCreateEntity = async (name: string) => {
        const { data: existing } = await supabase
          .from("entities")
          .select("id")
          .eq("user_id", user.id)
          .ilike("name", name)
          .maybeSingle();

        if (existing) return existing.id;

        const embedding = await generateEmbedding(name);
        const { data: created, error } = await supabase
          .from("entities")
          .insert({
            user_id: user.id,
            name,
            type: "concept",
            embedding
          })
          .select("id")
          .single();

        if (error) throw error;
        return created.id;
      };

      const sourceId = await getOrCreateEntity(source);
      const targetId = await getOrCreateEntity(target);

      const { error: relError } = await supabase
        .from("relationships")
        .insert({
          user_id: user.id,
          source_entity_id: sourceId,
          relation,
          target_entity_id: targetId
        });

      if (relError) throw relError;

      return `Fact stored: ${source} --(${relation})--> ${target}`;
    } catch (error: any) {
      return `Error storing graph fact: ${error.message}`;
    }
  },
  {
    name: "create_graph_fact",
    description: "Store a new relational fact in the Knowledge Graph. Example: source='User', relation='goes_to', target='Gym'",
    schema: z.object({
      accessCode: z.string(),
      source: z.string().describe("The subject of the fact"),
      relation: z.string().describe("The relationship verb/label"),
      target: z.string().describe("The object of the fact"),
    }),
  }
);
