import { api } from './axios';
import { env } from './env';

export type UploadStaticAssetArgs = {
    file: File | Blob;
    firebaseUid: string;
};

export type UploadResponse = {
    success: boolean;
    msg: string;
    url: string;
};

/**
 * Uploads a static asset (image) to the backend.
 * Path: /auth/upload-image
 */
export const uploadStaticAsset = async ({
    file,
    firebaseUid,
}: UploadStaticAssetArgs): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uid', firebaseUid);
    formData.append('apiKey', env.clientApiKey);

    try {
        const response = await api.post<UploadResponse>(
            '/auth/upload-image',
            formData,
        );

        if (!response.data || !response.data.success) {
            throw new Error(response.data?.msg || 'Failed to upload image');
        }

        return response.data.url;
    } catch (error: any) {
        const message =
            error.response?.data?.message ||
            error.message ||
            'Error uploading image';
        console.error('❌ Error in uploadStaticAsset:', message);
        throw new Error(message);
    }
};
