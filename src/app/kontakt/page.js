export default function KontaktPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-32 sm:px-8">
      <section className="mx-auto w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Kontakt</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Kontakt oss</h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-700 sm:text-base">
          Har du spørsmål om bestilling, levering, retur eller produkter? Vi hjelper deg gjerne.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">E-post</h2>
            <p className="mt-2 text-slate-800">post@norya.no</p>
            <p className="mt-1 text-sm text-slate-600">Vi svarer normalt innen 1-2 virkedager.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">Kundeservice</h2>
            <p className="mt-2 text-slate-800">Mandag-fredag: 09:00-16:00</p>
            <p className="mt-1 text-sm text-slate-600">Henvendelser utenfor åpningstid besvares neste virkedag.</p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">Selskapsinformasjon</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            NORYA er en kuratert markedsplass for skapere. Fullstendige virksomhetsopplysninger og
            organisasjonsnummer oppgis i ordrebekreftelse og på faktura.
          </p>
        </div>
      </section>
    </main>
  );
}
