import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return Response.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const ALLOWED_MIME_TYPES = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf'
    ];
    const isAllowedType = ALLOWED_MIME_TYPES.includes(file.type) || 
      /\.(jpe?g|png|webp|pdf)$/i.test(file.name || '');

    if (!isAllowedType) {
      return Response.json({ error: 'Invalid file type. Only JPG, PNG, WebP, and PDF are allowed.' }, { status: 400 });
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ error: 'File size exceeds 5MB limit.' }, { status: 400 });
    }

    const isPdf = file.type === 'application/pdf' || (file.name || '').toLowerCase().endsWith('.pdf');
    const requestedFolder = formData.get('folder');
    const folder = requestedFolder || (isPdf ? 'doctor-documents' : 'doctor-profiles');

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          folder,
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(buffer);
    });

    return Response.json({
      url: result.secure_url || result.url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      resource_type: result.resource_type
    });

  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ error: 'Error uploading file' }, { status: 500 });
  }
}
