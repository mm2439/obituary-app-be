const axios = require("axios");
const { buildRemotePath, publicUrl, uploadBuffer } = require('../config/bunny.js');

async function generateQRCode(data, id) {
    const url = 'https://api.qrcode-monkey.com/qr/custom';

    const postData = {
        data: data,
        config: {
            body: 'circle',
            eye: 'frame1',
            eyeBall: 'ball0',
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            // Logo config, optional
            logo: '',
            logoMode: 'default',
        },
        size: 300,
        download: false, // Set to true if you want direct download
        file: 'png',
    };

    try {
        const response = await axios.post(url, postData, {
            headers: {
                'Content-Type': 'application/json',
            },
            responseType: 'arraybuffer',
        });
        const remotePath = buildRemotePath(
            "qr-code",
            `${String(id)}.png`,
        );

        await uploadBuffer(
            response.data,
            remotePath,
            "image/png"
        );
        return publicUrl(remotePath);


    } catch (error) {
        console.error('Error generating QR code:', error.response?.data || error.message);
    }
}

module.exports = { generateQRCode }
