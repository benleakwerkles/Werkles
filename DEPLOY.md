# Deploy Werkles

`werkles.com` is the address. You still need a web host to serve the app files.

## Fastest path

Use Netlify, Vercel, or Cloudflare Pages for the app, then point the GoDaddy DNS records for `werkles.com` at that host.

This prototype is static, so the host only needs:

- `index.html`
- `styles.css`
- `app.js`

## Option A: Netlify drag-and-drop

1. Create a Netlify site from this folder or upload `werkles-site.zip`.
2. Add `werkles.com` as a custom domain in Netlify.
3. In GoDaddy DNS, add the records Netlify gives you.
4. Wait for DNS and SSL to finish provisioning.

## Option B: Vercel

1. Create a Vercel project from this folder.
2. Add `werkles.com` and `www.werkles.com` in the Vercel project domain settings.
3. In GoDaddy DNS, add the records Vercel gives you.
4. Wait for DNS and SSL to finish provisioning.

### Vercel dashboard route

Best long-term route:

1. Put this folder in a GitHub repo named `werkles`.
2. In Vercel, choose **Add New... > Project**.
3. Import the `werkles` GitHub repo.
4. Use **Other** as the framework preset if Vercel does not detect one.
5. Use the project root as the root directory.
6. Leave build command empty.
7. Leave output directory empty or use `.` for this static prototype.
8. Deploy.
9. In the project, go to **Settings > Domains** and add `werkles.com`.
10. Copy Vercel's exact DNS records into GoDaddy.

### Vercel CLI route

Best quick route from this machine once Vercel CLI is installed:

```powershell
vercel
vercel --prod
```

Typical answers for this prototype:

- Set up and deploy: yes
- Link to existing project: no, unless you already created one
- Project name: `werkles`
- Directory: `.`
- Framework preset: Other
- Build command: none
- Output directory: `.`

## Option C: GoDaddy hosting

If you bought GoDaddy web hosting, upload these files into the site's public web folder, usually `public_html`.

## DNS notes

- The root domain, `werkles.com`, usually uses an `A` record or platform-specific apex record.
- The `www` subdomain usually uses a `CNAME` record.
- DNS changes can be quick, but global propagation can take hours.

Do not paste GoDaddy passwords into chat. If someone else needs access, use GoDaddy delegate access or do the DNS edits yourself while following the host's exact record instructions.
