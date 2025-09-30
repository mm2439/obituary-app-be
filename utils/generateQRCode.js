import axios from 'axios';
import fs from 'fs';
import { buildRemotePath, publicUrl, uploadBuffer } from '../config/bunny.js';

export async function generateQRCode(data, id) {
    const url = 'https://api.qrcode-monkey.com//qr/custom';

    const postData = {
        data: data,
        config: {
            body: 'circle',
            eye: 'frame1',
            eyeBall: 'ball0',
            // You can customize colors/logos here
            // For example, set color dark/light
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
            responseType: 'arraybuffer', // important to get image buffer
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



// export async function generateQRCode(data, id) {
//     const url = 'https://www.qrcode-monkey.com/qr/custom';

//     const postData = {
//         data: data,
//         config: {
//             body: 'circle',
//             eye: 'frame1',
//             eyeBall: 'ball0',
//             // You can customize colors/logos here
//             // For example, set color dark/light
//             color: {
//                 dark: '#000000',
//                 light: '#FFFFFF'
//             },
//             // Logo config, optional
//             logo: 'https://osmrtnica.com/omr.png',
//             logoMode: 'clean',
//         },
//         size: 300,
//         download: false, // Set to true if you want direct download
//         file: 'png',
//     };

//     try {
//         const response = await axios.post(url, postData, {
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             responseType: 'arraybuffer', // important to get image buffer
//         });
//         const remotePath = buildRemotePath(
//             "qr-code",
//             `${String(id)}.png`,
//         );
//         console.log('response', response);

//         await uploadBuffer(
//             response.data,
//             remotePath,
//             "image/png"
//         );
//         return publicUrl(remotePath);


//     } catch (error) {
//         console.error('Error generating QR code:', error.response?.data || error.message);
//     }
// }