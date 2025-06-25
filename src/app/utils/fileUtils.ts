import fs from 'fs/promises';
import path from 'path';

interface FileData {
  fileName: string;
  filePath: string;
}

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

export const getFiles  = async (dirName: string): Promise<FileData[]> => {
  try {
    const filesDirFullPath = getFilesDirFullPath(dirName);
    await ensureUploadDir(filesDirFullPath);
    const files = await fs.readdir(filesDirFullPath);
    return files.map(fileName => ({
      fileName,
      filePath: `/${dirName}/${fileName}`
    }));
  } catch (error) {
    console.error('Error reading files:', error);
    throw error;
  }
};

export const saveFile = async (dirName: string, file: File): Promise<FileData> => {
  try {
    const filesDirFullPath = getFilesDirFullPath(dirName);
    await ensureUploadDir(filesDirFullPath);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(filesDirFullPath, file.name);

    // Use 'wx' flag to fail if the file already exists
    await fs.writeFile(filePath, buffer, { flag: 'wx' });

    return {
      fileName: file.name,
      filePath: `/${dirName}/${file.name}`
    };
  } catch (error: any) {
    if (error.code === 'EEXIST') {
      throw new Error('File already exists');
    }
    console.error('Error saving file:', error);
    throw error;
  }
};

export const deleteFile = async (dirName: string, fileName: string): Promise<boolean> => {
  try {
    const filesDirFullPath = getFilesDirFullPath(dirName);
    const filePath = path.join(filesDirFullPath, fileName);
    await fs.unlink(filePath);
    return true
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};