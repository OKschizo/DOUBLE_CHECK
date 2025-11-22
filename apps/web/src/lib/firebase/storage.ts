import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';

/**
 * Upload an image to Firebase Storage
 * @param file - The file to upload
 * @param path - Storage path (e.g., 'cast/projectId/filename.jpg')
 * @returns The download URL of the uploaded file
 */
export const uploadImage = async (file: File, path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
};

/**
 * Delete an image from Firebase Storage
 * @param url - The full download URL of the image
 */
export const deleteImage = async (url: string): Promise<void> => {
  try {
    // Extract the path from the URL
    // Firebase Storage URLs are in format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?alt=media&token={token}
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)/);
    
    if (!pathMatch) {
      throw new Error('Invalid storage URL');
    }
    
    const encodedPath = pathMatch[1];
    const decodedPath = decodeURIComponent(encodedPath);
    
    const storageRef = ref(storage, decodedPath);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw - we don't want to fail the operation if image deletion fails
  }
};

/**
 * Generate a unique filename for an uploaded image
 * @param originalFilename - The original filename
 * @returns A unique filename with timestamp
 */
export const generateUniqueFilename = (originalFilename: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalFilename.split('.').pop() || 'jpg';
  return `${timestamp}-${randomString}.${extension}`;
};

/**
 * Check if a URL is a Firebase Storage URL
 * @param url - The URL to check
 * @returns true if it's a Firebase Storage URL
 */
export const isFirebaseStorageUrl = (url: string): boolean => {
  return url.includes('firebasestorage.googleapis.com');
};

/**
 * Check if a URL is a local blob URL
 * @param url - The URL to check
 * @returns true if it's a blob URL
 */
export const isBlobUrl = (url: string): boolean => {
  return url.startsWith('blob:');
};

