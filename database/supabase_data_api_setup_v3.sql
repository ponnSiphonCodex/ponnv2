-- PonnV2 Supabase Data API bridge v3
-- Fix: PostgreSQL regex \b is not a word boundary, so valid SELECT/INSERT/UPDATE/DELETE
-- were rejected as "statement type is not allowed" in v2.
CREATE OR REPLACE FUNCTION public.pm_execute(
  statement text,
  params jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q text := btrim(statement);
  original_q text := btrim(statement);
  command_name text;
  i integer;
  marker_pos integer;
  v jsonb;
  replacement text;
  rec record;
  result_rows jsonb := '[]'::jsonb;
  affected bigint := 0;
  last_id bigint := 0;
BEGIN
  IF q IS NULL OR q = '' THEN
    RAISE EXCEPTION 'statement is required';
  END IF;
  IF params IS NULL THEN params := '[]'::jsonb; END IF;
  IF jsonb_typeof(params) <> 'array' THEN
    RAISE EXCEPTION 'params must be an array';
  END IF;
  -- Reject stacked SQL. A single optional trailing semicolon is allowed.
  q := regexp_replace(q, ';[[:space:]]*$', '');
  IF position(';' in q) > 0 THEN
    RAISE EXCEPTION 'multiple SQL statements are not allowed';
  END IF;

  -- Safe literal binding: replace one ? marker at a time, in order.
  IF jsonb_array_length(params) > 0 THEN
    FOR i IN 0..jsonb_array_length(params)-1 LOOP
      marker_pos := position('?' in q);
      IF marker_pos = 0 THEN
        RAISE EXCEPTION 'too many parameters';
      END IF;
      v := params->i;
      replacement := CASE
        WHEN v IS NULL OR v = 'null'::jsonb THEN 'NULL'
        WHEN jsonb_typeof(v) = 'number' THEN v::text
        WHEN jsonb_typeof(v) = 'boolean' THEN CASE WHEN (v::text)::boolean THEN 'TRUE' ELSE 'FALSE' END
        ELSE quote_literal(v#>>'{}')
      END;
      q := substr(q, 1, marker_pos - 1) || replacement || substr(q, marker_pos + 1);
    END LOOP;
  END IF;
  IF position('?' in q) > 0 THEN
    RAISE EXCEPTION 'not enough parameters';
  END IF;

  -- SQLite compatibility retained for existing application queries.
  IF original_q ~* '^[[:space:]]*INSERT[[:space:]]+OR[[:space:]]+IGNORE[[:space:]]+INTO' THEN
    q := regexp_replace(q, '^[[:space:]]*INSERT[[:space:]]+OR[[:space:]]+IGNORE[[:space:]]+INTO', 'INSERT INTO', 'i');
    q := q || ' ON CONFLICT DO NOTHING';
  END IF;

  command_name := upper(split_part(ltrim(q), ' ', 1));

  IF command_name IN ('SELECT', 'WITH') THEN
    FOR rec IN EXECUTE q LOOP
      result_rows := result_rows || jsonb_build_array(to_jsonb(rec));
    END LOOP;

  ELSIF command_name = 'INSERT' THEN
    -- RETURNING * works for identity, UUID and composite-key tables.
    IF q !~* '[[:space:]]RETURNING[[:space:]]' THEN
      q := q || ' RETURNING *';
    END IF;
    FOR rec IN EXECUTE q LOOP
      result_rows := result_rows || jsonb_build_array(to_jsonb(rec));
      BEGIN
        last_id := COALESCE((to_jsonb(rec)->>'id')::bigint, last_id);
      EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN
        last_id := 0;
      END;
    END LOOP;
    GET DIAGNOSTICS affected = ROW_COUNT;

  ELSIF command_name IN ('UPDATE', 'DELETE') THEN
    EXECUTE q;
    GET DIAGNOSTICS affected = ROW_COUNT;

  ELSE
    RAISE EXCEPTION 'statement type is not allowed: %', command_name;
  END IF;

  RETURN jsonb_build_object(
    'rows', result_rows,
    'changes', affected,
    'last_row_id', last_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.pm_execute(text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pm_execute(text, jsonb) TO service_role;

-- Smoke tests. All five must return JSON without an error.
SELECT public.pm_execute('SELECT COUNT(*) AS count FROM users', '[]'::jsonb);
SELECT public.pm_execute('SELECT id, email FROM users WHERE email = ?', '["admin@ponnsth.com"]'::jsonb);
