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
import { Cormorant_Garamond, Space_Grotesk } from 'next/font/google';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

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

const STOCK_ART_IMAGES = [
  'https://picsum.photos/id/1011/1400/1000',
  'https://picsum.photos/id/1025/1400/1000',
  'https://picsum.photos/id/1035/1400/1000',
  'https://picsum.photos/id/1043/1400/1000',
  'https://picsum.photos/id/1050/1400/1000',
  'https://picsum.photos/id/1062/1400/1000',
  'https://picsum.photos/id/1074/1400/1000',
  'https://picsum.photos/id/1084/1400/1000',
];

function getFallbackImage(index) {
  return `https://picsum.photos/seed/norya-${index + 1}/1400/1000`;
}

const PATCHWORK_LAYOUTS = [
  { tileClass: '', imageClass: 'h-52 sm:h-56 md:h-48' },
  { tileClass: '', imageClass: 'h-80 sm:h-96 md:h-96' },
  { tileClass: '', imageClass: 'h-56 sm:h-64 md:h-56' },
  { tileClass: '', imageClass: 'h-48 sm:h-52 md:h-48' },
  { tileClass: '', imageClass: 'h-80 sm:h-96 md:h-96' },
  { tileClass: '', imageClass: 'h-56 sm:h-64 md:h-56' },
  { tileClass: '', imageClass: 'h-48 sm:h-52 md:h-48' },
  { tileClass: '', imageClass: 'h-64 sm:h-72 md:h-64' },
];

const TEXT_SIZE_CLASSES = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

function createDefaultPosts() {
  return STOCK_ART_IMAGES.map((imageUrl, index) => ({
    id: `stock-${index + 1}`,
    imageUrl,
    text:
      index === 0
        ? 'A quiet study in texture and light. This is placeholder text that can be edited or removed.'
        : index === 1
          ? 'Material notes, process fragments, and a short curator-style caption live here as demo content.'
          : '',
    textSize: index % 4 === 0 ? 'lg' : 'md',
  }));
}

function normalizeShowcasePosts(sourcePosts) {
  const defaults = createDefaultPosts();
  const usable = Array.isArray(sourcePosts) ? sourcePosts.slice(0, 8) : [];
  if (usable.length === 0) {
    return defaults.slice(0, 8);
  }

  return usable.map((post, index) => ({
    id: post.id || `post-${index + 1}`,
    imageUrl: post.imageUrl || defaults[index]?.imageUrl || defaults[0].imageUrl,
    text: typeof post.text === 'string' ? post.text : '',
    textSize: TEXT_SIZE_CLASSES[post.textSize] ? post.textSize : 'md',
  }));
}

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
  const [bio, setBio] = useState('');
  const [showcasePosts, setShowcasePosts] = useState([]);
  const [expandedPostIds, setExpandedPostIds] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [profileThemeId, setProfileThemeId] = useState('fjord');
  const [productCount, setProductCount] = useState(0);
  const [creatorProducts, setCreatorProducts] = useState([]);
  const [loadingCreatorProducts, setLoadingCreatorProducts] = useState(true);

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
        setBio(data.subtext || '');

        const showcaseRef = collection(db, 'publicUsers', uid, 'showcase');
        const qShowcase = query(showcaseRef, orderBy('createdAt', 'desc'), limit(1));
        const showcaseSnap = await getDocs(qShowcase);

        if (!showcaseSnap.empty) {
          const showcase = showcaseSnap.docs[0].data();
          const mappedFromLegacy = Array.isArray(showcase.images)
            ? showcase.images.slice(0, 8).map((imageUrl, index) => ({
                id: `legacy-${index + 1}`,
                imageUrl,
                text: index === 0 ? showcase.text || '' : '',
                textSize: 'md',
              }))
            : [];
          setShowcasePosts(normalizeShowcasePosts(showcase.showcasePosts || mappedFromLegacy));
          if (!data.subtext && showcase.text) {
            setBio(showcase.text);
          }
        } else {
          const legacyPosts = (data.showcasePhotos || []).slice(0, 8).map((imageUrl, index) => ({
            id: `legacy-user-${index + 1}`,
            imageUrl,
            text: '',
            textSize: 'md',
          }));
          setShowcasePosts(normalizeShowcasePosts(legacyPosts));
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    }

    fetchProfile();
  }, [uid]);

  useEffect(() => {
    async function fetchCreatorProducts() {
      if (!uid) return;
      setLoadingCreatorProducts(true);

      try {
        const res = await fetch(`/api/creatorProducts?creator=${encodeURIComponent(uid)}`);
        const json = await res.json();

        const products = Array.isArray(json?.data) ? json.data : [];
        setCreatorProducts(products);
        setProductCount(products.length);
      } catch (err) {
        console.error('Failed to fetch creator products:', err);
        setCreatorProducts([]);
        setProductCount(0);
      } finally {
        setLoadingCreatorProducts(false);
      }
    }

    fetchCreatorProducts();
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

  async function handlePostImageReplace(index, file) {
    if (!file || !isOwnProfile) return;
    setUploading(true);
    setMessage('');

    try {
      const storageRef = ref(storage, `users/${uid}/showcasePosts/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      setShowcasePosts((prev) => {
        const updated = [...prev];
        if (!updated[index]) return prev;
        updated[index] = { ...updated[index], imageUrl: url };
        return updated;
      });
    } catch (err) {
      console.error('Image upload failed:', err);
      setMessage('Image upload failed.');
    } finally {
      setUploading(false);
    }
  }

  function handlePostTextChange(index, value) {
    setShowcasePosts((prev) => {
      const updated = [...prev];
      if (!updated[index]) return prev;
      updated[index] = { ...updated[index], text: value };
      return updated;
    });
  }

  function handlePostTextSizeChange(index, value) {
    setShowcasePosts((prev) => {
      const updated = [...prev];
      if (!updated[index]) return prev;
      updated[index] = {
        ...updated[index],
        textSize: TEXT_SIZE_CLASSES[value] ? value : 'md',
      };
      return updated;
    });
  }

  function handleAddPost() {
    setShowcasePosts((prev) => {
      if (prev.length >= 8) return prev;
      const fallback = createDefaultPosts();
      const nextIndex = prev.length;
      return [
        ...prev,
        {
          id: `custom-${Date.now()}`,
          imageUrl: fallback[nextIndex]?.imageUrl || fallback[0].imageUrl,
          text: '',
          textSize: nextIndex % 3 === 0 ? 'lg' : 'md',
        },
      ];
    });
  }

  function handleRemovePost(index) {
    setShowcasePosts((prev) => prev.filter((_, idx) => idx !== index));
  }

  function togglePostText(postId) {
    setExpandedPostIds((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
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
        text: bio.trim(),
        images: showcasePosts.map((post) => post.imageUrl).filter(Boolean).slice(0, 8),
        showcasePosts: showcasePosts.slice(0, 8).map((post) => ({
          id: post.id,
          imageUrl: post.imageUrl,
          text: (post.text || '').trim(),
          textSize: post.textSize || 'md',
        })),
        createdAt: serverTimestamp(),
      };

      const userDocRef = doc(db, 'users', uid);
      const publicUserDocRef = doc(db, 'publicUsers', uid);

      const showcaseUserRef = collection(db, 'users', uid, 'showcase');
      const showcasePublicRef = collection(db, 'publicUsers', uid, 'showcase');

      await Promise.all([
        addDoc(showcaseUserRef, showcaseData),
        addDoc(showcasePublicRef, showcaseData),
        setDoc(
          userDocRef,
          {
            showcasePhotos: showcaseData.images,
            showcasePosts: showcaseData.showcasePosts,
            subtext: bio.trim(),
            profileThemeId,
            lastUpdated: serverTimestamp(),
          },
          { merge: true }
        ),
        setDoc(
          publicUserDocRef,
          {
            showcasePhotos: showcaseData.images,
            showcasePosts: showcaseData.showcasePosts,
            subtext: bio.trim(),
            profileThemeId,
            lastUpdated: serverTimestamp(),
          },
          { merge: true }
        ),
      ]);

      setProfileUser((prev) => (prev ? { ...prev, subtext: bio.trim(), profileThemeId } : prev));
      setEditing(false);
      setMessage('Saved successfully.');
    } catch (err) {
      console.error('Save failed:', err);
      setMessage('Failed to save showcase.');
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
  const subtext = bio || 'No description yet.';
  const favoritesCount = favoriteProducts.length;
  const activeTheme = PROFILE_THEMES.find((theme) => theme.id === profileThemeId) || PROFILE_THEMES[0];
  const profileSurfaceStyle = {
    background: `radial-gradient(1200px 500px at 10% 0%, ${hexToRgba(activeTheme.accent, 0.11)} 0%, rgba(255,255,255,0) 70%), ${activeTheme.surface}`,
  };
  const defaults = createDefaultPosts();
  const visiblePosts = [...showcasePosts, ...defaults.slice(showcasePosts.length)].slice(0, 8);

  return (
    <div className={`${spaceGrotesk.className} min-h-screen px-4 pb-16 pt-24 text-slate-900 sm:px-8 lg:pt-28`} style={profileSurfaceStyle}>
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <section className="relative overflow-hidden rounded-3xl border bg-white shadow-sm" style={{ borderColor: activeTheme.border }}>
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full blur-3xl"
            style={{ backgroundColor: hexToRgba(activeTheme.accent, 0.22) }}
          />
          <div className="px-6 py-6 sm:px-10 sm:py-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
              <img
                src={photoURL}
                alt={displayName}
                className="h-24 w-24 shrink-0 rounded-full border-4 border-white object-cover shadow-md ring-1 ring-slate-200 sm:h-28 sm:w-28"
              />
              <div className="text-center sm:text-left">
                <h1 className={`${cormorant.className} text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl`}>
                  {displayName}
                </h1>

                <div className="mt-3 flex items-center justify-center gap-4 text-sm text-slate-600 sm:justify-start">
                  <p>
                    Products <span className="font-semibold text-slate-900">{productCount}</span>
                  </p>
                  <span
                    aria-label={`Palette ${activeTheme.name}`}
                    title={activeTheme.name}
                    className="h-4 w-4 rounded-full ring-1 ring-slate-300"
                    style={{ backgroundColor: activeTheme.accent }}
                  />
                </div>

                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">{subtext}</p>

                {isOwnProfile ? (
                  <button
                    onClick={() => setEditing(!editing)}
                    className="mt-4 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 active:brightness-90"
                    style={{ backgroundColor: activeTheme.accent, borderColor: activeTheme.accent }}
                  >
                    {editing ? 'Avslutt redigering' : 'Rediger side'}
                  </button>
                ) : currentUser ? (
                  <button
                    onClick={handleStartChat}
                    disabled={startingChat}
                    className="mt-4 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 active:brightness-90 disabled:cursor-not-allowed disabled:opacity-70"
                    style={{ backgroundColor: activeTheme.accent, borderColor: activeTheme.accent }}
                  >
                    {startingChat ? 'Åpner samtale...' : 'Send melding'}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowLogin(true)}
                    className="mt-4 rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Logg inn for melding
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className={`${cormorant.className} text-3xl font-semibold text-slate-900 sm:text-4xl`}></h2>
            {editing && isOwnProfile && (
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600">
                  Edit mode
                </span>
                <button
                  onClick={handleAddPost}
                  disabled={visiblePosts.length >= 8}
                  className="rounded-full px-3 py-1 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ backgroundColor: activeTheme.accent }}
                >
                  Add post ({visiblePosts.length}/8)
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((columnIndex) => (
              <div key={`column-${columnIndex}`} className="space-y-4">
                {visiblePosts
                  .map((post, idx) => ({ post, idx }))
                  .filter(({ idx }) => idx % 4 === columnIndex)
                  .map(({ post, idx }) => {
                    const layout = PATCHWORK_LAYOUTS[idx] || PATCHWORK_LAYOUTS[PATCHWORK_LAYOUTS.length - 1];
                    const hasText = Boolean(post.text && post.text.trim());
                    const isExpanded = expandedPostIds.includes(post.id);

                    return (
                      <article
                        key={post.id}
                        className={`overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-[0_10px_24px_rgba(15,23,42,0.12)] transition-transform duration-300 active:scale-[0.992] ${isExpanded ? 'gallery-card-bounce' : ''}`}
                        onClick={() => {
                          if (!editing && hasText) {
                            togglePostText(post.id);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (!editing && hasText && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            togglePostText(post.id);
                          }
                        }}
                        role={!editing && hasText ? 'button' : undefined}
                        tabIndex={!editing && hasText ? 0 : undefined}
                        aria-expanded={!editing && hasText ? isExpanded : undefined}
                        aria-label={!editing && hasText ? `Toggle text for image ${idx + 1}` : undefined}
                      >
                        <div className="relative">
                          <img
                            src={post.imageUrl}
                            alt={`Gallery image ${idx + 1}`}
                            className={`${layout.imageClass} block w-full object-cover transition duration-700 ${isExpanded ? 'scale-[1.02]' : 'scale-100'}`}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = getFallbackImage(idx);
                            }}
                          />

                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-900/70 to-transparent" />

                          {!editing && hasText && (
                            <div className="absolute bottom-3 right-3 rounded-full border border-white/70 bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                              {isExpanded ? 'Hide text' : 'Click image for text'}
                            </div>
                          )}

                          {editing && isOwnProfile && (
                            <div className="absolute inset-0 flex flex-col justify-between bg-slate-900/35 p-3">
                              <div className="flex items-center justify-between gap-2">
                                <label className="cursor-pointer rounded-full border border-white/70 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                                  Upload image
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handlePostImageReplace(idx, e.target.files[0])}
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePost(idx)}
                                  className="rounded-full border border-white/70 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur"
                                >
                                  Remove
                                </button>
                              </div>

                              <div className="rounded-xl border border-white/60 bg-white/85 p-2 text-slate-800">
                                <select
                                  className="mb-2 w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs"
                                  value={post.textSize || 'md'}
                                  onChange={(e) => handlePostTextSizeChange(idx, e.target.value)}
                                >
                                  <option value="sm">Small text</option>
                                  <option value="md">Medium text</option>
                                  <option value="lg">Large text</option>
                                  <option value="xl">XL text</option>
                                </select>
                                <textarea
                                  className="h-20 w-full resize-none rounded-lg border border-slate-300 px-2 py-1 text-xs outline-none focus:border-slate-500"
                                  value={post.text || ''}
                                  onChange={(e) => handlePostTextChange(idx, e.target.value)}
                                  placeholder="Optional foldout text"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {!editing && hasText && (
                          <div
                            className={`grid transition-all duration-500 ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                          >
                            <div className="-mt-px overflow-hidden">
                              <div
                                className={`px-4 py-3 text-white ${isExpanded ? 'coil-unfurl' : ''}`}
                                style={{
                                  backgroundColor: hexToRgba(activeTheme.accent, 0.9),
                                }}
                              >
                                <p className={`${TEXT_SIZE_CLASSES[post.textSize] || 'text-base'} leading-relaxed`}>
                                  {post.text}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className={`${cormorant.className} text-3xl font-semibold text-slate-900 sm:text-4xl`}>About The Artist</h2>
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
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a short artist bio..."
              />
            </>
          ) : (
            <p className="mt-4 text-base leading-relaxed text-slate-700 sm:text-lg">
              {bio || 'Denne skaperen har ikke lagt inn en beskrivelse ennå.'}
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

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Produkter fra {displayName}</h2>
            <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600">
              {productCount}
            </span>
          </div>

          {loadingCreatorProducts ? (
            <p className="text-slate-600">Laster produkter...</p>
          ) : creatorProducts.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-slate-600">
              Denne skaperen har ingen produkter ute ennå.
            </p>
          ) : (
            <div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2">
              {creatorProducts.map((product) => (
                <a
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group w-64 shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_6px_16px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.1)]"
                >
                  <div className="overflow-hidden rounded-xl bg-slate-100">
                    <img
                      src={product.images?.[0] || '/placeholder.jpg'}
                      alt={product.name || 'Produkt'}
                      className="h-40 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="pt-3">
                    <div className="truncate text-base font-semibold text-slate-900">{product.name || 'Ukjent produkt'}</div>
                    <div className="mt-1 text-sm text-slate-600">NOK {product.price ?? 0}</div>
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

      <style jsx>{`
        @keyframes coilUnfurl {
          0% {
            transform: translateY(-14px) scaleY(0.62) scaleX(1.06);
            transform-origin: top;
          }
          45% {
            transform: translateY(5px) scaleY(1.12) scaleX(0.96);
          }
          72% {
            transform: translateY(-3px) scaleY(0.96) scaleX(1.02);
          }
          100% {
            transform: translateY(0) scaleY(1) scaleX(1);
          }
        }

        @keyframes galleryCardBounce {
          0% {
            transform: translateY(0) scaleY(1) scaleX(1);
          }
          35% {
            transform: translateY(5px) scaleY(0.97) scaleX(1.02);
          }
          65% {
            transform: translateY(-3px) scaleY(1.02) scaleX(0.99);
          }
          100% {
            transform: translateY(0) scaleY(1) scaleX(1);
          }
        }

        .coil-unfurl {
          animation: coilUnfurl 620ms cubic-bezier(0.2, 1.05, 0.3, 1);
        }

        .gallery-card-bounce {
          animation: galleryCardBounce 560ms cubic-bezier(0.2, 0.95, 0.3, 1);
        }
      `}</style>
    </div>
  );
}
