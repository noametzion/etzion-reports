import { NextResponse } from 'next/server';
import { getFiles, saveFile, deleteFile } from '@/app/utils/fileUtils';
import { NextRequest } from 'next/server';

const FILES_CATEGORY = "surveys";

export async function GET() {
  try {
    const files = await getFiles(FILES_CATEGORY);
    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const { fileName, filePath } = await saveFile(FILES_CATEGORY, file);

    return NextResponse.json({
      success: true,
      fileName,
      filePath
    });
  } catch (error) {
    if ((error as Error).message === 'File already exists') {
      return NextResponse.json(
        { error: 'File with this name already exists' },
        { status: 409 } // Conflict
      );
    }
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
    // TODO: delete edited file name
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
