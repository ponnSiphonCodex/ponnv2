SELECT current_database(), version();
SELECT COUNT(*) AS table_count FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';
SELECT COUNT(*) AS user_count FROM users;
SELECT COUNT(*) AS project_count FROM projects;
SELECT COUNT(*) AS task_count FROM tasks;
