import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';
import { logger } from '../utils/logger';

if (config.cloudinary.cloudName) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
}

export type UploadFolder =
  | 'profiles'
  | 'ghana-cards'
  | 'drivers-licenses'
  | 'motorcycle-photos'
  | 'motorcycle-regs'
  | 'selfies';

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: UploadFolder,
  publicId?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `quick-rider-gh/${folder}`,
        public_id: publicId,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error || !result) {
          logger.error({ msg: 'Cloudinary upload failed', error });
          reject(error || new Error('Upload failed'));
        } else {
          resolve(result.secure_url);
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
