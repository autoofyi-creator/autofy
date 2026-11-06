# Autofy website: deploy on Vercel

Static site + one serverless function (`/api/book`) that emails you when someone books a meeting.

## Deploy
1. Upload this folder to a GitHub repo and import it at vercel.com/new (Framework: **Other**, no build command), or run `vercel --prod` in this folder.
2. **Booking** is now a built-in calendar on the site (no Calendly). Visitors pick a date and time (shown in their own time zone), enter details, and `/api/book` emails you the booking plus sends them a confirmation with a calendar file. Add `RESEND_API_KEY` in Vercel env vars (optional `TO_EMAIL`, `FROM_EMAIL`). Without it, FormSubmit.co is used as a fallback: submit one test, then click the activation link they email to autoofyi@gmail.com.
   - Note: there is no database, so the same slot can be requested twice. You confirm each request by email.
3. **Billing-demo requests (WhatsApp form)** can also email you: add `RESEND_API_KEY` in Vercel env vars (optional `TO_EMAIL`, `FROM_EMAIL`). Without it, FormSubmit.co is used: submit one test, then click the activation link they email to autoofyi@gmail.com.

## Add the billing app
Put the billing APK at `downloads/autofy-billing-demo.apk`. Until it exists, the button opens a small form (name + phone) and sends the visitor to WhatsApp (+91 93660 65001) while emailing you their number. Demo login is already on the page.

## Edit
- Booking hours: `CFG` at the top of `js/main.js` (IST start/end, slot length, days ahead, weekdays).
- Colours (Apple-style palette)/fonts: `:root` in `css/styles.css`.
- After you have a domain: add `<link rel="canonical">`, make `og:image` absolute, and add a sitemap.
