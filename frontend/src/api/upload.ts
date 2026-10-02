import api from './axios';
import { ENDPOINTS } from './endpoints';
import type { User } from '../types';

export interface UploadResponse {
  message: string;
  url: string;
  public_id: string;
  format: string;
  bytes: number;
  provider: 'cloudinary' | 'local';
}

export interface AvatarResponse {
  message: string;
  avatar_url?: string;
  public_id?: string;
  provider?: string;
  user: User;
}

export const uploadApi = {
  /**
   * Upload user profile avatar to Cloudinary
   */
  uploadAvatar: async (file: File): Promise<AvatarResponse> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await api.post<AvatarResponse>(ENDPOINTS.UPLOAD.AVATAR, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  /**
   * Remove user profile avatar
   */
  deleteAvatar: async (): Promise<AvatarResponse> => {
    const { data } = await api.delete<AvatarResponse>(ENDPOINTS.UPLOAD.AVATAR);
    return data;
  },

  /**
   * Upload general image or document (e.g. medical record attachment) to Cloudinary
   */
  uploadImage: async (file: File, folder = 'general'): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    const { data } = await api.post<UploadResponse>(ENDPOINTS.UPLOAD.IMAGE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  /**
   * Delete image/document from Cloudinary by public_id
   */
  deleteImage: async (publicId: string, resourceType = 'image'): Promise<{ message: string; success: boolean }> => {
    const { data } = await api.post(ENDPOINTS.UPLOAD.DELETE, {
      public_id: publicId,
      resource_type: resourceType,
    });
    return data;
  },
};

export default uploadApi;
