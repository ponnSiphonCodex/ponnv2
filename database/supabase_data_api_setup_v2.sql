-- Supabase Data API bridge v2. Run once in SQL Editor after schema.
CREATE OR REPLACE FUNCTION public.pm_execute(statement text, params jsonb DEFAULT '[]'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE q text := statement; i integer; v jsonb; rec record; result_rows jsonb := '[]'::jsonb; affected bigint := 0; last_id bigint := 0;
BEGIN
  IF statement IS NULL OR btrim(statement) = '' THEN RAISE EXCEPTION 'statement is required'; END IF;
  IF jsonb_typeof(params) <> 'array' THEN RAISE EXCEPTION 'params must be an array'; END IF;
  IF statement ~ ';\s*\S' THEN RAISE EXCEPTION 'multiple SQL statements are not allowed'; END IF;
  IF jsonb_array_length(params) > 0 THEN
    FOR i IN 0..jsonb_array_length(params)-1 LOOP
      v := params->i;
      q := regexp_replace(q, '\?', CASE
        WHEN v IS NULL OR v = 'null'::jsonb THEN 'NULL'
        WHEN jsonb_typeof(v) = 'number' THEN v::text
        WHEN jsonb_typeof(v) = 'boolean' THEN CASE WHEN (v::text)::boolean THEN '1' ELSE '0' END
        ELSE quote_literal(v#>>'{}') END, '');
    END LOOP;
  END IF;
  q := regexp_replace(q, 'INSERT\s+OR\s+IGNORE\s+INTO', 'INSERT INTO', 'i');
  IF statement ~* '^\s*INSERT\s+OR\s+IGNORE' THEN q := q || ' ON CONFLICT DO NOTHING'; END IF;
  IF q ~* '^\s*(SELECT|WITH)\b' THEN
    FOR rec IN EXECUTE q LOOP result_rows := result_rows || jsonb_build_array(to_jsonb(rec)); END LOOP;
  ELSIF q ~* '^\s*INSERT\b' THEN
    IF q !~* '\bRETURNING\b' THEN q := q || ' RETURNING id'; END IF;
    FOR rec IN EXECUTE q LOOP result_rows := result_rows || jsonb_build_array(to_jsonb(rec)); last_id := COALESCE((to_jsonb(rec)->>'id')::bigint,0); END LOOP;
    GET DIAGNOSTICS affected = ROW_COUNT;
  ELSIF q ~* '^\s*(UPDATE|DELETE)\b' THEN
    EXECUTE q; GET DIAGNOSTICS affected = ROW_COUNT;
  ELSE
    RAISE EXCEPTION 'statement type is not allowed';
  END IF;
  RETURN jsonb_build_object('rows',result_rows,'changes',affected,'last_row_id',last_id);
END $$;
REVOKE ALL ON FUNCTION public.pm_execute(text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pm_execute(text,jsonb) TO service_role;
