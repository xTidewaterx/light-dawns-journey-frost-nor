'use client'
import React, { useState } from 'react';
import jsQR from 'jsqr';

const QRDecoder = () => {
    const [decodedText, setDecodedText] = useState('');

    const handleFileChange = async () => {
        const file = event.target.files[0];
        if (file) {
            // Use FileReader to read the image as data URL
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0);
                    const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);

                    if (imageData) {
                        const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
                        setDecodedText(qrCode?.data || 'No QR code found');
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            <p>Decoded QR Code: {decodedText}</p>
        </div>
    );
};

export default QRDecoder;
