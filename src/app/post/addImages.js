'use client'

//we have to take all the functionality from this component and give that to the component postProduct, perhaps it can import this functionality
//then state management will be a lot easier, we are addicted to the same state, we have our combined promise array when file image firebase upload has occoured
import { useEffect, useState } from "react";
import { storage } from "../firebaseConfig"; // Import Firebase storage
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuid } from "uuid";


export const ImageInput = (productId) => {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    console.log("addImages.js file input array: ", files);
  }, [files]);

  const onChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(prevFiles => [...prevFiles, ...Array.from(e.target.files)]);
    }
  };

  const uploadFilesToFirebase = async () => {
    if (files.length === 0) {
      alert("Please select at least one image.");
      return;
    }

    const uploadPromises = files.map(async (file) => {
      const imageRef = ref(storage, `products/${uuid()}`);
      const metaData = {
        idValue: productId,
      }
      try {
        const snapshot = await uploadBytes(imageRef, file, metaData);
        const url = await getDownloadURL(snapshot.ref);
        console.log("Uploaded image URL:", url);
        return url; // You can save this URL wherever needed
      } catch (error) {
        console.error("Upload error:", error);
        return null;
      }
    });

    //is this the array with all of the file firebase URLs we have to update our stripe product with?
    const uploadedUrls = await Promise.all(uploadPromises);
    console.log("All uploaded URLs:", uploadedUrls);
    
  };

  return (
    <div>
      <input className="block w-full mt-2 p-2 border rounded" type='file' name='image' onChange={onChange} multiple />
      <button onClick={uploadFilesToFirebase}>Upload</button>
    </div>
  );
};