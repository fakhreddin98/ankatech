# ANKA Tech webbplats

Den här versionen behåller samma filstruktur som din nuvarande zip: HTML-, CSS-, JS- och bildfiler ligger direkt i huvudmappen `ankatech-main/`.

## Nytt i denna version
- Modernare teknisk design med rörliga element.
- Animerad canvas-bakgrund med punkter och linjer.
- Hero med scanline, orbit-effekter och tekniska HUD-kort.
- Språkknapp för svenska och engelska.
- Val av språk sparas i webbläsaren med localStorage.
- Alla bilder och loggor används från samma struktur som nuvarande zip.

## Kör lokalt
Öppna `index.html` direkt i webbläsaren eller kör:

```bash
python3 -m http.server 8000
```

Gå sedan till:

```text
http://localhost:8000
```

## Kontaktformulär
I `kontakt.html`, byt:

```html
https://formsubmit.co/REPLACE_WITH_YOUR_EMAIL
```

till den e-postadress som ska ta emot formuläret.

## Publicering
Filerna kan publiceras direkt på Netlify, Vercel, GitHub Pages eller ett vanligt webbhotell. Eftersom sidan är statisk behövs ingen backend för att visa sidan.

## Viktig fix i denna version
Denna version tar bort synliga `\n`-tecken som kunde visas på sidan. Det berodde på att radbrytningar hade hamnat som text i HTML-filerna i stället för riktiga radbrytningar.

## Header-fix
Headern ligger nu alltid över innehållet och är klickbar. Den försvinner automatiskt när man scrollar nedåt och kommer tillbaka när man scrollar uppåt. Nära toppen visas den alltid.


## UI-fixar
- Logoväggen i sektionen med partners/tekniskt sammanhang har fått tydligare luft så rubriken inte hamnar över loggorna.
- Språkväljaren är omgjord till en tydligare tvåläges-switch med separata knappar för SV och EN.

## Uppdrag och ansökningar

Den här versionen har en enkel uppdragsmodul.

### Lägga till uppdrag
Öppna filen `assignments-data.js`.

Kopiera ett befintligt uppdrag och ändra:
- `id`
- `title`
- `location`
- `scope`
- `start`
- `tags`
- `description`
- `featured: true` om uppdraget ska synas på startsidan
- `status: "open"` för aktivt uppdrag

Spara filen och ladda upp sidan igen.

### Ansökningsformulär
På sidan `uppdrag.html` finns:
- formulär för att söka ett specifikt uppdrag
- formulär för spontanansökan med CV

Byt `REPLACE_WITH_YOUR_EMAIL` i `uppdrag.html` till rätt e-postadress.
Samma sak gäller kontaktformuläret i `kontakt.html`.

### Viktigt
Detta är en statisk lösning. För att lägga upp uppdrag via ett admin-gränssnitt behövs senare en backend eller CMS, till exempel:
- Netlify CMS / Decap CMS
- Sanity
- WordPress headless
- Supabase
- egen adminpanel

## Getform

Alla formulär är nu kopplade till samma Getform-endpoint:

`https://getform.io/f/9yi31ff8imi`

Fältnamnen följer samma struktur som i kontaktformuläret:
- `fi-sender-fullName`
- `fi-sender-phone`
- `fi-sender-email`
- `fi-text-bolag`
- `fi-file-bilaga`
- `fi-textarea-meddelande`
- `fi-text-samtycke`

Uppdrags- och spontanansökningsformulären använder samma endpoint och har extra fält som:
- `fi-text-formulartyp`
- `fi-text-uppdrag`
- `fi-text-tillganglighet`
- `fi-text-geografiskt-omrade`
- `fi-text-kompetenser`
