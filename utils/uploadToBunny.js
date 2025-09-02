import axios from 'axios';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env

/**
 * Upload a file to Bunny.net Storage and remove it from local disk.
 *
 * @param localFilePath - Full local path to the file (e.g., "./uploads/photo.jpg")
 * @param remotePath - Remote path + filename inside Bunny Storage (e.g., "images/user123/photo.jpg")
 * @returns Promise that resolves when upload succeeds and file is deleted locally
 */
export async function uploadToBunny(localFilePath, remotePath) {
    // const storageZone = process.env.BUNNY_STORAGE_ZONE;
    // const apiKey = process.env.BUNNY_STORAGE_API_KEY;

    // Check if required env variables exist
    // if (!storageZone || !apiKey) {
    //     throw new Error('Missing BUNNY_STORAGE_ZONE or BUNNY_STORAGE_API_KEY in environment variables.');
    // }
console.log("localFilePath",localFilePath);
console.log("remotePath",remotePath);

    // Check if file exists
    if (!fs.existsSync(localFilePath)) {
        throw new Error(`❌ File does not exist at: ${localFilePath}`);
    }

    // Create file stream
    const fileStream = fs.createReadStream(localFilePath);

    // Construct Bunny Storage upload URL
    // const uploadUrl = `https://storage.bunnycdn.com/${storageZone}/${remotePath}`;

    try {
        // Make PUT request to Bunny Storage
        // const response = await axios.put(uploadUrl, fileStream, {
        //     headers: {
        //         AccessKey: apiKey,
        //         'Content-Type': 'application/octet-stream',
        //     },
        //     maxContentLength: Infinity,
        //     maxBodyLength: Infinity,
        // });

        // // Confirm successful upload
        // if (response.status === 201 || response.status === 200) {
        //     console.log(`✅ File uploaded to Bunny: ${remotePath}`);
        // } else {
        //     throw new Error(`❌ Upload failed with status: ${response.status}`);
        // }

        // Delete local file after upload
        fs.unlinkSync(localFilePath);
        // console.log(`🧹 Deleted local file: ${localFilePath}`);
        return remotePath;
    } catch (error) {
        console.error('🚨 Error during upload or cleanup:', error.message);
        throw error;
    }
}
