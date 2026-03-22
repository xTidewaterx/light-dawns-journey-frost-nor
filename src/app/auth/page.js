'use client';

import React from 'react';
import { SignInUser } from './SignIn';
import { RegisterUser } from './RegisterUser';
import OnboardingNotice from '../components/OnboardingNotice';

export default function AuthPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Konto</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Logg inn eller opprett bruker</h1>
          <p className="mt-2 text-sm text-slate-600">
            Her kan du komme i gang med NORYA. Som innlogget bruker kan du lagre favoritter, redigere profil og publisere produkter.
          </p>

          <div className="mt-5">
            <OnboardingNotice
              storageKey="norya_auth_page_intro_seen"
              title="Kom i gang"
              buttonLabel="Greit"
            >
              Hvis målet er å selge: opprett konto først, gå deretter til Min Profil og trykk Nytt Produkt.
            </OnboardingNotice>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <SignInUser />
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <RegisterUser />
          </div>
        </div>
      </div>
    </main>
  );
}
