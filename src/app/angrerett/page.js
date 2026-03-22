export default function AngrerettPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-32 sm:px-8">
      <section className="mx-auto w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Retur</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Angrerett og retur</h1>
        <p className="mt-4 text-sm text-slate-600">Sist oppdatert: 22.03.2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700 sm:text-base">
          <section>
            <h2 className="text-lg font-semibold text-slate-900">1. Angrerett</h2>
            <p className="mt-2">
              Som forbruker har du normalt 14 dagers angrerett fra dagen du mottar varen,
              i tråd med angrerettloven.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">2. Slik bruker du angreretten</h2>
            <p className="mt-2">
              Gi oss tydelig beskjed på post@norya.no innen fristen. Oppgi ordrenummer og hvilke varer
              returen gjelder.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">3. Retur av varen</h2>
            <p className="mt-2">
              Varen skal returneres uten unødig opphold og senest innen 14 dager etter at du ga beskjed
              om at du angrer. Varen må være forsvarlig pakket.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">4. Tilbakebetaling</h2>
            <p className="mt-2">
              Tilbakebetaling skjer normalt innen 14 dager etter mottatt retur eller dokumentasjon på
              at varen er sendt tilbake.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">5. Unntak</h2>
            <p className="mt-2">
              Enkelte varer kan være unntatt angrerett, for eksempel spesialtilpassede produkter,
              i henhold til angrerettloven.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
