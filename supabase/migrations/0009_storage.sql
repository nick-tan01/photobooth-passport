-- strips-public: the shareable bucket. Guests and signed-in users can both
-- upload (the whole point of the guest-first share loop); public read;
-- nobody can update/delete an object via the client (no such policies).
-- strips-private: reserved for future private originals/galleries. Not
-- wired to any endpoint yet in Phase 1 — provisioned now so it exists when
-- needed, scoped so only a signed-in owner can read/write within their own
-- uid-prefixed folder, never public, no anon access at all.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('strips-public', 'strips-public', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('strips-private', 'strips-private', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "public read of strips-public objects"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'strips-public');

create policy "anyone can upload to strips-public"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'strips-public');

create policy "owners can upload into their own strips-private folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'strips-private'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owners can read their own strips-private objects"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'strips-private'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Deliberately no update/delete policies on either bucket: mutations happen
-- by uploading a new object (new slug/path), not by editing in place.
