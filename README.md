# SABER AI – Cloudflare Pages platformu

Pages Functions (`functions/`) + D1 (`database/schema.sql`) + Workers AI. Gizli anahtar ZIP içinde yoktur.

## Senin yapman gerekenler
1. Ücretsiz Cloudflare hesabı aç; Workers AI'ın hesabında etkin olduğunu doğrula.
2. `npm i -g wrangler && wrangler login`
3. `wrangler d1 create saber-ai` → çıkan `database_id` değerini `wrangler.toml` içine yaz.
4. `wrangler.toml` içinde `ADMIN_EMAIL` değerini kendi e-postan yap. Bu e-postayla **ilk kayıt olan** hesap yönetici olur; dağıtımdan hemen sonra kendin kayıt ol.
5. Şemayı yükle: `wrangler d1 execute saber-ai --remote --file=database/schema.sql`
6. Yayınla: `wrangler pages deploy .` (veya repoyu Pages'e bağla; build komutu boş, çıktı dizini `.`).
7. `https://<proje>.pages.dev/register.html` adresinden kayıt ol.

Yerel deneme: `wrangler d1 execute saber-ai --local --file=database/schema.sql` ardından `wrangler pages dev .` (AI binding yerelde de Cloudflare'e bağlanır ve kullanım sayılabilir).

## Dış istemciler için API
- `POST /api/chat` · `Authorization: Bearer sk-saber-…` · `{"messages":[{"role":"user","content":"Merhaba"}],"model":"(isteğe bağlı)"}` → `{"content":"…"}`
- `POST /api/keys/validate` · Bearer veya `{"key":"…"}` → `{"valid":true,…}`
- Diğer uçlar oturum çerezi ister: `/api/auth/{register,login,me}`, `/api/keys/{create,rotate,revoke}`, `/api/usage`, `/api/models`, `/api/admin/{users,settings}`.

## Güvenlik özeti
Parolalar PBKDF2-SHA256 (100k tur) ile hash'lenir; oturum jetonu ve API Key yalnızca SHA-256 hash'iyle saklanır; tam anahtar yalnızca oluşturulurken döner; her sorgu `user_id` ile sınırlanır; yönetici uçları sunucuda rol kontrolü yapar (admin.html'deki yönlendirme yalnızca kozmetiktir); giriş/kayıt/chat/doğrulama D1 tabanlı hız sınırına tabidir; çerez HttpOnly + Secure + SameSite=Lax, durum değiştiren isteklerde Origin denetimi vardır.

## Bilinen sınırlar (dürüst liste)
- **Test edilmedi:** kod Cloudflare hesabında çalıştırılmadı; ilk dağıtımda hata çıkabilir.
- Model kimlikleri `functions/_lib/models.js` içindedir; Cloudflare kataloğundan doğrula, gerekirse düzenle.
- Yanıtlar akışsız (tek parça) gelir. E-posta doğrulama ve parola sıfırlama yoktur.
- Token sayısı, Workers AI `usage` döndürmezse tahmindir (karakter/4).
- Sohbet geçmişi sunucuda değil, tarayıcının localStorage'ında tutulur (çıkışta silinir).
- Yeni model/sağlayıcı (ör. kendi yerel modelimiz): `PROVIDERS` + `MODELS` içine ekle; arayüz değişmez.
