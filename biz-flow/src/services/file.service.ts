import { supabase } from "../config/supabase";
import { FileRow } from "../types/file.types";
import mammoth from "mammoth";

const BUCKET_NAME = "files";

/**
 * Uploads a file to Supabase Storage and saves metadata to the database.
 */
export const uploadFile = async (
  userId: string,
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string,
): Promise<FileRow> => {
  let finalBuffer = fileBuffer;
  let finalMimeType = mimeType;
  let finalFileName = fileName;

  const lowName = fileName.toLowerCase();

  // 0. Pre-convert DOCX to text if needed
  if (lowName.endsWith(".docx")) {
    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      finalBuffer = Buffer.from(result.value);
      finalMimeType = "text/plain";
      // Replace extension with .txt
      finalFileName = fileName.replace(/\.docx$/i, ".txt");
      if (!finalFileName.toLowerCase().endsWith(".txt")) {
        finalFileName += ".txt";
      }
    } catch (err: any) {
      throw new Error(`Failed to process Word file into text: ${err.message}`);
    }
  }

  // 1. Upload to Supabase Storage
  // We use a unique path to avoid collisions: userId/timestamp-fileName
  const filePath = `${userId}/${Date.now()}-${finalFileName}`;

  const { data: storageData, error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, finalBuffer, {
      contentType: finalMimeType,
      upsert: true,
    });

  if (storageError) {
    throw new Error(`Storage error: ${storageError.message}`);
  }

  // 2. Get Public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

  // 3. Save metadata to DB
  const { data: dbData, error: dbError } = await supabase
    .from("files")
    .insert({
      user_id: userId,
      file_name: finalFileName,
      file_url: publicUrl,
    })
    .select("*")
    .single();

  if (dbError) {
    // Cleanup storage if DB insert fails
    await supabase.storage.from(BUCKET_NAME).remove([filePath]);
    throw new Error(`Database error: ${dbError.message}`);
  }

  return dbData as FileRow;
};

/**
 * Lists all files for a specific user.
 */
export const getUserFiles = async (userId: string): Promise<FileRow[]> => {
  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("user_id", userId)
    .order("created_at_timestamp", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as FileRow[];
};

/**
 * Deletes a file from both DB and Storage.
 */
export const deleteFile = async (
  userId: string,
  fileId: string,
): Promise<void> => {
  // 1. Get file info to find storage path
  const { data: file, error: fetchError } = await supabase
    .from("files")
    .select("*")
    .eq("id", fileId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !file) {
    throw new Error("File not found or unauthorized");
  }

  // Extract storage path from public URL
  // publicUrl format: .../storage/v1/object/public/files/userId/timestamp-fileName
  // We need: userId/timestamp-fileName
  const urlParts = file.file_url.split(`${BUCKET_NAME}/`);
  const storagePath = urlParts[1];

  if (!storagePath) {
    throw new Error("Could not determine storage path");
  }

  // 2. Remove from Storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([storagePath]);

  if (storageError) {
    throw new Error(`Storage delete error: ${storageError.message}`);
  }

  // 3. Remove from DB
  const { error: dbError } = await supabase
    .from("files")
    .delete()
    .eq("id", fileId)
    .eq("user_id", userId);

  if (dbError) {
    throw new Error(`Database delete error: ${dbError.message}`);
  }
};

/**
 * Gets a specific file by ID.
 */
export const getFileById = async (
  userId: string,
  fileId: string,
): Promise<FileRow> => {
  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("id", fileId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw new Error("File not found or unauthorized");
  }

  return data as FileRow;
};
