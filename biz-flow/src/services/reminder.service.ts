import { supabase } from "../config/supabase";

export const findReminderByTitle = async (userId: string, title: string) => {
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("user_id", userId)
    .ilike("title", title)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
};

export interface ReminderRow {
  id?: string;
  user_id: string;
  title: string;
  remind_at?: string;
  remind_at_timestamp?: number;
  status?: string;
  created_at_timestamp?: number;
}

export const getUserReminders = async (userId: string) => {
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("user_id", userId)
    .order("remind_at_timestamp", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const addReminder = async (reminder: ReminderRow) => {
  const remindAtTs =
    reminder.remind_at_timestamp ??
    (reminder.remind_at ? Date.parse(reminder.remind_at) : undefined);
  const now = Date.now();

  const { data, error } = await supabase
    .from("reminders")
    .insert([
      {
        ...reminder,
        remind_at_timestamp: remindAtTs,
        created_at_timestamp: reminder.created_at_timestamp ?? now,
      },
    ])
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const updateReminder = async (
  reminderId: string,
  userId: string,
  updates: Partial<ReminderRow>,
) => {
  const payload: Partial<ReminderRow> = { ...updates };
  if (updates.remind_at && !updates.remind_at_timestamp) {
    payload.remind_at_timestamp = Date.parse(updates.remind_at);
  }

  const { data, error } = await supabase
    .from("reminders")
    .update(payload)
    .eq("id", reminderId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const deleteReminder = async (reminderId: string, userId: string) => {
  const { data, error } = await supabase
    .from("reminders")
    .delete()
    .eq("id", reminderId)
    .eq("user_id", userId)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error(
      `Reminder with ID ${reminderId} not found or permission denied.`,
    );
  }

  return true;
};

export const getDueReminders = async () => {
  const now = Date.now();
  // Fetch active reminders where remind_at is in the past
  const { data, error } = await supabase
    .from("reminders")
    .select("*, users(email, full_name)")
    .eq("status", "active")
    .lte("remind_at_timestamp", now);

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};
