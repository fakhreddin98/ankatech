# ANKA Tech webbplats

Detta är en komplett statisk webbplats för ANKA Tech / ANKA Engineering AB.

## Sidor
- index.html – Start
- tjanster.html – Tjänster
- partners.html – Partners
- uppdrag.html – Uppdrag
- kontakt.html – Kontakt

## Kör lokalt
Öppna `index.html` direkt i webbläsaren eller kör en lokal server:

```bash
python3 -m http.server 8000
```

Gå sedan till:
```text
http://localhost:8000
```

## Kontaktformulär
Formuläret använder FormSubmit som enkel första lösning.

I `kontakt.html`, byt:
```html
https://formsubmit.co/REPLACE_WITH_YOUR_EMAIL
```

till mottagarens e-postadress, exempel:
```html
https://formsubmit.co/kontakt@ankatech.se
```

Första gången formuläret skickas behöver mottagaren normalt verifiera e-postadressen via FormSubmit.

## Publicering på egen domän
Enklaste vägar:
1. Netlify: dra in hela mappen i Netlify Drop och koppla domänen.
2. Vercel: importera mappen som statisk webbplats och koppla domänen.
3. GitHub Pages: lägg filerna i ett GitHub-repo och aktivera Pages.
4. Webbhotell: ladda upp filerna via FTP till public_html eller motsvarande.

## Vidareutveckling
- Byt kontaktmejl och telefonnummer i HTML.
- Lägg till organisationsnummer, adress och integritetspolicy.
- Byt till ett backend-formulär eller CRM-integration när sidan får mer trafik.
- Komprimera bilder före publicering för ännu snabbare laddning.
