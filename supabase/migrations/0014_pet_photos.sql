-- Bucket público para fotos dos pets.
-- "Público" aqui é só pra leitura via URL — o upload/delete continua exigindo
-- usuário autenticado. As fotos são pequenas (<500KB cada) e não-sensíveis,
-- então CDN público + URL não-listável é suficiente.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pet-photos',
  'pet-photos',
  true,
  2 * 1024 * 1024,  -- 2 MB por arquivo (cliente comprime pra ~300KB antes)
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Policies: qualquer um lê (bucket public), só autenticado faz upload/update/delete.
-- Modelo de dados "compartilhado" do projeto (sem isolamento por user_id, ver 0006_shared_data)
-- então não precisamos checar ownership do objeto.

drop policy if exists "pet-photos-read" on storage.objects;
create policy "pet-photos-read"
  on storage.objects for select
  using (bucket_id = 'pet-photos');

drop policy if exists "pet-photos-insert" on storage.objects;
create policy "pet-photos-insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'pet-photos');

drop policy if exists "pet-photos-update" on storage.objects;
create policy "pet-photos-update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'pet-photos')
  with check (bucket_id = 'pet-photos');

drop policy if exists "pet-photos-delete" on storage.objects;
create policy "pet-photos-delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'pet-photos');
