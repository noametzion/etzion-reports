# Etzion Reports

This is a [Next.js](https://nextjs.org) project for managing and viewing reports.

## Features

- File storage with support for both local and Firebase Storage
- Easy switching between storage backends
- File upload, download, and deletion

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn
- Firebase project (if using Firebase Storage)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
```

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Storage type - 'local' or 'firebase'
NEXT_PUBLIC_STORAGE_TYPE=local

# Firebase Configuration (required if using Firebase Storage)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### Running the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Storage Configuration

The application supports two storage backends:

### 1. Local Storage (Default)
- Files are stored in the `public/` directory
- No additional configuration needed
- Best for development and testing

### 2. Firebase Storage
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firebase Storage
3. Get your Firebase configuration and update the environment variables
4. Set `NEXT_PUBLIC_STORAGE_TYPE=firebase`

## Usage

### File Operations

[//]: # (```typescript)

[//]: # (import { getFiles, saveFile, deleteFile } from './utils/fileUtils';)

[//]: # ()
[//]: # (// Get all files in a directory)

[//]: # (const files = await getFiles&#40;'surveys'&#41;;)

[//]: # ()
[//]: # (// Save a file)

[//]: # (// const file = /* your file object */;)

[//]: # (const savedFile = await saveFile&#40;'surveys', file&#41;;)

[//]: # ()
[//]: # (// Delete a file)

[//]: # (await deleteFile&#40;'surveys', 'filename.txt'&#41;;)

[//]: # (```)

## Deployment

### Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

### Firebase Hosting

This project is configured for Firebase Hosting. To deploy:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Deploy: `firebase deploy --only hosting`

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
