import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  secure_url: string;
  public_id: string;
  asset_id: string;
  version_id: string;
}

export class CloudinaryService {
  static async uploadImage(
    file: Buffer | string,
    options?: {
      folder?: string;
      transformation?: Record<string, unknown>[];
      tags?: string[];
    }
  ): Promise<UploadResult> {
    try {
      const result = await cloudinary.uploader.upload(file as string, {
        folder: options?.folder || "repair-tickets",
        transformation: options?.transformation || [
          { width: 1000, height: 1000, crop: "limit" },
          { quality: "auto" },
          { fetch_format: "auto" },
        ],
        tags: options?.tags || ["repair-ticket"],
        resource_type: "auto",
      });

      return {
        secure_url: result.secure_url,
        public_id: result.public_id,
        asset_id: result.asset_id,
        version_id: result.version_id,
      };
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      throw new Error("Failed to upload image");
    }
  }

  static async uploadMultipleImages(
    files: (Buffer | string)[],
    options?: {
      folder?: string;
      transformation?: Record<string, unknown>[];
      tags?: string[];
    }
  ): Promise<UploadResult[]> {
    try {
      const uploadPromises = files.map((file) =>
        this.uploadImage(file, options)
      );
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error("Error uploading multiple images:", error);
      throw new Error("Failed to upload images");
    }
  }

  static async deleteImage(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === "ok";
    } catch (error) {
      console.error("Error deleting image from Cloudinary:", error);
      return false;
    }
  }

  static async deleteMultipleImages(publicIds: string[]): Promise<boolean> {
    try {
      const result = await cloudinary.api.delete_resources(publicIds);
      return Object.values(result.deleted).every(
        (status) => status === "deleted"
      );
    } catch (error) {
      console.error("Error deleting multiple images from Cloudinary:", error);
      return false;
    }
  }

  static getOptimizedUrl(
    publicId: string,
    options?: {
      width?: number;
      height?: number;
      quality?: string;
      format?: string;
    }
  ): string {
    return cloudinary.url(publicId, {
      width: options?.width || 800,
      height: options?.height || 600,
      crop: "fill",
      quality: options?.quality || "auto",
      fetch_format: options?.format || "auto",
    });
  }
}
