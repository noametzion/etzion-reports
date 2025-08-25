import { NextResponse } from 'next/server';
import { getFiles, saveFile, deleteFile } from '@/app/utils/fileUtils';
import { NextRequest } from 'next/server';

const FILES_CATEGORY = process.env.EDITED_SURVEYS_FOLDER as string;
const EDITED_FILE_NAME_FORMAT = (originalFileName: string) => `${originalFileName}_edited`;

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    const originalFileName = params.get("originalFileName");
    if (!originalFileName) {
      return NextResponse.json(
          { error: 'Original file name is required' },
          { status: 400 }
      );
    }

    const files = await getFiles(FILES_CATEGORY);
    const editedFileName = EDITED_FILE_NAME_FORMAT(originalFileName);
    const editedFile = files.find(file => file.fileName === editedFileName);
    return NextResponse.json({
      file: editedFile ? {
        ...editedFile,
        originalFileName
      } : null
    });
  } catch (error) {
    console.error('Error fetching file:', error);
    return NextResponse.json(
      { error: 'Failed to fetch file' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();

    const originalFileName = formData.get('originalFileName') as string;
    if (!originalFileName || originalFileName.trim() === '') {
      return NextResponse.json(
          { error: 'Original file name is required' },
          { status: 400 }
      );
    }

    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const editedFileName = EDITED_FILE_NAME_FORMAT(originalFileName);

    const existingFile = await getFiles(FILES_CATEGORY).then(files => files.find(file => file.fileName === editedFileName));
    if (existingFile) {
      await deleteFile(FILES_CATEGORY, editedFileName);
    }

    const { fileName, filePath } = await saveFile(FILES_CATEGORY, file);

    return NextResponse.json({
      success: true,
      originalFileName,
      fileName,
      filePath
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');

    if (!fileName) {
      return NextResponse.json(
        { error: 'File name is required' },
        { status: 400 }
      );
    }

    await deleteFile(FILES_CATEGORY, fileName);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
