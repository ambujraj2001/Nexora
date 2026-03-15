import { supabase } from "../config/supabase";

export const findTaskByTitle = async (userId: string, title: string) => {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .ilike("title", title)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
};

export interface TaskRow {
  id?: string;
  user_id: string;
  title: string;
  status?: string;
  priority?: string;
  due_date?: string | null;
  due_date_timestamp?: number | null;
  created_at_timestamp?: number;
}

export const getUserTasks = async (userId: string) => {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("due_date_timestamp", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const addTask = async (task: TaskRow) => {
  const now = Date.now();
  const dueTs =
    task.due_date_timestamp ??
    (task.due_date ? Date.parse(task.due_date) : null);
  const { data, error } = await supabase
    .from("tasks")
    .insert([
      {
        ...task,
        due_date_timestamp: dueTs,
        created_at_timestamp: task.created_at_timestamp ?? now,
      },
    ])
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const updateTask = async (
  taskId: string,
  userId: string,
  updates: Partial<TaskRow>,
) => {
  const payload: Partial<TaskRow> = { ...updates };
  if (updates.due_date && !updates.due_date_timestamp) {
    payload.due_date_timestamp = Date.parse(updates.due_date);
  }
  const { data, error } = await supabase
    .from("tasks")
    .update(payload)
    .eq("id", taskId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const deleteTask = async (taskId: string, userId: string) => {
  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", userId)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error(`Task with ID ${taskId} not found or permission denied.`);
  }

  return true;
};
