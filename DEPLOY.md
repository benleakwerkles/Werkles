# Deploy Werkles

`werkles.com` is the address. The app is now a Next.js project deployed through the existing GitHub/Vercel path.

## Fastest path

Use Vercel for the app, then point the GoDaddy DNS records for `werkles.com` at Vercel.

## Vercel

1. Create a Vercel project from this folder.
2. Add `werkles.com` and `www.werkles.com` in the Vercel project domain settings.
3. In GoDaddy DNS, add the records Vercel gives you.
4. Wait for DNS and SSL to finish provisioning.
5. Set environment variables from `.env.example`.
6. Run the Supabase migration from `supabase/migrations/00001_initial_schema.sql`.

### Vercel dashboard route

Best long-term route:

1. Put this folder in a GitHub repo named `werkles`.
2. In Vercel, choose **Add New... > Project**.
3. Import the `werkles` GitHub repo.
4. Use **Next.js** as the framework preset if Vercel does not detect it automatically.
5. Use the project root as the root directory.
6. Build command: `npm run build`.
7. Output directory: leave as Vercel default for Next.js.
8. Deploy.
9. In the project, go to **Settings > Domains** and add `werkles.com`.
10. Copy Vercel's exact DNS records into GoDaddy.

### Vercel CLI route

Best quick route from this machine once Vercel CLI is installed:

```powershell
vercel
vercel --prod
```

Typical answers:

- Set up and deploy: yes
- Link to existing project: no, unless you already created one
- Project name: `werkles`
- Directory: `.`
- Framework preset: Next.js
- Build command: `npm run build`

## DNS notes

- The root domain, `werkles.com`, usually uses an `A` record or platform-specific apex record.
- The `www` subdomain usually uses a `CNAME` record.
- DNS changes can be quick, but global propagation can take hours.

Do not paste GoDaddy passwords into chat. If someone else needs access, use GoDaddy delegate access or do the DNS edits yourself while following the host's exact record instructions.
