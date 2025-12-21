import { NextResponse } from 'next/server';
import { getFiles, saveFile, deleteFile } from '@/app/utils/fileUtils';
import { NextRequest } from 'next/server';
import {authErrorToResponse, requireRole} from "@/app/api/utils/authz";

const FILES_CATEGORY = process.env.SURVEYS_FOLDER as string;
const EDITED_FILE_NAME_FORMAT = (originalFileName: string) => `${originalFileName}_edited`;

export async function GET(request: NextRequest) {
  try {
    await requireRole(request);
    const files = await getFiles(FILES_CATEGORY);
    // process.env.NODE_ENV
    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error fetching files:', error);
    const authRes = authErrorToResponse(error);
    return authRes ? authRes : NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request);
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const { fileName, filePath, isLocal } = await saveFile(FILES_CATEGORY, file);

    return NextResponse.json({
      success: true,
      fileName,
      filePath,
      isLocal
    });
  } catch (error) {
    if ((error as Error).message === 'File already exists') {
      return NextResponse.json(
        { error: 'File with this name already exists' },
        { status: 409 } // Conflict
      );
    }
    console.error('Error uploading file:', error);
    const authRes = authErrorToResponse(error);
    return authRes ? authRes : NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireRole(request);
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');

    if (!fileName) {
      return NextResponse.json(
        { error: 'File name is required' },
        { status: 400 }
      );
    }

    await deleteFile(FILES_CATEGORY, fileName);
    
    // Also delete the corresponding edited survey file if it exists
    try {
      const editedFileName = EDITED_FILE_NAME_FORMAT(fileName);
      console.log("OR ", request.nextUrl.origin);
      const editedSurveyResponse = await fetch(
        `${request.nextUrl.origin}/api/editedSurveys?fileName=${encodeURIComponent(editedFileName)}`,
        {
          method: 'DELETE'
        }
      );

      if (!editedSurveyResponse.ok) {
        console.warn('Failed to delete edited survey file, but original file was deleted');
      }
    } catch (error) {
      console.error('Error deleting edited survey file:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    const authRes = authErrorToResponse(error);
    return authRes ? authRes : NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
