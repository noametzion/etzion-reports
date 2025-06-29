import React, { useRef } from 'react';
import styles from './SurveyUploader.module.css';

interface SurveyUploaderProps {
  isUploading: boolean;
  error: string | null;
  uploadFile: (file: File, onUploadSuccess?: (fileName: string, filePath: string) => void) => Promise<void>;
  onUploadSuccess?: (fileName: string, filePath: string) => void;
}

const SurveyUploader: React.FC<SurveyUploaderProps> = ({ isUploading, error, uploadFile, onUploadSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadFile(file, onUploadSuccess);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`${styles.uploader} ${error ? styles.errorState : ''}`}>
      <label className={styles.uploadButton}>
        {isUploading ? 'Uploading...' : 'Upload Survey'}
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          disabled={isUploading}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
      </label>
      {error && <p className={styles.errorMessage}>{error}</p>}
    </div>
  );
};

export default SurveyUploader;
