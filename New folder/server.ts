import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import axios from 'axios';
import multer from 'multer';
import FormData from 'form-data';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Multer setup for memory storage
const upload = multer({ storage: multer.memoryStorage() });

const TECHMENTOR_API_BASE = 'https://api.techmentor.uz';
const API_KEY = process.env.TECHMENTOR_API_KEY || '';
const PROJECT_NAME = process.env.TECHMENTOR_PROJECT_NAME || '';
const BUCKET_NAME = process.env.TECHMENTOR_BUCKET_NAME || '';

// Extend Request type for Multer
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// API Routes
app.get('/api/config', (req: Request, res: Response) => {
  res.json({
    projectName: PROJECT_NAME,
    bucketName: BUCKET_NAME,
    hasApiKey: !!API_KEY,
    apiBase: TECHMENTOR_API_BASE
  });
});

// Create Bucket
app.post('/api/buckets/create', async (req: Request, res: Response) => {
  try {
    console.log('[DEBUG] Creating bucket:', req.body);
    const response = await axios.post(`${TECHMENTOR_API_BASE}/api/v1/buckets/create`, {
      project_name: req.body.project_name || PROJECT_NAME,
      bucket_name: req.body.bucket_name || BUCKET_NAME
    }, {
      headers: { 'X-API-Key': API_KEY }
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Error creating bucket:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed to create bucket' });
  }
});

// List files
app.get('/api/files', async (req: Request, res: Response) => {
  try {
    const url = `${TECHMENTOR_API_BASE}/api/v1/files/list/${PROJECT_NAME}/${BUCKET_NAME}`;
    console.log(`[DEBUG] Listing files from: ${url}`);
    const response = await axios.get(url, {
      headers: { 'X-API-Key': API_KEY }
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Error listing files:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed to list files', details: error.response?.data });
  }
});

// Upload file
app.post('/api/upload', upload.single('file'), async (req: MulterRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  if (!PROJECT_NAME || !BUCKET_NAME || !API_KEY) {
    return res.status(400).json({ error: 'Server configuration missing (Project Name, Bucket Name, or API Key)' });
  }

  // Construct URL carefully. Documentation says: api.techmentor.uz/{project_name}/{bucket_name}/
  // The trailing slash is likely MANDATORY. Without it, the server might redirect (301)
  // which Axios follows as a GET request, leading to a 405 Method Not Allowed.
  const uploadUrl = `${TECHMENTOR_API_BASE}/${PROJECT_NAME}/${BUCKET_NAME}/`;
  
  console.log(`[DEBUG] Attempting upload to: ${uploadUrl}`);
  console.log(`[DEBUG] File: ${req.file.originalname}, Size: ${req.file.size}`);

  try {
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const response = await axios.post(uploadUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        'X-API-Key': API_KEY
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      // Prevent automatic redirect following to debug if it's happening
      maxRedirects: 5 
    });

    console.log(`[DEBUG] Upload successful:`, response.data);
    res.json(response.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    const errorData = error.response?.data;
    
    console.error(`[ERROR] Upload failed with status ${status}`);
    
    // If the response is HTML (like the 405 error page), don't send it as JSON
    if (typeof errorData === 'string' && errorData.includes('<!doctype html>')) {
      console.error(`[ERROR] Received HTML error page instead of JSON`);
      return res.status(status).json({ 
        error: `API returned ${status} Method Not Allowed. Check if Project Name (${PROJECT_NAME}) and Bucket Name (${BUCKET_NAME}) are correct and exist.`,
        details: 'The server rejected the request method. This often happens if the URL path is incorrect.'
      });
    }

    res.status(status).json(errorData || { error: 'Failed to upload file' });
  }
});

// Delete file
app.delete('/api/files/:fileId', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const response = await axios.delete(`${TECHMENTOR_API_BASE}/api/v1/files/delete/${fileId}`, {
      headers: { 'X-API-Key': API_KEY }
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Error deleting file:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed to delete file' });
  }
});

// File info
app.get('/api/files/:fileId', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const response = await axios.get(`${TECHMENTOR_API_BASE}/api/v1/files/info/${fileId}`, {
      headers: { 'X-API-Key': API_KEY }
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Error getting file info:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed to get file info' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
