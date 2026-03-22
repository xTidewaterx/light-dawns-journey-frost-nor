'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { db, storage } from '../../firebase/firebaseConfig';
import {
  collection,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';

export default function UploadShowcase() {
  const { uid } = useParams();
  const [files, setFiles] = useState([]);
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 3) {
      setMessage('Please select a maximum of 3 images.');
      return;
    }
    setFiles(selectedFiles);
    setMessage('');
  };

  const handleUpload = async () => {
    if (files.length === 0 || !text.trim()) {
      setMessage('Please select 1–3 images and add text.');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const uploadedUrls = [];
      for (const file of files) {
        const fileRef = ref(storage, `userImages/${uid}/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        uploadedUrls.push(url);
      }

      const showcaseRef = collection(db, 'publicUsers', uid, 'showcase');
      await addDoc(showcaseRef, {
        text: text.trim(),
        images: uploadedUrls,
        createdAt: serverTimestamp(),
      });

      setMessage('✅ Successfully uploaded showcase!');
      setFiles([]);
      setText('');
    } catch (error) {
      console.error('Upload failed:', error);
      setMessage('❌ Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-gray-50 border rounded-xl p-6 max-w-lg mx-auto mt-10 shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-[#001f3f]">Add Showcase</h2>

      <textarea
        className="w-full border rounded-lg p-3 mb-4 focus:outline-none focus:ring"
        placeholder="Write a description..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="mb-3 block"
      />

      <button
        onClick={handleUpload}
        disabled={uploading}
        className="bg-[#001f3f] text-white px-5 py-2 rounded-full shadow hover:bg-[#0b2b4f] transition disabled:opacity-50"
      >
        {uploading ? 'Uploading…' : 'Upload Showcase'}
      </button>

      {message && (
        <p className="mt-3 text-center text-sm text-[#2d2d2d]">{message}</p>
      )}
    </div>
  );
}
