-- Zdjęcia per dzień: prywatny bucket Storage + RLS per właściciel + kolumna photos.
-- Zastosowane na projekcie Supabase iythcbjjzwalyftxwswo (migracja: day_photos).
-- Kopia w repo dla śladu wersjonowania.

-- 1) Kolumna z listą ścieżek (kluczy w buckecie) dla danego dnia.
alter table public.day_logs
  add column if not exists photos jsonb not null default '[]'::jsonb;

-- 2) Prywatny bucket na zdjęcia (10 MB limit, tylko obrazy).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'day-photos',
  'day-photos',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 3) RLS na storage.objects — dostęp tylko do własnego folderu {uid}/...
--    Pierwszy segment ścieżki musi równać się auth.uid().
create policy "day_photos_select_own"
  on storage.objects for select to authenticated
  using (bucket_id = 'day-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "day_photos_insert_own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'day-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "day_photos_update_own"
  on storage.objects for update to authenticated
  using (bucket_id = 'day-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'day-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "day_photos_delete_own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'day-photos' and (storage.foldername(name))[1] = auth.uid()::text);
