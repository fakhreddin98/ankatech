# ANKA Tech – gemensam uppdragsportal

## Status och driftsättning

Koden är förberedd för befintlig Vercel-hosting. Portalen kräver ett Supabase-projekt
för Postgres, Auth och privat filförvaring. Den är inte driftklar utan konfigurationen
nedan. Behåll PR:en som utkast tills en Vercel Preview klarat acceptanstestet.
Ingen e-postbekräftelse eller automatisk e-postnotis ingår; ansökningar visas i admin.

1. Skapa ett Supabase-projekt i EU eller använd ett separat befintligt projekt.
2. Kör `db/portal.sql` en gång i SQL Editor. Använd ett tomt projekt/schema för dessa tabeller.
3. Skapa administratören under Authentication > Users med e-post och ett starkt lösenord.
   Stäng av publik registrering i Authentication-inställningarna.
4. Lägg in användarens faktiska UUID i `portal_admins` enligt sista raden i SQL-filen.
   Bara användare i den tabellen får administrera. Självregistrering ger aldrig adminåtkomst.
5. Lägg följande variabler i Vercel, både Preview och Production:
   - `SUPABASE_URL`: projektets HTTPS-URL.
   - `SUPABASE_SERVICE_ROLE_KEY`: den hemliga legacy service_role-nyckeln.
   - `PORTAL_ORIGIN`: `https://ankatech.se` (måste matcha den kanoniska domänen).
   Vercels automatiska `VERCEL_URL` tillåter också det aktuella preview-domännamnet.
   Nyckeln får ALDRIG läggas i GitHub, HTML, JavaScript i webbläsaren eller en NEXT_PUBLIC-variabel.
6. Använd Vercels statiska/Other-konfiguration med repots rot som projektrot och ingen
   separat output directory. `/api/portal.js` upptäcks som Node-function, kräver inga npm-paket.
7. Deploya en Preview och testa checklistan nedan. Lagra inte riktiga kandidat-CV i en
   delad utvecklingsmiljö. Använd helst separata Supabase-projekt för Preview/Production.
8. Kontrollera informationen på `integritet.html`, vilka administratörer som ska ha åtkomst
   och bolagets gallringsrutin innan publicering. Merge först efter fungerande helhetstest.

## Acceptanstest med tjänsterna anslutna

- Logga in på `/admin.html` med admin; ett vanligt Auth-konto ska nekas.
- Skapa utkast. Kontrollera att det inte syns offentligt, inte ens via direktlänk till ID.
- Lägg in titel, sammanfattning, beskrivning och ort. Publicera och kontrollera startsida,
  uppdragslista, sök/filter och detaljsida i mobil och desktop.
- Sök uppdraget med en test-PDF under 2 MB. Kontrollera mottagningsbekräftelse,
  jobbtitel och CV i admin. Testa även spontanansökan via kontakt- och uppdragssidan.
- Öppna CV-länken som admin. Länken gäller i 60 sekunder; en anonym API-användare får
  aldrig skapa länken eller läsa ansökningar.
- Ändra kandidatstatus och anteckningar; ladda om och kontrollera att de sparats.
- Stäng annonsen och försök skicka den gamla ansökningssidan: inskicket ska nekas.
- Radera testansökan i admin och kontrollera att CV-objektet också försvunnit.
- Testa simultan redigering: den andra sparningen ska ge konflikt, inte skriva över.
- Logga ut och kontrollera att admin-API:t nekar vidare åtkomst.

## Datamodell och drift

`portal_jobs` innehåller annonser inklusive utkast och valfria engelska texter.
`portal_applications` innehåller kandidatdata, anteckningar, status och CV-sökväg.
`portal_admins` kopplar Auth-konton till explicit adminbehörighet. `portal_limits`
begränsar antal inskick/inloggningsförsök per HMAC-hashad IP; utgångna poster rensas vid
nästa anrop. Publik API-respons innehåller bara öppna annonser, aldrig kandidater.

RLS är påslaget på alla tabeller. Inga anon/authenticated-policies skapas. Servern använder
service_role, validerar Auth-token och kontrollerar adminmedlemskap före privat läsning/skrivning.
Sessionen ligger i en HttpOnly, Secure, SameSite=Strict-cookie, högst en timme. Vid timeout
behöver admin logga in igen. Lösenordsåterställning hanteras i Supabase Dashboard i första versionen.
Muterande anrop kräver rätt Origin och JSON. Alla databasfilter valideras. CV lagras privat
och får endast laddas ned via tidsbegränsad länk. PDF max 2 MB håller JSON/base64 under
Vercels 4,5 MB-gräns. PDF-header verifieras; ingen antivirusmotor ingår.

Ansökningar lagras utan automatisk gallring. Admin kan radera ansökan inklusive CV.
Bestäm och dokumentera retention enligt bolagets faktiska rutiner. Inga CV eller
kandidatprofiler skrivs till det publika GitHub-repot.

## Övergång från Pages CMS och Getform

- Befintliga JSON-annonser importeras inte automatiskt. Vid granskningen fanns bara
  en stängd platshållare (`id: none`) i `content/assignments.json`.
- Startsida och nya uppdragssidor hämtar från samma API. Pages CMS uppdaterar inte den nya
  portalen. De gamla JSON-filerna ligger kvar endast för historik/rollback.
- Alla nya jobbansökningar och spontanansökningar går till portalen.
- Allmänna kontaktförfrågningar på kontaktsidan använder fortsatt befintlig Getform-endpoint.
- Historiska Getform-ansökningar ligger kvar där. En eventuell import behöver exporteras
  och hanteras separat; privata filer får inte checkas in i GitHub.
- Äldre länkar till JSON-annons-ID får en tydlig felvy. Lägg in ID-mappning/redirect om gamla
  annonser återpubliceras med nya databas-ID:n.

## Lokal verifiering

`node --test tests/portal-api.test.cjs` testar API-gränser med mockad Supabase-transport.
De testerna ersätter inte acceptanstestet mot en riktig ansluten Preview.

## Genomförd verifiering i utvecklingsmiljön

- 12 automatiska API-tester med mockad Supabase-transport passerar.
- Chromium-test med mockad API-data passerar: sökning/filter, detaljsida, ansökan med
  CV och uppdrags-ID, spontanansökan, admininloggning, redigering/förhandsgranskning,
  kandidatstatus, anteckningar, CV-länk och språkbyte.
- Vyerna kontrollerade visuellt i desktop och 390 px mobilbredd; ingen horisontell
  överströmning i den testade uppdragslistan.
- Live-integration mot Supabase/Vercel och SQL-migrationen är ännu inte körda.
