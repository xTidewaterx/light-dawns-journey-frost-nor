'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { getAuth, updateProfile } from 'firebase/auth';
import { getCroppedImg } from '../utils/cropImage';
import { useAuth } from '../auth/authContext';
import { RegisterUser } from "../auth/RegisterUser";
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Deer from '../components/Deer';
import { SignInUser } from '../auth/SignIn';
import PostProduct from '../post/PostProduct';
import { getFirestore, doc, collection, getDocs, updateDoc, getDoc } from 'firebase/firestore';
import { Space_Grotesk } from 'next/font/google';
import OnboardingNotice from '../components/OnboardingNotice';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const PROFILE_THEMES = [
  { id: 'fjord', name: 'Fjordbla', accent: '#1f4a58', surface: '#edf4f7', border: '#bfd3db' },
  { id: 'midnatt', name: 'Midnatt', accent: '#263248', surface: '#eef1f7', border: '#c7cfdf' },
  { id: 'skog', name: 'Skog', accent: '#315044', surface: '#edf5f1', border: '#c7ddd3' },
  { id: 'rav', name: 'Rav', accent: '#7a5322', surface: '#f8f1e8', border: '#e5d4be' },
  { id: 'plomme', name: 'Plomme', accent: '#4a355f', surface: '#f2eef8', border: '#d7cde9' },
  { id: 'stein', name: 'Stein', accent: '#4b5563', surface: '#f1f3f5', border: '#d5dbe2' },
  { id: 'kyst', name: 'Kyst', accent: '#005f73', surface: '#eaf5f7', border: '#bdd9de' },
  { id: 'vin', name: 'Vinrod', accent: '#6f2f3b', surface: '#f8ecef', border: '#e6c5cc' },
];

const hexToRgba = (hex, alpha) => {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const value = Number.parseInt(full, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const ImageCropUploader = () => {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState(false);
  const [showHalo, setShowHalo] = useState(false);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [profileThemeId, setProfileThemeId] = useState('fjord');

  const [creatorProducts, setCreatorProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [favoriteProducts, setFavoriteProducts] = useState([]);

  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();
  const user = auth.currentUser;
  const { user: contextUser } = useAuth();

  const effectiveName = user?.displayName || contextUser?.fullName || user?.email || 'No Name';
  const profilePic = user?.photoURL || '';

  useEffect(() => {
    const reloadUser = async () => {
      const current = auth.currentUser;
      if (current) {
        try {
          await current.reload();
        } catch (err) {
          console.error('Failed to reload user:', err);
        }
      }
    };
    reloadUser();
  }, [auth]);

  useEffect(() => {
    setShowHalo(true);
    const timer = setTimeout(() => setShowHalo(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const onCropComplete = useCallback((_, croppedArea) => {
    setCroppedAreaPixels(croppedArea);
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImageSrc(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!user) return;

    let downloadURL = profilePic;

    try {
      if (imageSrc && croppedAreaPixels) {
        const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
        const storageRef = ref(storage, `profilePics/${user.uid}.jpg`);
        await uploadBytes(storageRef, blob);
        downloadURL = await getDownloadURL(storageRef);
      }

      await updateProfile(user, {
        displayName: newName || user.displayName,
        photoURL: downloadURL,
      });

      const userDocRef = doc(db, 'users', user.uid);
      const publicUserDocRef = doc(db, 'publicUsers', user.uid);

      await Promise.all([
        updateDoc(userDocRef, {
          displayName: newName || user.displayName,
          photoURL: downloadURL,
          profileThemeId,
        }),
        updateDoc(publicUserDocRef, {
          displayName: newName || user.displayName,
          photoURL: downloadURL,
          profileThemeId,
        }),
      ]);

      alert('Profile updated successfully!');
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile.');
    }
  };

  const UploadProductIfSignedIn = () =>
    user?.uid ? (
      <>
        {!showNewProduct ? (
          <button
            onClick={() => setShowNewProduct(true)}
            className="w-full rounded-2xl border py-3 text-white font-semibold tracking-wide shadow transition hover:brightness-95 active:brightness-90"
            style={{ backgroundColor: activeTheme.accent, borderColor: activeTheme.accent }}
          >
            Nytt Produkt
          </button>
        ) : (
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_24px_rgba(15,23,42,0.08)] sm:p-6">
            <PostProduct />
            <button
              onClick={() => setShowNewProduct(false)}
              className="mt-5 w-full rounded-xl border border-slate-300 bg-white py-3 text-slate-700 font-medium hover:bg-slate-50 transition"
            >
              Lukk
            </button>
          </div>
        )}
      </>
    ) : null;

  useEffect(() => {
    async function fetchProducts() {
      if (!user?.uid) return;
      try {
        console.log('attempting to fetch products from Next.js API route...');
        const res = await fetch('/api/products');
        const json = await res.json();

        if (json.data) {
          const filtered = json.data.filter(
            (product) => product.metadata?.creatorId === user.uid
          );
          setCreatorProducts(filtered);
        } else {
          console.warn('No data returned from API.');
          setCreatorProducts([]);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setCreatorProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    }

    fetchProducts();
  }, [user]);

  useEffect(() => {
    async function fetchFavorites() {
      if (!user?.uid) return;
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const favouritesRef = collection(userDocRef, 'favourites');
        const snapshot = await getDocs(favouritesRef);
        const favoriteIds = snapshot.docs.map((doc) => doc.data().productId).filter(Boolean);

        if (favoriteIds.length === 0) {
          setFavoriteProducts([]);
          return;
        }

        const res = await fetch('/api/products');
        const json = await res.json();
        if (json.data) {
          const favoriteProducts = json.data.filter((p) => favoriteIds.includes(p.id));
          setFavoriteProducts(favoriteProducts);
        } else {
          setFavoriteProducts([]);
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
        setFavoriteProducts([]);
      }
    }

    fetchFavorites();
  }, [user]);

  useEffect(() => {
    async function fetchTheme() {
      if (!user?.uid) return;
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data()?.profileThemeId) {
          setProfileThemeId(userSnap.data().profileThemeId);
        }
      } catch (error) {
        console.error('Error fetching profile theme:', error);
      }
    }

    fetchTheme();
  }, [db, user]);

  const activeTheme = PROFILE_THEMES.find((theme) => theme.id === profileThemeId) || PROFILE_THEMES[0];
  const profileSurfaceStyle = {
    background: `radial-gradient(1200px 500px at 10% 0%, ${hexToRgba(activeTheme.accent, 0.11)} 0%, rgba(255,255,255,0) 70%), ${activeTheme.surface}`,
  };

  return (
    <div
      className={`${spaceGrotesk.className} relative min-h-screen overflow-hidden px-4 pb-16 pt-36 text-slate-900 sm:px-8`}
      style={profileSurfaceStyle}
    >
      <div className="industrial-grid pointer-events-none absolute inset-0 opacity-45"></div>
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/90 blur-2xl"></div>
      <div className="pointer-events-none absolute -right-16 top-12 h-80 w-80 rounded-full bg-slate-200/50 blur-3xl"></div>

      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 lg:gap-10">
        {user && (
          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div
              className="rounded-3xl border bg-white/95 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.08)] sm:p-8"
              style={{ borderColor: activeTheme.border }}
            >
              {!editing ? (
                <>
                  <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                    <div className="relative h-28 w-28 shrink-0">
                      {showHalo && <div className="animate-glow absolute inset-0 rounded-full bg-slate-300/40 blur-xl"></div>}
                      {profilePic ? (
                        <img
                          src={profilePic}
                          alt="Profile"
                          className="relative z-10 h-full w-full rounded-full object-cover shadow-[0_8px_20px_rgba(15,23,42,0.15)]"
                        />
                      ) : (
                        <div className="relative z-10 flex h-full w-full items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-2xl font-semibold text-slate-500">
                          {effectiveName.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="text-center sm:text-left">
                      <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Profile Dashboard</p>
                      <h1 className="mt-2 text-3xl font-semibold text-slate-900">{effectiveName}</h1>
                      <p className="mt-2 text-sm text-slate-600">
                        Administrer profil, favoritter og produkter i ett rent atelier-oppsett.
                      </p>
                      <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em]" style={{ color: activeTheme.accent }}>
                        Tema: {activeTheme.name}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    <button
                      onClick={() => setEditing(true)}
                      className="rounded-xl border px-4 py-3 text-white font-semibold tracking-wide transition hover:brightness-95 active:brightness-90"
                      style={{ backgroundColor: activeTheme.accent, borderColor: activeTheme.accent }}
                    >
                      Rediger Profil
                    </button>
                    <button
                      onClick={async () => {
                        await auth.signOut();
                        alert('You have been signed out.');
                      }}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 font-medium transition hover:bg-slate-100"
                    >
                      Logg Ut
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Edit Mode</p>
                  <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                    Oppdater <span className="text-slate-700">{effectiveName}</span>
                  </h1>

                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Display Name</label>
                      <input
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Enter new name"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Profile Picture</label>
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="w-full text-sm file:mr-4 file:rounded-full file:border file:border-slate-300 file:bg-white file:px-4 file:py-2 file:text-slate-700 hover:file:bg-slate-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Profilfarge</label>
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                        {PROFILE_THEMES.map((theme) => {
                          const selected = theme.id === profileThemeId;
                          return (
                            <button
                              key={theme.id}
                              type="button"
                              onClick={() => setProfileThemeId(theme.id)}
                              title={theme.name}
                              aria-label={`Velg ${theme.name}`}
                              className="h-9 w-full rounded-xl border transition"
                              style={{
                                backgroundColor: theme.accent,
                                borderColor: selected ? '#0f172a' : hexToRgba(theme.accent, 0.55),
                                boxShadow: selected ? `0 0 0 2px ${hexToRgba(theme.accent, 0.28)}` : 'none',
                              }}
                            />
                          );
                        })}
                      </div>
                      <p className="mt-2 text-xs text-slate-500">Denne fargen brukes kun pa profilsider.</p>
                    </div>

                    {imageSrc && (
                      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-inner">
                        <Cropper
                          image={imageSrc}
                          crop={crop}
                          zoom={zoom}
                          cropShape="round"
                          aspect={1}
                          onCropChange={setCrop}
                          onZoomChange={setZoom}
                          onCropComplete={onCropComplete}
                        />
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={handleUpload}
                        className="flex-1 rounded-xl border px-4 py-3 text-white font-semibold transition hover:brightness-95 active:brightness-90"
                        style={{ backgroundColor: activeTheme.accent, borderColor: activeTheme.accent }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 font-medium transition hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div
              className="rounded-3xl border bg-white/95 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.08)] sm:p-8"
              style={{ borderColor: activeTheme.border }}
            >
              <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Overview</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Konto Status</h2>
              <p className="mt-2 text-sm text-slate-600">
                Et rent kontrollpanel for aktivitet, innhold og favoritter.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Produkter</div>
                  <div className="mt-2 text-3xl font-semibold text-slate-900">{creatorProducts.length}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Favoritter</div>
                  <div className="mt-2 text-3xl font-semibold text-slate-900">{favoriteProducts.length}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Mode</div>
                  <div className="mt-2 text-sm font-semibold text-slate-700">{editing ? 'Editing' : 'Viewing'}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Status</div>
                  <div className="mt-2 text-sm font-semibold text-emerald-700">Active</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {!user && (
          <section className="mx-auto w-full max-w-3xl rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.08)] sm:p-8">
            <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Profile Access</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Min Profil</h1>
            <p className="mt-2 text-sm text-slate-600">Logg inn eller opprett bruker for å administrere profil, produkter og favoritter.</p>

            <div className="mt-5">
              <OnboardingNotice
                storageKey="norya_profile_access_intro_seen"
                title="Ny bruker?"
                buttonLabel="Ok"
              >
                Start med å registrere deg eller logge inn. Etterpå får du tilgang til profil, favoritter og verktøy for å publisere produkter.
              </OnboardingNotice>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <SignInUser />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <RegisterUser />
              </div>
            </div>
          </section>
        )}

        {user && (
          <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.08)] sm:p-8">
            <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Creator Tools</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Produktverksted</h2>
            <p className="mt-2 mb-5 text-sm text-slate-600">Publiser nye produkter eller rediger arbeidsflyten din herfra.</p>
            <OnboardingNotice
              storageKey="norya_creator_tools_intro_seen"
              title="Skaperveiledning"
              buttonLabel="Klar"
              className="mb-5"
            >
              Trykk Nytt Produkt for å åpne publiseringsskjemaet. Du kan når som helst redigere eksisterende produkter fra produktkortene under.
            </OnboardingNotice>
            <UploadProductIfSignedIn />
          </section>
        )}

        {user && (
          <section className="grid gap-8 xl:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.08)] sm:p-8">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold text-slate-900">Dine Produkter</h2>
                <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600">{creatorProducts.length}</span>
              </div>

              {loadingProducts ? (
                <p className="text-slate-600">Laster produkter...</p>
              ) : creatorProducts.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-slate-600">Ingen produkter funnet.</p>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {creatorProducts.map((product) => (
                    <a
                      key={product.id}
                      href={`/products/${product.id}`}
                      className="group block rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_28px_rgba(15,23,42,0.14)]"
                    >
                      <div className="aspect-[4/5] w-full overflow-hidden rounded-xl bg-slate-100">
                        <img
                          src={product.images?.[0] || '/placeholder.jpg'}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      </div>
                      <div className="pt-3">
                        <h3 className="truncate text-sm font-semibold text-slate-900 sm:text-base">{product.name}</h3>
                        <p className="mt-1 min-h-[2.25rem] text-xs text-slate-500">{product.description || 'Ingen beskrivelse'}</p>
                        <p className="mt-2 text-sm font-bold text-slate-800">
                          {product.currency?.toUpperCase() || 'NOK'} {product.price?.toLocaleString()}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.08)] sm:p-8">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold text-slate-900">Dine Favoritter</h2>
                <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600">{favoriteProducts.length}</span>
              </div>

              {favoriteProducts.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-slate-600">
                  Ingen favoritter funnet. Gå til Produkter og legg til favoritter for å vise dem her.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {favoriteProducts.map((favorite) => (
                    <a
                      key={favorite.id}
                      href={`/products/${favorite.id}`}
                      className="group block rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_28px_rgba(15,23,42,0.14)]"
                    >
                      <div className="aspect-[4/5] w-full overflow-hidden rounded-xl bg-slate-100">
                        <img
                          src={favorite.images?.[0] || '/placeholder.jpg'}
                          alt={favorite.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      </div>
                      <div className="pt-3">
                        <div className="truncate text-sm font-semibold text-slate-900 sm:text-base">{favorite.name || 'Ukjent Produkt'}</div>
                        <div className="mt-1 text-sm text-slate-500">{favorite.currency?.toUpperCase() || 'NOK'} {favorite.price ?? '0'}</div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Studio View</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">Atelier Model Preview</h2>
            </div>
          </div>

          <div className="h-[42vh] min-h-[280px] overflow-hidden rounded-2xl border border-slate-200 bg-[#f7f7f6]">
            <Canvas camera={{ position: [100, 2, 100], fov: 50, near: 0.1, far: 1000 }} style={{ width: '100%', height: '100%' }}>
              <ambientLight intensity={0.4} />
              <directionalLight position={[5, 5, 5]} intensity={4.2} castShadow />
              <directionalLight position={[18, -8, -9]} intensity={2.8} />
              <spotLight position={[0, -2, 0]} angle={0.5} penumbra={1} intensity={1.4} color="#ffffff" castShadow />
              <Deer position={[0, 0, 0]} scale={0.28} modelPath="/models/deer/scene.gltf" />
              <OrbitControls enableZoom={false} enablePan={false} enableRotate={true} target={[0, 0, 0]} />
            </Canvas>
          </div>
        </section>
      </main>

      <style jsx>{`
        @keyframes glow {
          0% { transform: scale(0.82); opacity: 0; }
          25% { transform: scale(1); opacity: 0.55; }
          55% { transform: scale(1.18); opacity: 0.4; }
          100% { transform: scale(1.35); opacity: 0; }
        }

        .animate-glow {
          animation: glow 2.7s ease-out;
        }

        .industrial-grid {
          background-image:
            linear-gradient(to right, rgba(15, 23, 42, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(15, 23, 42, 0.05) 1px, transparent 1px);
          background-size: 38px 38px;
        }
      `}</style>
    </div>
  );
};

export default ImageCropUploader;
