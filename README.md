# TaskFlow

Kanban-style proje takip uygulamasi.

## Local Development

1. Dependencies kur:

```bash
npm install
```

2. Ortam degiskenlerini hazirla:

```bash
cp .env.example .env
```

3. Prisma migration uygula:

```bash
npx prisma migrate deploy
```

4. Dev server baslat:

```bash
npm run dev
```

## Production Build

```bash
npm run build
npm run start
```

Not: `build` script'i `prisma generate` calistirir; Vercel build'lerinde Prisma client otomatik hazir olur.

## Deploy to Vercel (Free)

1. Repo'yu GitHub'a push et.
2. Vercel dashboard'da **New Project** ile bu repo'yu import et.
3. Root Directory olarak bu proje klasorunu sec (`taskflow`).
4. Build command varsayilana birak (`npm run build`).
5. Environment Variables alanina asagidakileri ekle:
	- `DATABASE_URL`
	- `DIRECT_URL`
	- `AUTH_SECRET`
	- `AUTH_URL` = deployment URL (ornek: `https://your-project.vercel.app`)
6. Deploy et.
7. Ilk deploy'dan sonra production DB migration calistir:

```bash
npx prisma migrate deploy
```

Alternatif: Bu komutu Vercel Build Command sonuna ekleyebilirsin:

```bash
npx prisma migrate deploy && npm run build
```

## Important Notes

- Invite linkleri `AUTH_URL` veya `NEXTAUTH_URL` ile olusur; tanimli degilse Vercel URL'sini (`VERCEL_URL`) kullanir.
- `DIRECT_URL`, migration icin gerekli oldugundan Vercel env'e eklenmelidir.
