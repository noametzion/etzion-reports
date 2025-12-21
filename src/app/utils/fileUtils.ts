import fs from 'fs/promises';
import path from 'path';
import { getFirebaseAdmin } from '../config/firebase-admin';

const admin = getFirebaseAdmin();

type StorageType = 'local' | 'firebase';

interface FileData {
  fileName: string;
  filePath: string;
  isLocal: boolean;
}

const getStorageType = (): StorageType => {
  const st = process.env.NODE_ENV === 'production' ? 'firebase' : 'local';
  console.log('Storage type: ', st);
  return st;
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
  return admin.storage().bucket().file(filePath);
};

// Get files from either local or Firebase storage
export const getFiles = async (dirName: string): Promise<FileData[]> => {
  const storageType = getStorageType();

  if (storageType === 'firebase') {
    try {
      const [files] = await admin.storage().bucket().getFiles({
        prefix: dirName,
        autoPaginate: false
      });

      const filePromises = files.map(async (file) => {
        // Skip directories
        if (file.name.endsWith('/')) return null;

        const fileName = file.name.split('/').pop() || '';
        return {
          fileName,
          filePath: file.name,
          isLocal: false
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
        isLocal: true
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
      
      return {
        fileName: file.name,
        filePath,
        isLocal: false
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
        isLocal: true
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