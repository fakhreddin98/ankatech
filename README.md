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
