# Autofy website (autofyy.online)

Static site hosted on Vercel, deployed automatically from the `main` branch of this repo.

- `index.html`, `css/styles.css`, `js/main.js` are the whole site (no build step).
- Booking uses Calendly (https://calendly.com/autoofy/30min). The calendar is embedded and every "Book a call" button opens it. Calendly emails you each booking.
- `downloads/` holds the demo APKs. Add `autofy-billing-demo.apk` there. Until it exists, the billing button opens a WhatsApp request form.
- `api/lead.js` emails you the visitor's name and number from that form. It needs a `RESEND_API_KEY` environment variable in Vercel (optional `TO_EMAIL`, `FROM_EMAIL`). Without it the form falls back to FormSubmit.co.
