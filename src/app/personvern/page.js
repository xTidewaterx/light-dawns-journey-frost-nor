export default function PersonvernPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-32 sm:px-8">
      <section className="mx-auto w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Personvern</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Personvernerklæring</h1>
        <p className="mt-4 text-sm text-slate-600">Sist oppdatert: 22.03.2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700 sm:text-base">
          <section>
            <h2 className="text-lg font-semibold text-slate-900">1. Behandlingsansvarlig</h2>
            <p className="mt-2">
              NORYA er behandlingsansvarlig for personopplysninger som samles inn via nettsiden.
              Ved spørsmål om personvern, kontakt oss på post@norya.no.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">2. Hvilke opplysninger vi behandler</h2>
            <p className="mt-2">
              Vi kan behandle navn, e-postadresse, leveringsadresse, betalingsinformasjon, ordrehistorikk
              og tekniske data (for eksempel IP-adresse og enhetsinformasjon).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">3. Formål og rettslig grunnlag</h2>
            <p className="mt-2">
              Opplysninger behandles for å oppfylle avtale (kjøp og levering), oppfylle rettslige
              forpliktelser (bokføringsregler) og for legitim interesse (sikkerhet, forbedring av tjenester).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">4. Deling av opplysninger</h2>
            <p className="mt-2">
              Vi deler kun nødvendige opplysninger med betalingsleverandører, fraktpartnere og tekniske
              tjenesteleverandører som databehandlere.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">5. Lagringstid</h2>
            <p className="mt-2">
              Opplysninger lagres så lenge det er nødvendig for formålet, eller så lenge loven krever det,
              for eksempel etter bokføringsregelverket.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">6. Dine rettigheter</h2>
            <p className="mt-2">
              Du har rett til innsyn, retting, sletting, begrensning, dataportabilitet og å protestere mot
              behandlingen. Du kan også klage til Datatilsynet dersom du mener personvernet ditt er brutt.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
