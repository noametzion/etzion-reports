import fs from 'fs/promises';
import path from 'path';

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

export const getFiles  = async (dirName: string): Promise<string[]> => {
  try {
    const filesDirFullPath = getFilesDirFullPath(dirName);
    await ensureUploadDir(filesDirFullPath);
    const files = await fs.readdir(filesDirFullPath);
    return files;
  } catch (error) {
    console.error('Error reading files:', error);
    throw error;
  }
};

export const saveFile = async (dirName: string, file: File): Promise<{ fileName: string; filePath: string }> => {
  try {
    const filesDirFullPath = getFilesDirFullPath(dirName);
    await ensureUploadDir(filesDirFullPath);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(filesDirFullPath, file.name);

    await fs.writeFile(filePath, buffer);
    return {
      fileName: file.name,
      filePath: `/${dirName}/${file.name}`
    };
  } catch (error) {
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