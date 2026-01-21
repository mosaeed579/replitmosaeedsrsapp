import { LessonAttachment } from '@/types/lesson';
import { isNativePlatform } from '@/lib/platform';

/**
 * Load file content from localPath on-demand
 * Returns a usable URL (data URL or blob URL) for the file
 */
export const loadFileContent = async (
  attachment: LessonAttachment
): Promise<string | null> => {
  // If we already have a cached URL (web platform), return it
  if (attachment.url) {
    return attachment.url;
  }

  // On native, load from localPath
  if (!isNativePlatform() || !attachment.localPath) {
    console.warn('[loadFileContent] No localPath available for attachment:', attachment.name);
    return null;
  }

  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    
    // Extract relative path from full URI
    const relativePath = getRelativePathFromUri(attachment.localPath);
    
    const result = await Filesystem.readFile({
      path: relativePath,
      directory: Directory.Data,
    });

    // result.data is base64 string
    const base64 = result.data as string;
    const dataUrl = `data:${attachment.type};base64,${base64}`;
    
    console.log('[loadFileContent] Loaded file on-demand:', attachment.name);
    return dataUrl;
  } catch (error) {
    console.error('[loadFileContent] Failed to load file:', attachment.name, error);
    return null;
  }
};

/**
 * Extract relative path from full URI for Filesystem operations
 */
const getRelativePathFromUri = (uri: string): string => {
  // URI format: file:///data/user/0/app.lovable.xxx/files/attachments/filename.pdf
  // We need: attachments/filename.pdf
  const attachmentsIndex = uri.indexOf('attachments/');
  if (attachmentsIndex !== -1) {
    return uri.substring(attachmentsIndex);
  }
  return uri;
};

/**
 * Check if file exists at the given path
 */
export const checkFileExists = async (uri: string): Promise<boolean> => {
  if (!isNativePlatform() || !uri) return false;

  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const relativePath = getRelativePathFromUri(uri);
    await Filesystem.stat({
      path: relativePath,
      directory: Directory.Data,
    });
    return true;
  } catch {
    return false;
  }
};

/**
 * Create a blob URL from base64 data for efficient memory usage
 */
export const createBlobUrl = (base64Data: string, mimeType: string): string => {
  try {
    // Decode base64 to binary
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const blob = new Blob([bytes], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('[createBlobUrl] Failed:', error);
    return '';
  }
};

/**
 * Revoke a blob URL to free memory
 */
export const revokeBlobUrl = (url: string): void => {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

/**
 * Strip Base64 data from attachments for storage optimization
 * Only keeps metadata + localPath, removes url field on native
 */
export const stripAttachmentsForStorage = (
  attachments: LessonAttachment[]
): LessonAttachment[] => {
  if (!isNativePlatform()) {
    // On web, we need to keep URL since there's no filesystem
    return attachments;
  }

  // On native, strip the url field to save space in Preferences
  return attachments.map(att => ({
    id: att.id,
    name: att.name,
    type: att.type,
    size: att.size,
    localPath: att.localPath,
    // Explicitly omit url to reduce storage size
  }));
};
