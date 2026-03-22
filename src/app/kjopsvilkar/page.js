export default function KjopsvilkarPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-32 sm:px-8">
      <section className="mx-auto w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Vilkår</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Kjøpsvilkår</h1>
        <p className="mt-4 text-sm text-slate-600">Sist oppdatert: 22.03.2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700 sm:text-base">
          <section>
            <h2 className="text-lg font-semibold text-slate-900">1. Generelt</h2>
            <p className="mt-2">
              Disse vilkårene gjelder kjøp av produkter via NORYA. Ved bestilling aksepterer du
              gjeldende vilkår.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">2. Priser og betaling</h2>
            <p className="mt-2">
              Alle priser oppgis i NOK og inkluderer merverdiavgift med mindre annet er opplyst.
              Betaling gjennomføres via tilgjengelige betalingsmetoder i kassen.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">3. Levering</h2>
            <p className="mt-2">
              Leveringstid avhenger av produkt og transportør. Estimert leveringstid opplyses i
              bestillingsprosessen. Forsinkelser kan forekomme i høysesong.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">4. Reklamasjon</h2>
            <p className="mt-2">
              Dersom produktet har en mangel, har du rettigheter etter forbrukerkjøpsloven.
              Reklamasjon meldes til post@norya.no innen rimelig tid etter at mangelen ble oppdaget.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">5. Forbehold</h2>
            <p className="mt-2">
              Vi tar forbehold om skrivefeil, prisendringer, lagerstatus og tekniske feil.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
