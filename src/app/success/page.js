'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#faf7f1] via-[#f5efe3] to-[#e8dec8] p-6">
      <div className="w-full max-w-md rounded-2xl bg-white/85 backdrop-blur-md shadow-xl border border-white/70 px-8 py-10 text-center">
        <Image
          src="/NORYA-logo.png"
          alt="Norya"
          width={170}
          height={56}
          priority
          className="mx-auto mb-6 h-auto w-[170px]"
        />
        <p className="text-lg font-medium text-[#2d2a26]">Verifiserer betaling...</p>
      </div>
    </div>
  );

  if (status === "no_intent") return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#faf7f1] via-[#f5efe3] to-[#e8dec8] p-6">
      <div className="w-full max-w-md rounded-2xl bg-white/85 backdrop-blur-md shadow-xl border border-white/70 px-8 py-10 text-center">
        <Image
          src="/NORYA-logo.png"
          alt="Norya"
          width={170}
          height={56}
          priority
          className="mx-auto mb-6 h-auto w-[170px]"
        />
        <p className="text-lg font-semibold text-[#2d2a26]">Fant ingen betaling å bekrefte.</p>
      </div>
    </div>
  );

  if (status === "succeeded")
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#faf7f1] via-[#f5efe3] to-[#e8dec8] flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8 py-4 sm:py-8">
          <div className="flex items-center justify-center">
            <Image
              src="/NORYA-logo.png"
              alt="Norya"
              width={190}
              height={62}
              priority
              className="h-auto w-[150px] sm:w-[190px]"
            />
          </div>

          <div className="grid w-full grid-cols-1 items-center justify-items-center gap-8 lg:grid-cols-[1fr_1.2fr]">
            <div className="text-center">
              <p className="mb-3 text-sm uppercase tracking-[0.18em] text-[#8a7b58]">Ordrebekreftelse</p>
              <h1 className="mb-3 text-3xl font-semibold text-[#2f2a23] sm:text-4xl">Betalingen var vellykket</h1>
              <p className="mb-5 text-base text-[#5f5543] sm:text-lg">Takk for kjopet ditt. Bestillingen din er bekreftet og blir sendt snart.</p>
              <div className="inline-flex items-center bg-[#f9f4e8]/80 px-4 py-2 text-sm font-medium text-[#5f5543]">
                Sender deg tilbake til forsiden om {countdown} sekunder...
              </div>
            </div>

            <div className="h-[300px] w-full max-w-3xl overflow-hidden bg-gradient-to-b from-white/20 to-white/5 sm:h-[380px] md:h-[460px]">
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
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#fff4f1] to-[#ffe4de] p-6">
      <div className="w-full max-w-2xl rounded-2xl border border-[#ffd2c7] bg-white/90 p-6 text-center shadow-lg">
        <Image
          src="/NORYA-logo.png"
          alt="Norya"
          width={170}
          height={56}
          priority
          className="mx-auto mb-5 h-auto w-[170px]"
        />
        <h1 className="mb-4 text-3xl font-semibold text-[#9f2d1e]">Payment {status}</h1>
        <pre className="max-w-2xl overflow-auto rounded bg-[#fff7f4] p-4 text-left text-sm text-[#4a2d28]">
          {JSON.stringify(info, null, 2)}
        </pre>
      </div>
    </div>
  );
}
