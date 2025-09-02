import axios from 'axios';
import fs from 'fs';  // Note: full fs module here, NOT promises only
import path from 'path';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env

export async function uploadToBunny(localFilePath, remotePath) {
    const storageZone = "matrixecho";
    const apiKey = "4318d388-8ece-4f55-977efb88dc9f-f3e8-420d";


    try {
        // Check if file exists
        await fs.promises.access(localFilePath); // throws if file doesn't exist

        // Create a read stream
        const fileStream = fs.createReadStream(localFilePath);

        // Construct Bunny Storage upload URL
        const uploadUrl = `https://sg.storage.bunnycdn.com/${storageZone}/${remotePath}`;

        // Upload using axios PUT and streaming the file
        const response = await axios.put(uploadUrl, fileStream, {
            headers: {
                AccessKey: apiKey,
                'Content-Type': 'application/octet-stream',
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });

        if (response.status === 201 || response.status === 200) {
            console.log(`✅ File uploaded to Bunny: ${remotePath}`);
        } else {
            throw new Error(`❌ Upload failed with status: ${response.status}`);
        }

        // Delete local file after upload
        await fs.promises.unlink(localFilePath);
        // console.log(`🧹 Deleted local file: ${localFilePath}`);

        return remotePath;
    } catch (error) {
        console.error('🚨 Error during upload or cleanup:', error.message);
        throw error;
    }
}
