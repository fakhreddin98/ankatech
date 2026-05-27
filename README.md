# ANKA Tech – GitHub, Vercel och adminportal

Den här versionen är förberedd för ett enkelt adminflöde med GitHub, Vercel, Pages CMS och Getform.

## Viktiga filer

- `content/assignments.json` – uppdragen som visas på startsidan och uppdragssidan.
- `content/site.json` – grundinställningar som Getform-endpoint och adminlänkar.
- `.pages.yml` – konfiguration för Pages CMS.
- `admin.html` – enkel adminlänk-sida på webbplatsen.
- `assignments-data.js` – fallbackdata om sidan öppnas lokalt direkt från filsystemet.
- `script.js` – hämtar uppdrag från `content/assignments.json`.

## Adminportal

När sidan är publicerad kan du gå till:

`/admin.html`

Där finns länkar till:

- Pages CMS – för att lägga till och ändra uppdrag.
- Getform – för att läsa inkomna formulär och CV.

## Rekommenderat arbetsflöde

1. Ladda upp hela mappen till ett GitHub-repository.
2. Importera GitHub-repot till Vercel.
3. Gå till Pages CMS och koppla GitHub-repot.
4. Pages CMS läser `.pages.yml`.
5. Lägg till eller ändra uppdrag i Pages CMS.
6. När du sparar gör Pages CMS en commit i GitHub.
7. Vercel publicerar om sidan automatiskt.

## Formulär

Alla formulär använder Getform:

`https://getform.io/f/9yi31ff8imi`

Fältnamn följer samma struktur som ditt kontaktformulär, exempel:

- `fi-sender-fullName`
- `fi-sender-phone`
- `fi-sender-email`
- `fi-file-bilaga`
- `fi-textarea-meddelande`
- `fi-text-samtycke`

## Pages CMS-fix

Den här versionen fixar ett Pages CMS-fel där en `description` i `.pages.yml` innehöll kolon utan citattecken.
Det kunde göra att Pages CMS tolkade texten som ett objekt och gav React error #31.

## Uppdatering i denna version

- Alla HTML-sidor har Vercel Speed Insights-script installerat.
- Bilderna är flyttade till en tydligare struktur:
  - `assets/brand/`
  - `assets/partners/`
  - `assets/visuals/`
- Partnersidan är omformulerad till ett mer professionellt "tekniskt sammanhang" där logotyperna beskriver relevanta produkter, plattformar, organisationer och miljöer som ANKA Tech har arbetat med, haft kontakt med eller byggt erfarenhet kring.
- Filen `partners.h` är korrigerad till `partners.html`.

## Viktigt om Pages CMS

Pages CMS kräver att filen `.pages.yml` finns direkt i repository-roten.

Om du laddar upp filer manuellt från datorn kan dolda filer som börjar med punkt ibland missas. Om Pages CMS visar:

`Configuration not found`

kontrollera i GitHub att filen `.pages.yml` verkligen finns i roten, på samma nivå som `index.html`.

I denna zip finns också `PAGES_CMS_CONFIG_COPY.yml` som synlig kopia. Om `.pages.yml` saknas i GitHub:
1. Skapa en ny fil i GitHub som heter exakt `.pages.yml`
2. Kopiera innehållet från `PAGES_CMS_CONFIG_COPY.yml`
3. Commit
4. Öppna Pages CMS igen
