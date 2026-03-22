'use client';

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Deer from '../components/Deer';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("verifying");
  const [info, setInfo] = useState(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const payment_intent = searchParams.get("payment_intent");
    if (!payment_intent) {
      setStatus("no_intent");
      return;
    }

    async function verify() {
      try {
        const res = await fetch(`/api/verify-payment?payment_intent=${payment_intent}`);
        const data = await res.json();
        if (data.ok && data.status === "succeeded") {
          setStatus("succeeded");
          setInfo(data);
        } else {
          setStatus("failed");
          setInfo(data);
        }
      } catch (err) {
        setStatus("error");
        setInfo({ message: err.message });
      }
    }

    verify();
  }, [searchParams, router]);

  useEffect(() => {
    if (status === "succeeded") {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status]);

  useEffect(() => {
    if (countdown === 0 && status === "succeeded") {
      router.push("/");
    }
  }, [countdown, status, router]);

  if (status === "verifying") return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <p className="text-xl text-white">Verifying payment…</p>
    </div>
  );

  if (status === "no_intent") return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <p className="text-xl text-white">No payment intent found.</p>
    </div>
  );

  if (status === "succeeded")
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex flex-col items-center justify-center p-4">
        {/* Content Container */}
        <div className="flex flex-col items-center gap-12 w-full max-w-5xl">
          {/* Message Section */}
          <div className="text-center">
            <div className="text-7xl mb-6 animate-bounce">🎉</div>
            <h1 className="text-6xl font-bold text-blue-600 mb-4">
              Betalingen var vellykket!
            </h1>
            <p className="text-2xl text-gray-700 mb-3">
              Takk for kjøpet ditt
            </p>
            <p className="text-base text-gray-500 font-medium">
              Sender deg tilbake til forsiden om {countdown} sekunder...
            </p>
          </div>

          {/* Deer Animation Section - No box, blended background */}
          <div className="w-full" style={{ height: '500px' }}>
            <Canvas 
              camera={{ position: [100, 2, 100], fov: 50, near: 0.1, far: 1000 }} 
              style={{ width: '100%', height: '100%', background: 'transparent' }}
            >
              <ambientLight intensity={0.4} />
              <directionalLight position={[5, 5, 5]} intensity={4.2} castShadow />
              <directionalLight position={[18, -8, -9]} intensity={2.8} />
              <spotLight position={[0, -2, 0]} angle={0.5} penumbra={1} intensity={1.4} color="#ffffff" castShadow />
              <Deer position={[0, 0, 0]} scale={0.28} modelPath="/models/deer/scene.gltf" />
              <OrbitControls enableZoom={false} enablePan={false} enableRotate={true} target={[0, 0, 0]} />
            </Canvas>
          </div>

          {/* Footer Message */}
          <div className="text-center text-gray-600 text-sm">
            <p>Bestillingen din er bekreftet og blir sendt snart</p>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Payment {status}</h1>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-w-2xl">
          {JSON.stringify(info, null, 2)}
        </pre>
      </div>
    </div>
  );
}
