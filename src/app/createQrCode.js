'use client'
//this is tested on multiple devices, QR generator is successful


import React from 'react';
import { useEffect, useState, useContext } from "react";
import QRCode from 'react-qr-code';

export const  CreateQrCode = () => {
  const [qrCodeInputValue, setQrCodeInputValue] = useState("no current value");

  useEffect(() => {

console.log("qrCodeInputValue value createQrCode.js: ", qrCodeInputValue)
  }, [qrCodeInputValue])

return ( <div className='m-16'>
  <h3 className= "mx-auto text-2xl flex flex-col items-center justify-center  bg-gray-100 p-4 pb-2" >Generate Your Own QR Code!</h3>
      <QRCode className= " mx-auto flex flex-col items-center justify-center  bg-gray-100 p-4" value={qrCodeInputValue} />

<div className="flex flex-col items-center justify-center  bg-gray-100 p-4">
  <h2 className="text-2xl font-semibold text-gray-700 mb-4">Add Value for QR Code:</h2>
  <input
    className="w-64 p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
    placeholder="value for QR code"
    onChange={(e) => {
      setQrCodeInputValue(e.target.value);
    }}
  />
</div>
        </div>
)
}

