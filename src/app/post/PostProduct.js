"use client";

import { useState, useEffect } from "react";
import { storage, auth } from "../../firebase/firebaseConfig";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { v4 as uuid } from "uuid";
require("dotenv").config();
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useAuth } from "../auth/authContext";
import OnboardingNotice from "../components/OnboardingNotice";

export default function PostProduct(productValue) {
  const paramsId = useParams().id;
  const searchParams = useSearchParams();
  const editParam = searchParams.get("edit");
  const router = useRouter();
  const { user } = useAuth(); // ✅ Get current logged-in user

  // determine if we're in edit mode (must have both param and id)
  const isEditing = editParam === "true" && !!paramsId;

  const [product, setProduct] = useState({
    name: productValue?.currentProduct?.name || "",
    description: productValue?.currentProduct?.description || "",
    price: productValue?.currentProduct?.price || "",
    images: productValue?.currentProduct?.images || [],
    id: "",
  });

  const [updateProduct, setUpdateProduct] = useState({
    name: productValue?.currentProduct?.name || "",
    description: productValue?.currentProduct?.description || "",
    price: productValue?.currentProduct?.price || "",
    images: [],
    id: "",
  });

  const [deletedProduct, setDeletedProduct] = useState({});
  const [newFiles, setNewFiles] = useState([]);
  const [uploadedUrlsArray, setUploadedUrlsArray] = useState([]);
  const [productId, setProductId] = useState([]);
  const [files, setFiles] = useState([]);
  const [deletedFiles, setDeletedFiles] = useState([]);
  const [uploadNow, setUploadNow] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // ✅ New: track successful upload for new products
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false); // for fade in/out

  useEffect(() => {
    setProduct((prev) => ({ ...prev, id: paramsId }));
    setUpdateProduct((prev) => ({ ...prev, id: paramsId }));
  }, [paramsId]);

  // clear any residual data when switching into "new product" mode
  useEffect(() => {
    if (!isEditing) {
      setProduct({ name: "", description: "", price: "", images: [], id: "" });
      setFiles([]);
      setDeletedFiles([]);
      setUploadedUrlsArray([]);
      setNewFiles([]);
      setUploadSuccess(false);
      setShowSuccess(false);
    }
  }, [isEditing]);

  const getStoragePathFromUrl = (url) => {
    const baseUrl = "https://firebasestorage.googleapis.com/v0/b/norland-a7730.appspot.com/o/";
    if (url.includes(baseUrl)) {
      return decodeURIComponent(url.split(baseUrl)[1].split("?")[0]);
    }
    return null;
  };
const uploadFilesToFirebase = async () => {
  console.log("🔍 uploadFilesToFirebase: user object:", user);
  console.log("🔍 uploadFilesToFirebase: user.uid:", user?.uid);
  console.log("🔍 uploadFilesToFirebase: user.email:", user?.email);

  if (!user) {
    console.error("❌ uploadFilesToFirebase: user is null/undefined!");
    throw new Error("Must be signed in to upload images.");
  }

  console.log("✅ uploadFilesToFirebase: user is authenticated");

  // DELETE FILES FIRST
  if (deletedFiles.deletedFiles?.length > 0) {
    const deletePromises = deletedFiles.deletedFiles.map(async (file) => {
      try {
        const imagePath = getStoragePathFromUrl(file.image);
        if (!imagePath) throw new Error("Invalid Firebase image URL");
        const imageRef = ref(storage, imagePath);
        await deleteObject(imageRef);
      } catch (error) {
        console.error("Error deleting image:", error);
      }
    });

    await Promise.all(deletePromises);
  }

  // UPLOAD NEW FILES
  const uploadPromises = files.map(async (file) => {
    const ext = file.name.split(".").pop();
    const filePath = `products/${uuid()}.${ext}`;
    const imageRef = ref(storage, filePath);

    const metadata = {
      customMetadata: {
        owner: user.uid,
      },
    };

    try {
      // 🔥 FIX: auth.currentUser is now defined because we imported auth
      console.log("auth.currentUser:", auth.currentUser);
      console.log("uid:", auth.currentUser?.uid);

      console.log(`📤 Uploading file to Firebase Storage at path: ${filePath}`);
      console.log(`📤 User UID at upload time: ${user?.uid}`);

      // Upload ONCE, with metadata
      const snapshot = await uploadBytes(imageRef, file, metadata);

      // Then get URL
      const url = await getDownloadURL(snapshot.ref);

      console.log(`✅ File uploaded successfully: ${url}`);
      return url;
    } catch (error) {
      console.error(`❌ Upload error for ${filePath}:`, error);
      console.error(`   Error code: ${error.code}`);
      console.error(`   Error message: ${error.message}`);
      console.error(`   User at time of error: ${user?.uid}`);
      return null;
    }
  });

  const results = await Promise.all(uploadPromises);
  const validResults = results.filter((url) => url);

  setUploadedUrlsArray(validResults);

  setProduct((prev) => ({
    ...prev,
    images: [
      ...(prev.images || []).filter((url) => !url.startsWith("blob:")),
      ...validResults,
    ],
  }));

  setFiles([]);
};

  const uploadFilesToStripe = async () => {
    // build final images array; keep existing urls unless explicitly deleted
    const realImages = [
      ...(product.images || []).filter(
        (url) => !url.startsWith("blob:") && !uploadedUrlsArray.includes(url)
      ),
      ...uploadedUrlsArray,
    ];

    // choose the correct backend route; treat as edit only when we actually
    // have an id (fixes case where ?edit=true lingers on profile page).
    const endpoint = isEditing ? "/api/products/updateProduct" : "/api/products";

    // require at least one image for *new* products
    if (!isEditing && realImages.length === 0) {
      alert("Legg til minst ett bilde før du publiserer produktet.");
      return;
    }

    // ✅ Include user info as metadata
    const creatorData = {
      creatorId: user?.uid || "anonymous",
      creatorEmail: user?.email || "unknown",
    };

    const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        ...product,
        images: realImages,
        metadata: creatorData, // ✅ Pass to API
      }),
    });

    const data = await res.json();
    setProductId(data.id);

    setProduct((prev) => ({
      ...prev,
      images: realImages,
    }));

    setUploadedUrlsArray([]);

    if (isEditing) {
      router.replace(`/products/${paramsId}`);
    } else {
      // ✅ Only for new product: show fade-in/out success circle and reset form
      setUploadSuccess(true);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 1800);
      setTimeout(() => {
        setUploadSuccess(false);
        setProduct({
          name: "",
          description: "",
          price: "",
          images: [],
          id: "",
        });
        setFiles([]);
        setDeletedFiles([]);
        setUpdateProduct({
          name: "",
          description: "",
          price: "",
          images: [],
          id: "",
        });
      }, 2000);
    }
  };

  useEffect(() => {
    if (uploadedUrlsArray.length > 0) {
      uploadFilesToStripe();
    }
  }, [uploadedUrlsArray]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isUploading) return;

    setIsUploading(true);
    try {
      console.log("📋 handleSubmit: Starting upload, user object:", user);
      console.log("📋 handleSubmit: user.uid:", user?.uid);
      console.log("📋 handleSubmit: files.length:", files?.length);
      console.log("📋 handleSubmit: deletedFiles:", deletedFiles);

      if (!user) {
        console.error("❌ handleSubmit: user is not authenticated!");
        alert("Du må være logget inn før du kan publisere et produkt.");
        return;
      }

      console.log("✅ handleSubmit: user is authenticated, proceeding...");

      if (files?.length !== 0 || deletedFiles?.deletedFiles?.length > 0) {
        await uploadFilesToFirebase();
        if (files?.length === 0 && deletedFiles?.deletedFiles?.length > 0) {
          await uploadFilesToStripe();
        }
      } else {
        await uploadFilesToStripe();
      }
    } catch (err) {
      console.error("Failed to upload product", err);
      alert("Noe gikk galt ved opplasting. Prøv igjen.");
    } finally {
      setIsUploading(false);
    }
  };

  const onChange = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);

      const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
      setProduct((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...previewUrls],
      }));
    }
  };

  const removeImage = ({ image, index }) => {
    setDeletedFiles((prevFiles) => {
      const deletedFilesArray = prevFiles?.deletedFiles ?? [];
      return {
        ...prevFiles,
        deletedFiles: [...deletedFilesArray, { image }],
      };
    });

    setProduct((prevProduct) => ({
      ...prevProduct,
      images: (prevProduct.images || []).filter((_, i) => i !== index),
    }));

    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      {/* ✅ Success Indicator with Fade In/Out */}
      {uploadSuccess && (
        <div
          className={`fixed top-4 right-4 flex items-center space-x-2 z-50 transition-opacity duration-500 ${
            showSuccess ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-[#001F54] animate-pulse"></div>
          <span className="text-[#001F54] font-semibold">Produktet er publisert</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="max-w-3xl w-full mx-auto bg-white p-8 rounded-xl shadow-md"
      >
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          {productValue?.currentProduct ? "Rediger produkt" : "Legg til nytt produkt"}
        </h2>

        <OnboardingNotice
          storageKey="norya_seller_upload_intro_seen"
          title="Klar til å selge?"
          buttonLabel="Skjønner"
          className="mb-5"
        >
          Fyll inn navn, kort beskrivelse, pris og gode bilder. Produktet blir synlig for kunder etter publisering.
        </OnboardingNotice>

        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-slate-800">
          <p className="font-semibold text-slate-900">Sjekkliste før publisering</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Bruk tydelige bilder med godt lys.</li>
            <li>Skriv hva produktet er laget av og eventuelle mål.</li>
            <li>Legg inn riktig pris i NOK.</li>
          </ul>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Produktnavn
            </label>
            <input
              type="text"
              name="name"
              placeholder="Skriv inn produktnavn"
              value={product.name}
              onChange={(e) => setProduct({ ...product, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Beskrivelse
            </label>
            <textarea
              name="description"
              placeholder="Skriv en kort beskrivelse"
              value={product.description}
              onChange={(e) =>
                setProduct({ ...product, description: e.target.value })
              }
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pris
            </label>
            <input
              type="text"
              name="price"
              placeholder="f.eks. 199,99"
              value={product.price}
              onChange={(e) => setProduct({ ...product, price: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last opp bilder
            </label>
            <input
              type="file"
              name="image"
              onChange={onChange}
              multiple
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <h3 className="text-md font-medium text-gray-800 mb-2">
              Produktbilder
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border border-gray-200 rounded-lg p-4 max-h-[400px] overflow-y-auto">
              {product?.images?.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`Produkt ${index}`}
                    className="w-full h-48 object-cover rounded-lg shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeImage({ image, index });
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow"
                  >
                    ✖
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isUploading}
            className={`w-full py-3 text-white text-lg font-medium rounded-lg transition duration-300 ${
              isUploading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isUploading ? "Laster opp..." : productValue?.currentProduct ? "Oppdater produkt" : "Publiser produkt"}
          </button>
          {isUploading && (
            <div className="mt-2 text-sm text-blue-600 font-medium">Laster opp bilder og lagrer produkt, dette kan ta 10-20 sekunder...</div>
          )}
        </div>
      </form>
    </>
  );
}
