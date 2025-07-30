import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileIcon, AlertTriangle } from 'lucide-react';

interface FileUploadSecurityProps {
  acceptedTypes?: string[];
  maxSize?: number;
  showSecurityInfo?: boolean;
}

export const FileUploadSecurity: React.FC<FileUploadSecurityProps> = ({
  acceptedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif'],
  maxSize = 10,
  showSecurityInfo = true
}) => {
  if (!showSecurityInfo) return null;

  return (
    <Alert className="mt-2">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="text-sm space-y-1">
        <div className="font-medium">File Upload Security:</div>
        <ul className="text-xs space-y-1 ml-4">
          <li>• Maximum file size: {maxSize}MB</li>
          <li>• Allowed types: {acceptedTypes.join(', ')}</li>
          <li>• Files are scanned for security threats</li>
          <li>• No executable files are permitted</li>
        </ul>
      </AlertDescription>
    </Alert>
  );
};

export const validateFileUpload = (file: File, maxSizeMB: number = 10): void => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    throw new Error(`File size exceeds maximum limit of ${maxSizeMB}MB`);
  }
  
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('File type not allowed. Only images, PDF, and Word documents are permitted');
  }
  
  if (/[<>:"/\\|?*]/.test(file.name)) {
    throw new Error('File name contains invalid characters');
  }
};