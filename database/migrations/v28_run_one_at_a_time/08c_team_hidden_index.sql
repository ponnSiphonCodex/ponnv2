CREATE UNIQUE INDEX IF NOT EXISTS team_hidden_uniq ON team_hidden(viewer_id, target_kind, target_id);
