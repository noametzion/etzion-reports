import fs from 'fs/promises';
import path from 'path';
import { bucket } from '../config/firebase-admin';

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
const getFileRef = (dirName: string, fileName: string = '') => {
  const filePath = fileName ? `${dirName}/${fileName}` : dirName;
  return bucket.file(filePath);
};

// Get files from either local or Firebase storage
export const getFiles = async (dirName: string): Promise<FileData[]> => {
  const storageType = getStorageType();

  if (storageType === 'firebase') {
    try {
      const [files] = await bucket.getFiles({
        prefix: dirName,
        autoPaginate: false
      });

      const filePromises = files.map(async (file) => {
        // Skip directories
        if (file.name.endsWith('/')) return null;
        
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: '03-01-2500' // Far future expiration
        });

        const fileName = file.name.split('/').pop() || '';
        return {
          fileName,
          filePath: file.name,
          url
        };
      });

      const resolvedFiles = await Promise.all(filePromises);
      return resolvedFiles.filter(Boolean) as FileData[];
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

// Save file to either local or Firebase storage
export const saveFile = async (dirName: string, file: File): Promise<FileData> => {
  const storageType = getStorageType();
  
  if (storageType === 'firebase') {
    try {
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const filePath = `${dirName}/${file.name}`;
      const fileRef = getFileRef(dirName, file.name);
      
      // Check if file exists
      const [exists] = await fileRef.exists();
      if (exists) {
        throw new Error('File already exists');
      }
      
      await fileRef.save(fileBuffer, {
        metadata: {
          contentType: file.type,
        },
      });
      
      // Make the file publicly accessible
      await fileRef.makePublic();
      
      // Get the public URL
      const url = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
      
      return {
        fileName: file.name,
        filePath,
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
      const fileRef = getFileRef(dirName, fileName);
      await fileRef.delete();
      return true;
    } catch (error) {
      // If file doesn't exist, we can consider it deleted
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((error as any).code === 404) {
        return true;
      }
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