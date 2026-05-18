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
