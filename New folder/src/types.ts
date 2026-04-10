export interface TechMentorFile {
  auto_id: number;
  id: string;
  filename: string;
  original_name: string;
  size: number;
  created_at: string;
}

export interface FileListResponse {
  status: string;
  files: TechMentorFile[];
}

export interface UploadResponse {
  status: string;
  file_id: string;
  file_url: string;
  metadata: {
    project: string;
    bucket: string;
    original_name: string;
    timestamp: string;
  };
}

export interface AppConfig {
  projectName: string;
  bucketName: string;
  hasApiKey: boolean;
}
