import fs from 'fs/promises';
import path from 'path';
import { ref, uploadBytes, listAll, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';

type StorageType = 'local' | 'firebase';

interface FileData {
  fileName: string;
  filePath: string;
  url?: string;
}

const getStorageType = (): StorageType => {
  const st = process.env.NODE_ENV === 'production' ? 'firebase' : 'local';
  console.log('Storage type: ', st);
  return st;
  // return (process.env.NEXT_PUBLIC_STORAGE_TYPE as StorageType) || 'local';
};

// Local storage functions
const getFilesDirFullPath = (dirName: string) => {
  return path.join(process.cwd(), 'public', dirName);
};

const ensureUploadDir = async (dirName: string) => {
  try {
    const dirPath = getFilesDirFullPath(dirName);
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directory:', error);
    throw error;
  }
};

// Firebase storage functions
const getFirebaseRef = (dirName: string, fileName: string = '') => {
  const filePath = fileName ? `${dirName}/${fileName}` : dirName;
  return ref(storage, filePath);
};

// Get files from either local or Firebase storage
export const getFiles = async (dirName: string): Promise<FileData[]> => {
  const storageType = getStorageType();

  if (storageType === 'firebase') {
    try {
      const listRef = getFirebaseRef(dirName);
      const res = await listAll(listRef);
      
      const files = await Promise.all(
        res.items.map(async (itemRef) => {
          const url = await getDownloadURL(itemRef);
          return {
            fileName: itemRef.name,
            filePath: `${dirName}/${itemRef.name}`,
            url
          };
        })
      );
      
      return files;
    } catch (error) {
      console.error('Error reading files from Firebase:', error);
      throw error;
    }
  } else {
    // Local storage
    try {
      const filesDirFullPath = getFilesDirFullPath(dirName);
      await ensureUploadDir(dirName);
      const files = await fs.readdir(filesDirFullPath);
      return files.map(fileName => ({
        fileName,
        filePath: `/${dirName}/${fileName}`,
        url: `/${dirName}/${fileName}`
      }));
    } catch (error) {
      console.error('Error reading local files:', error);
      throw error;
    }
  }
};

export const saveFile = async (dirName: string, file: File): Promise<FileData> => {
  const storageType = getStorageType();
  
  if (storageType === 'firebase') {
    try {
      const storageRef = getFirebaseRef(`${dirName}/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      
      return {
        fileName: file.name,
        filePath: `${dirName}/${file.name}`,
        url
      };
    } catch (error) {
      console.error('Error saving file to Firebase:', error);
      throw error;
    }
  } else {
    // Local storage
    try {
      const filesDirFullPath = getFilesDirFullPath(dirName);
      await ensureUploadDir(dirName);
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filePath = path.join(filesDirFullPath, file.name);

      // Use 'wx' flag to fail if the file already exists
      await fs.writeFile(filePath, buffer, { flag: 'wx' });

      return {
        fileName: file.name,
        filePath: `/${dirName}/${file.name}`,
        url: `/${dirName}/${file.name}`
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
        throw new Error('File already exists');
      }
      console.error('Error saving file locally:', error);
      throw error;
    }
  }
};

// Delete file from either local or Firebase storage
export const deleteFile = async (dirName: string, fileName: string): Promise<boolean> => {
  const storageType = getStorageType();
  
  if (storageType === 'firebase') {
    try {
      const fileRef = getFirebaseRef(`${dirName}/${fileName}`);
      await deleteObject(fileRef);
      return true;
    } catch (error) {
      console.error('Error deleting file from Firebase:', error);
      throw error;
    }
  } else {
    // Local storage
    try {
      const filesDirFullPath = getFilesDirFullPath(dirName);
      const filePath = path.join(filesDirFullPath, fileName);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting local file:', error);
      throw error;
    }
  }
};