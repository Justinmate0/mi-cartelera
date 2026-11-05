-- =====================================================================
-- Prueba de seguridad de la Noche de película (NP-03, criterios S-09 a S-13, CA-2.3.8, CA-2.4.6)
-- Usa dos usuarios reales de Auth (A y B) y se hace pasar por cada uno con su JWT.
-- NO deja cambios: al final lanza un error a propósito y PostgreSQL revierte todo.
-- Cómo correrla: Supabase > SQL Editor > New query > pegar > Run.
-- El resultado sale como "ERROR: RESULTADO (todo se revierte): ..." con una línea por prueba.
-- =====================================================================
do $t$
declare
  log text := ''; a uuid; b uuid; peli int; s bigint; c int;
begin
  -- A: un usuario con al menos una película «por ver». B: cualquier otro usuario.
  select id into a from auth.users u
  where exists (select 1 from public.mi_lista m where m.user_id = u.id and m.tipo_contenido = 'pelicula' and m.estado = 'por_ver')
  order by created_at limit 1;
  select id into b from auth.users where id <> a order by created_at limit 1;
  select tmdb_id into peli from public.mi_lista where user_id = a and tipo_contenido = 'pelicula' and estado = 'por_ver' limit 1;

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  log := log || format(E'\n1 A ve %s filas de su mi_lista', (select count(*) from public.mi_lista));
  s := public.guardar_sesion('Prueba', 120, jsonb_build_array(jsonb_build_object('tmdb_id', peli, 'duracion', 120)));
  log := log || format(E'\n2 ok guarda una sesión que ocupa exacto 120 de 120 (id %s)', s);
  begin perform public.guardar_sesion(null, 120, jsonb_build_array(jsonb_build_object('tmdb_id', peli, 'duracion', 121))); log := log || E'\n3 MAL guardó una que no cabe'; exception when others then log := log || E'\n3 ok rechaza una que no cabe: ' || sqlerrm; end;
  begin perform public.guardar_sesion(null, 29, jsonb_build_array(jsonb_build_object('tmdb_id', peli, 'duracion', 10))); log := log || E'\n4 MAL aceptó 29 min'; exception when others then log := log || E'\n4 ok rechaza 29 min: ' || sqlerrm; end;
  begin perform public.guardar_sesion(null, 120, '[]'::jsonb); log := log || E'\n5 MAL guardó vacía'; exception when others then log := log || E'\n5 ok rechaza sesión vacía: ' || sqlerrm; end;
  begin perform public.guardar_sesion(null, 300, jsonb_build_array(jsonb_build_object('tmdb_id', peli, 'duracion', 10), jsonb_build_object('tmdb_id', peli, 'duracion', 10))); log := log || E'\n6 MAL aceptó repetida'; exception when others then log := log || E'\n6 ok rechaza película repetida: ' || sqlerrm; end;
  begin perform public.guardar_sesion(null, 300, jsonb_build_array(jsonb_build_object('tmdb_id', 999999999, 'duracion', 10))); log := log || E'\n7 MAL aceptó ajena'; exception when others then log := log || E'\n7 ok rechaza película que no está por ver: ' || sqlerrm; end;
  begin perform public.guardar_sesion(repeat('x', 61), 300, jsonb_build_array(jsonb_build_object('tmdb_id', peli, 'duracion', 10))); log := log || E'\n8 MAL aceptó nombre largo'; exception when others then log := log || E'\n8 ok rechaza nombre de 61: ' || sqlerrm; end;
  begin perform public.guardar_sesion(null, 300, jsonb_build_array(jsonb_build_object('tmdb_id', peli))); log := log || E'\n9 MAL aceptó sin duración'; exception when others then log := log || E'\n9 ok rechaza sin duración: ' || sqlerrm; end;
  begin insert into public.sesiones (nombre, tiempo_disponible, duracion_total) values ('x', 100, 50); log := log || E'\n10 MAL dejó insertar directo'; exception when others then log := log || E'\n10 ok bloquea insert directo: ' || sqlerrm; end;
  begin update public.sesiones set nombre = 'x' where id = s; log := log || E'\n11 MAL dejó editar'; exception when others then log := log || E'\n11 ok bloquea editar: ' || sqlerrm; end;
  log := log || format(E'\n12 A ve %s sesión y %s película de sesión', (select count(*) from public.sesiones), (select count(*) from public.sesion_peliculas));
  log := log || format(E'\n13 estado en mi_lista después de guardar: %s', (select estado from public.mi_lista where tmdb_id = peli and tipo_contenido = 'pelicula'));

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  log := log || format(E'\n14 B ve %s sesiones y %s películas de sesión', (select count(*) from public.sesiones), (select count(*) from public.sesion_peliculas));
  delete from public.sesiones where id = s; get diagnostics c = row_count;
  log := log || format(E'\n15 B intenta borrar la sesión de A: %s filas borradas', c);

  reset role;
  set local role anon;
  begin log := log || format(E'\n16 MAL anon ve %s', (select count(*) from public.sesiones)); exception when others then log := log || E'\n16 ok sin sesión no se puede leer: ' || sqlerrm; end;
  begin perform public.guardar_sesion(null, 300, '[]'::jsonb); log := log || E'\n17 MAL anon guardó'; exception when others then log := log || E'\n17 ok sin sesión no se puede guardar: ' || sqlerrm; end;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  delete from public.mi_lista where tmdb_id = peli and user_id = a;
  log := log || format(E'\n18 después de quitar la película de mi_lista, A sigue viendo %s película en su sesión', (select count(*) from public.sesion_peliculas));
  delete from public.sesiones where id = s; get diagnostics c = row_count;
  log := log || format(E'\n19 A borra su sesión: %s fila; quedan %s películas de sesión', c, (select count(*) from public.sesion_peliculas));
  reset role;

  raise exception 'RESULTADO (todo se revierte):%', log;
end
$t$;
