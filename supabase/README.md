# Supabase kurulumu

1. İlk kurulumda Supabase SQL Editor'da `schema.sql` dosyasını çalıştır. Mevcut projeyi güncelliyorsan `migrations/add-cover-path.sql` dosyasını çalıştır.
2. Her proje türünde galeri ve proje detay sayfası için `migrations/project-gallery.sql` dosyasını çalıştır.
3. Medyaları marka adına göre gruplamak ve PDF/fotoğraf türlerini kaydetmek için `migrations/media-brand-groups.sql` dosyasını çalıştır.
4. Proje kategorilerini güncellemek için `migrations/project-categories.sql` dosyasını çalıştır. Eski `Basılı işler` kayıtları `Grafik tasarım` olarak güncellenir.
5. Supabase Authentication > Users bölümünden yönetici için bir kullanıcı oluştur. Parolayı sadece Supabase'e gir.
6. SQL Editor'da şu sorguyla kullanıcının UUID değerini bul:

```sql
select id, email from auth.users where email = 'YONETICI_EPOSTASI';
```

7. Sonuçtaki `id` değerini aşağıdaki sorguya koyup çalıştır:

```sql
insert into public.admin_users (user_id)
values ('KULLANICI_UUID');
```

8. Proje kökündeki `.env.local` dosyasında `VITE_SUPABASE_URL` ve `VITE_SUPABASE_PUBLISHABLE_KEY` değerleri bulunmalı. Vercel'de aynı iki değişkeni Project Settings > Environment Variables alanına da ekle.
9. `/manage` yolunu açıp bu e-posta ve Supabase parolasıyla giriş yap.

Publishable key tarayıcıda kullanılabilir. `service_role` veya secret key'i hiçbir `VITE_` değişkenine koyma. Veritabanı ve Storage izinleri RLS politikalarıyla yönetilir.
