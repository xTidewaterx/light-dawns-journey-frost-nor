'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { auth, db } from '../../../firebase/firebaseConfig';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import ChatWindow from '../../../chat/ChatWindow';

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

export default function ProfilePage() {
  const { uid } = useParams();
  const [profileUser, setProfileUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  const [isChatVisible, setIsChatVisible] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [startingChat, setStartingChat] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const [images, setImages] = useState(['', '', '']);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [profileThemeId, setProfileThemeId] = useState('fjord');

  const storage = getStorage();
  const chatSectionRef = useRef(null);

  // Track logged-in user
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) setShowLogin(false);
    });
    return () => unsub();
  }, []);

  // Fetch profile
  useEffect(() => {
    async function fetchProfile() {
      if (!uid) return;

      try {
        const userRef = doc(db, 'publicUsers', uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) return;

        const data = snap.data();
        setProfileUser(data);
        setProfileThemeId(data.profileThemeId || 'fjord');

        const showcaseRef = collection(db, 'publicUsers', uid, 'showcase');
        const qShowcase = query(showcaseRef, orderBy('createdAt', 'desc'), limit(1));
        const showcaseSnap = await getDocs(qShowcase);

        if (!showcaseSnap.empty) {
          const showcase = showcaseSnap.docs[0].data();
          setText(showcase.text || '');
          setImages(showcase.images && showcase.images.length === 3 ? showcase.images : ['', '', '']);
        } else {
          setImages(data.showcasePhotos || ['', '', '']);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    }

    fetchProfile();
  }, [uid]);

  useEffect(() => {
    async function fetchFavorites() {
      if (!uid) return;
      setLoadingFavorites(true);
      try {
        const userDocRef = doc(db, 'users', uid);
        const favoritesRef = collection(userDocRef, 'favourites');
        const snapshot = await getDocs(favoritesRef);
        const favoriteIds = snapshot.docs.map((doc) => doc.data().productId).filter(Boolean);

        if (favoriteIds.length === 0) {
          setFavoriteProducts([]);
          return;
        }

        const res = await fetch('/api/products');
        const json = await res.json();
        if (json.data) {
          const favorites = json.data.filter((p) => favoriteIds.includes(p.id));
          setFavoriteProducts(favorites);
        } else {
          setFavoriteProducts([]);
        }
      } catch (err) {
        console.error('Failed to fetch favorites:', err);
        setFavoriteProducts([]);
      } finally {
        setLoadingFavorites(false);
      }
    }

    fetchFavorites();
  }, [uid]);

  useEffect(() => {
    if (isChatVisible && chatId && chatSectionRef.current) {
      chatSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isChatVisible, chatId]);

  const isOwnProfile = currentUser?.uid === uid;

  // Upload and replace showcase image
  async function handleImageReplace(index, file) {
    if (!file || !isOwnProfile) return;
    setUploading(true);
    setMessage('');

    try {
      const storageRef = ref(storage, `users/${uid}/showcase/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const newImages = [...images];
      newImages[index] = url;
      setImages(newImages);
    } catch (err) {
      console.error('Image upload failed:', err);
      setMessage('❌ Image upload failed.');
    } finally {
      setUploading(false);
    }
  }

  // Save showcase edits
  async function handleSave() {
    if (!isOwnProfile) {
      setMessage('You do not have permission to save this profile.');
      return;
    }

    setUploading(true);
    try {
      const showcaseData = {
        text: text.trim(),
        images: images.filter(Boolean),
        createdAt: serverTimestamp(),
      };

      const userDocRef = doc(db, 'users', uid);
      const publicUserDocRef = doc(db, 'publicUsers', uid);

      const showcaseUserRef = collection(db, 'users', uid, 'showcase');
      const showcasePublicRef = collection(db, 'publicUsers', uid, 'showcase');

      await Promise.all([
        addDoc(showcaseUserRef, showcaseData),
        addDoc(showcasePublicRef, showcaseData),
        setDoc(userDocRef, { showcasePhotos: images, profileThemeId, lastUpdated: serverTimestamp() }, { merge: true }),
        setDoc(publicUserDocRef, { showcasePhotos: images, profileThemeId, lastUpdated: serverTimestamp() }, { merge: true }),
      ]);

      setEditing(false);
      setMessage('✅ Saved successfully!');
    } catch (err) {
      console.error('Save failed:', err);
      setMessage('❌ Failed to save showcase.');
    } finally {
      setUploading(false);
    }
  }

  // CHAT SYSTEM RESTORED ----------------------------

  async function handleStartChat() {
    if (!currentUser || !uid) {
      setShowLogin(true);
      return;
    }

    setStartingChat(true);

    try {
      const sortedUIDs = [currentUser.uid, uid].sort();
      const chatsRef = collection(db, 'chats');
      const chatQuery = query(chatsRef, where('participants', '==', sortedUIDs));
      const snapshot = await getDocs(chatQuery);

      let chatRefId;
      if (!snapshot.empty) {
        chatRefId = snapshot.docs[0].id;
      } else {
        const newChatRef = await addDoc(chatsRef, {
          participants: sortedUIDs,
          createdAt: serverTimestamp(),
          lastMessage: '',
          lastSender: '',
        });
        chatRefId = newChatRef.id;

        await addDoc(collection(db, 'chats', chatRefId, 'messages'), {
          text: `${currentUser.uid} started the chat.`,
          sender: currentUser.uid,
          createdAt: serverTimestamp(),
        });
      }

      setChatId(chatRefId);
      setIsChatVisible(true);
    } catch (err) {
      console.error('Failed to start chat:', err);
    } finally {
      setStartingChat(false);
    }
  }

  async function handleSignIn(e) {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowLogin(false);
      setEmail('');
      setPassword('');
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleGoogleSignIn() {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setShowLogin(false);
    } catch (err) {
      alert(err.message);
    }
  }

  // -------------------------------------------------

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 pt-36">
        <p className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-lg text-slate-600 shadow-sm">
          Laster profil...
        </p>
      </div>
    );
  }

  const displayName = profileUser.displayName || 'No name';
  const photoURL = profileUser.photoURL || '/images/default-avatar.png';
  const subtext = profileUser.subtext || 'No description yet.';
  const combinedPhotos = images.map((img, i) => img || `/images/placeholder${i + 1}.jpg`);
  const favoritesCount = favoriteProducts.length;
  const activeTheme = PROFILE_THEMES.find((theme) => theme.id === profileThemeId) || PROFILE_THEMES[0];
  const profileSurfaceStyle = {
    background: `radial-gradient(1200px 500px at 10% 0%, ${hexToRgba(activeTheme.accent, 0.11)} 0%, rgba(255,255,255,0) 70%), ${activeTheme.surface}`,
  };

  return (
    <div className="min-h-screen px-4 pb-16 pt-32 text-slate-900 sm:px-8" style={profileSurfaceStyle}>
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-3xl border bg-white shadow-sm" style={{ borderColor: activeTheme.border }}>
          <div
            className="border-b bg-white px-6 py-4 text-xs uppercase tracking-[0.26em] text-slate-500"
            style={{ borderColor: hexToRgba(activeTheme.accent, 0.2), backgroundColor: hexToRgba(activeTheme.accent, 0.05) }}
          >
            Skaperprofil
          </div>
          <div className="px-6 py-8 sm:px-10">
            <div className="flex flex-col items-center text-center">
              <img
                src={photoURL}
                alt={displayName}
                className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-md ring-1 ring-slate-200"
              />
              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900">{displayName}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">{subtext}</p>

              {isOwnProfile ? (
                <button
                  onClick={() => setEditing(!editing)}
                  className="mt-6 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 active:brightness-90"
                  style={{ backgroundColor: activeTheme.accent, borderColor: activeTheme.accent }}
                >
                  {editing ? 'Avslutt redigering' : 'Rediger side'}
                </button>
              ) : currentUser ? (
                <button
                  onClick={handleStartChat}
                  disabled={startingChat}
                  className="mt-6 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 active:brightness-90 disabled:cursor-not-allowed disabled:opacity-70"
                  style={{ backgroundColor: activeTheme.accent, borderColor: activeTheme.accent }}
                >
                  {startingChat ? 'Åpner samtale...' : 'Send melding'}
                </button>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="mt-6 rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Logg inn for melding
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Utvalgte bilder</h2>
            {editing && isOwnProfile && (
              <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600">
                Redigeringsmodus
              </span>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 lg:col-span-2">
              <img
                src={combinedPhotos[0]}
                alt="Main showcase"
                className={`h-[380px] w-full object-cover sm:h-[440px] ${editing ? 'opacity-75' : ''}`}
              />
              {editing && (
                <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-slate-900/40 transition hover:bg-slate-900/50">
                  <span className="rounded-full border border-white/70 px-4 py-2 text-sm font-semibold text-white">Bytt bilde</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageReplace(0, e.target.files[0])}
                  />
                </label>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {combinedPhotos.slice(1, 3).map((url, idx) => (
                <div key={idx} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                  <img
                    src={url}
                    alt={`Showcase ${idx + 2}`}
                    className={`h-[190px] w-full object-cover lg:h-[212px] ${editing ? 'opacity-75' : ''}`}
                  />
                  {editing && (
                    <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-slate-900/40 transition hover:bg-slate-900/50">
                      <span className="rounded-full border border-white/70 px-4 py-2 text-sm font-semibold text-white">Bytt bilde</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageReplace(idx + 1, e.target.files[0])}
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Om skaperen</h2>
          {editing ? (
            <>
              <div className="mt-4">
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

              <textarea
                className="mt-4 h-44 w-full rounded-2xl border border-slate-300 p-4 text-base text-slate-800 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Skriv litt om deg og arbeidet ditt..."
              />
            </>
          ) : (
            <p className="mt-4 text-base leading-relaxed text-slate-700 sm:text-lg">
              {text || 'Denne skaperen har ikke lagt inn en beskrivelse ennå.'}
            </p>
          )}

          {editing && isOwnProfile && (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={handleSave}
                disabled={uploading}
                className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition hover:brightness-95 active:brightness-90 disabled:cursor-not-allowed disabled:opacity-70"
                style={{ backgroundColor: activeTheme.accent }}
              >
                {uploading ? 'Lagrer...' : 'Lagre endringer'}
              </button>
              {message && <p className="text-sm text-slate-600">{message}</p>}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Favoritter</h2>
            <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600">
              {favoritesCount}
            </span>
          </div>

          {loadingFavorites ? (
            <p className="text-slate-600">Laster favoritter...</p>
          ) : favoriteProducts.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-slate-600">
              Ingen favoritter tilgjengelig.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {favoriteProducts.map((product) => (
                <a
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_6px_16px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.1)]"
                >
                  <div className="overflow-hidden rounded-xl bg-slate-100">
                    <img
                      src={product.images?.[0] || '/placeholder.jpg'}
                      alt={product.name}
                      className="h-44 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="pt-3">
                    <div className="truncate text-base font-semibold text-slate-900">{product.name || 'Ukjent produkt'}</div>
                    <div className="mt-1 text-sm text-slate-600">
                      {product.currency?.toUpperCase() || 'NOK'} {product.price ?? 0}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>

        {isChatVisible && chatId && currentUser && (
          <section ref={chatSectionRef} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Samtale</h2>
            <div className="mt-4">
              <ChatWindow chatId={chatId} currentUserId={currentUser.uid} />
            </div>
          </section>
        )}
      </div>

      {/* Login Modal */}
      {showLogin && !currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7">
            <h2 className="text-center text-2xl font-semibold text-slate-900">Logg inn for å fortsette</h2>
            <p className="mt-2 text-center text-sm text-slate-600">Du må være logget inn for å sende meldinger.</p>

            <form onSubmit={handleSignIn} className="mt-5">
              <input
                type="email"
                placeholder="E-post"
                className="mb-3 w-full rounded-xl border border-slate-300 p-3 text-slate-800 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Passord"
                className="mb-3 w-full rounded-xl border border-slate-300 p-3 text-slate-800 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="submit"
                className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:brightness-95 active:brightness-90"
                style={{ backgroundColor: activeTheme.accent }}
              >
                Logg inn
              </button>
            </form>

            <button
              onClick={handleGoogleSignIn}
              className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Fortsett med Google
            </button>

            <button
              onClick={() => setShowLogin(false)}
              className="mt-3 w-full text-center text-sm text-slate-500 underline"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
