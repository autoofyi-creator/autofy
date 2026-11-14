# Autofy website (autofyy.online)

Static site hosted on Vercel, deployed automatically from the `main` branch of this repo.

- `index.html`, `css/styles.css`, `js/main.js` are the whole site (no build step).
- Booking uses Calendly (https://calendly.com/autoofy/30min). The calendar is embedded and every "Book a call" button opens it. Calendly emails you each booking.
- `downloads/` holds the Salon demo APK. Billket (billing) links to Google Play.
- Testimonials: add real ones to `data/testimonials.json` as `[{"quote":"...","name":"Jane Doe","role":"Owner","company":"Acme","url":"https://...","source":"Google Play review"}]`. The "What clients say" section appears automatically once the file has entries. Only add quotes people have actually given you.
- `api/lead.js` emails you the visitor's name and number from that form. It needs a `RESEND_API_KEY` environment variable in Vercel (optional `TO_EMAIL`, `FROM_EMAIL`). Without it the form falls back to FormSubmit.co.
