-- database/migrations/schema.sql  (v20 — FULL REBUILD + SEED)
-- ห้ามมี PRAGMA. D1 Console: วางทั้งไฟล์ → Ctrl+A ในกล่อง Query → Run
-- DROP ทั้งหมดแล้วสร้างใหม่ (ข้อมูลเป็น seed/sample)

DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS user_todos;
DROP TABLE IF EXISTS system_secrets;
DROP TABLE IF EXISTS attachments;
DROP TABLE IF EXISTS meeting_references;
DROP TABLE IF EXISTS meeting_attendees;
DROP TABLE IF EXISTS meetings;
DROP TABLE IF EXISTS issues;
DROP TABLE IF EXISTS risks;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS task_worklogs;
DROP TABLE IF EXISTS custom_field_values;
DROP TABLE IF EXISTS custom_fields;
DROP TABLE IF EXISTS task_tags;
DROP TABLE IF EXISTS task_dependencies;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS workflow_statuses;
DROP TABLE IF EXISTS sprints;
DROP TABLE IF EXISTS project_milestones;
DROP TABLE IF EXISTS feature_resource_plans;
DROP TABLE IF EXISTS features;
DROP TABLE IF EXISTS project_managers;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS product_owners;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS requirements;
DROP TABLE IF EXISTS initiatives;
DROP TABLE IF EXISTS themes;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS priorities;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS system_roles;
DROP TABLE IF EXISTS login_logs;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS users;

CREATE TABLE users ( id TEXT PRIMARY KEY, name TEXT, email TEXT NOT NULL UNIQUE, company_email TEXT, phone TEXT, telegram_user_id TEXT, telegram_notify INTEGER NOT NULL DEFAULT 0, image TEXT, avatar_url TEXT, email_verified INTEGER, password_hash TEXT, active INTEGER NOT NULL DEFAULT 1, pm_role TEXT, last_login_at INTEGER, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()) );
CREATE TABLE accounts ( user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, type TEXT NOT NULL, provider TEXT NOT NULL, provider_account_id TEXT NOT NULL, created_at INTEGER NOT NULL DEFAULT (unixepoch()), PRIMARY KEY (provider, provider_account_id) );
CREATE INDEX accounts_user_idx ON accounts(user_id);
CREATE TABLE login_logs ( id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT REFERENCES users(id) ON DELETE SET NULL, email TEXT, auth_provider TEXT, device_info TEXT, ip_address TEXT, success INTEGER NOT NULL DEFAULT 1, login_time INTEGER NOT NULL DEFAULT (unixepoch()) );
CREATE INDEX login_logs_user_idx ON login_logs(user_id);
CREATE TABLE system_roles ( id INTEGER PRIMARY KEY AUTOINCREMENT, role_name TEXT NOT NULL, module TEXT NOT NULL, permissions TEXT NOT NULL DEFAULT '[]', created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT, updated_by TEXT );
CREATE TABLE user_roles ( id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, role_id INTEGER NOT NULL REFERENCES system_roles(id) ON DELETE CASCADE, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT, updated_by TEXT );
CREATE UNIQUE INDEX user_roles_uniq ON user_roles(user_id, role_id);

CREATE TABLE priorities ( id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, level INTEGER NOT NULL DEFAULT 3, color TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT, updated_by TEXT );
CREATE TABLE categories ( id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, color TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT, updated_by TEXT );
CREATE TABLE tags ( id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, color TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT, updated_by TEXT );

CREATE TABLE themes ( id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT, updated_by TEXT );
CREATE TABLE initiatives ( id INTEGER PRIMARY KEY AUTOINCREMENT, theme_id INTEGER REFERENCES themes(id) ON DELETE SET NULL, name TEXT NOT NULL, description TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT, updated_by TEXT );
CREATE TABLE requirements ( id INTEGER PRIMARY KEY AUTOINCREMENT, initiative_id INTEGER REFERENCES initiatives(id) ON DELETE SET NULL, title TEXT NOT NULL, description TEXT, type TEXT, owner_id TEXT REFERENCES users(id) ON DELETE SET NULL, related_system TEXT, status TEXT DEFAULT 'Not Start', created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT, updated_by TEXT );

CREATE TABLE products ( id INTEGER PRIMARY KEY AUTOINCREMENT, requirement_id INTEGER REFERENCES requirements(id) ON DELETE SET NULL, name TEXT NOT NULL, description TEXT, status TEXT DEFAULT 'Not Start', priority_id INTEGER REFERENCES priorities(id) ON DELETE SET NULL, expected_date INTEGER, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT, updated_by TEXT );
CREATE TABLE product_owners ( id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT, updated_by TEXT );
CREATE UNIQUE INDEX product_owners_uniq ON product_owners(product_id, user_id);
CREATE INDEX product_owners_user_idx ON product_owners(user_id);
CREATE TABLE projects ( id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, status TEXT DEFAULT 'Not Start', priority_id INTEGER REFERENCES priorities(id) ON DELETE SET NULL, category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL, theme_id INTEGER REFERENCES themes(id) ON DELETE SET NULL, product_id INTEGER REFERENCES products(id) ON DELETE SET NULL, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT, updated_by TEXT );
CREATE TABLE project_managers ( id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT, updated_by TEXT );
CREATE UNIQUE INDEX project_managers_uniq ON project_managers(project_id, user_id);
CREATE INDEX project_managers_user_idx ON project_managers(user_id);
CREATE TABLE features ( id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER REFERENCES products(id) ON DELETE SET NULL, project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL, name TEXT NOT NULL, description TEXT, status TEXT DEFAULT 'Not Start', created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT, updated_by TEXT );
CREATE TABLE feature_resource_plans ( id INTEGER PRIMARY KEY AUTOINCREMENT, feature_id INTEGER NOT NULL REFERENCES features(id) ON DELETE CASCADE, role_required TEXT, headcount INTEGER, estimated_mandays REAL, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT, updated_by TEXT );

CREATE TABLE project_milestones ( id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE, title TEXT NOT NULL, deliverable TEXT, target_date INTEGER, status TEXT DEFAULT 'Not Start', created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT, updated_by TEXT );
CREATE TABLE sprints ( id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE, name TEXT NOT NULL, goal TEXT, start_date INTEGER, end_date INTEGER, status TEXT DEFAULT 'Planning', created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT, updated_by TEXT );
CREATE TABLE workflow_statuses ( id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE, name TEXT NOT NULL, color TEXT, category TEXT NOT NULL DEFAULT 'todo', sort_order INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT, updated_by TEXT );
CREATE INDEX workflow_statuses_project_idx ON workflow_statuses(project_id);

CREATE TABLE tasks ( id INTEGER PRIMARY KEY AUTOINCREMENT, feature_id INTEGER REFERENCES features(id) ON DELETE CASCADE, project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL, sprint_id INTEGER REFERENCES sprints(id) ON DELETE SET NULL, assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL, title TEXT NOT NULL, note TEXT, workflow_status_id INTEGER REFERENCES workflow_statuses(id) ON DELETE SET NULL, priority_id INTEGER REFERENCES priorities(id) ON DELETE SET NULL, sort_order INTEGER NOT NULL DEFAULT 0, start_date INTEGER, due_date INTEGER, completed_datetime INTEGER, estimated_hours REAL, budget_cost REAL, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT, updated_by TEXT );
CREATE INDEX tasks_feature_idx ON tasks(feature_id);
CREATE INDEX tasks_project_idx ON tasks(project_id);
CREATE INDEX tasks_status_idx ON tasks(workflow_status_id);
CREATE INDEX tasks_assignee_idx ON tasks(assignee_id);
CREATE TABLE task_dependencies ( id INTEGER PRIMARY KEY AUTOINCREMENT, predecessor_task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE, successor_task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE, dependency_type TEXT NOT NULL DEFAULT 'FS', created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT, updated_by TEXT );
CREATE TABLE task_tags ( id INTEGER PRIMARY KEY AUTOINCREMENT, task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE, tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE );
CREATE UNIQUE INDEX task_tags_uniq ON task_tags(task_id, tag_id);
CREATE TABLE custom_fields ( id INTEGER PRIMARY KEY AUTOINCREMENT, reference_type TEXT NOT NULL, name TEXT NOT NULL, field_type TEXT NOT NULL DEFAULT 'Text', options TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT, updated_by TEXT );
CREATE TABLE custom_field_values ( id INTEGER PRIMARY KEY AUTOINCREMENT, custom_field_id INTEGER NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE, reference_id INTEGER NOT NULL, value_string TEXT, value_number REAL, value_date INTEGER, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT, updated_by TEXT );

CREATE TABLE task_worklogs ( id INTEGER PRIMARY KEY AUTOINCREMENT, task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE, user_id TEXT REFERENCES users(id) ON DELETE SET NULL, work_date INTEGER NOT NULL DEFAULT (unixepoch()), hours_spent REAL NOT NULL, note TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT, updated_by TEXT );
CREATE INDEX task_worklogs_task_idx ON task_worklogs(task_id);
CREATE TABLE comments ( id INTEGER PRIMARY KEY AUTOINCREMENT, reference_type TEXT NOT NULL, reference_id INTEGER NOT NULL, user_id TEXT REFERENCES users(id) ON DELETE SET NULL, parent_comment_id INTEGER, content TEXT NOT NULL, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT, updated_by TEXT );
CREATE INDEX comments_ref_idx ON comments(reference_type, reference_id);
CREATE TABLE activity_logs ( id INTEGER PRIMARY KEY AUTOINCREMENT, reference_type TEXT NOT NULL, reference_id INTEGER NOT NULL, user_id TEXT REFERENCES users(id) ON DELETE SET NULL, action TEXT NOT NULL, field_changed TEXT, old_value TEXT, new_value TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()) );
CREATE INDEX activity_logs_ref_idx ON activity_logs(reference_type, reference_id);

CREATE TABLE risks ( id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE, title TEXT NOT NULL, description TEXT, probability TEXT DEFAULT 'Medium', impact TEXT DEFAULT 'Medium', mitigation_plan TEXT, owner_id TEXT REFERENCES users(id) ON DELETE SET NULL, status TEXT DEFAULT 'Open', created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT, updated_by TEXT );
CREATE TABLE issues ( id INTEGER PRIMARY KEY AUTOINCREMENT, reference_type TEXT NOT NULL, reference_id INTEGER NOT NULL, title TEXT NOT NULL, description TEXT, action_plan TEXT, status TEXT DEFAULT 'Open', raised_by TEXT REFERENCES users(id) ON DELETE SET NULL, actioned_by TEXT REFERENCES users(id) ON DELETE SET NULL, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT, updated_by TEXT );
CREATE TABLE meetings ( id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, meeting_date INTEGER, start_time TEXT, organizer TEXT, minutes_longtext TEXT, internal_notes TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT, updated_by TEXT );
CREATE TABLE meeting_attendees ( id INTEGER PRIMARY KEY AUTOINCREMENT, meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE, user_id TEXT REFERENCES users(id) ON DELETE CASCADE );
CREATE UNIQUE INDEX meeting_attendees_uniq ON meeting_attendees(meeting_id, user_id);
CREATE TABLE meeting_references ( id INTEGER PRIMARY KEY AUTOINCREMENT, meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE, reference_type TEXT NOT NULL, reference_id INTEGER NOT NULL );
CREATE TABLE attachments ( id INTEGER PRIMARY KEY AUTOINCREMENT, reference_type TEXT NOT NULL, reference_id INTEGER NOT NULL, file_type TEXT, file_name TEXT, gdrive_file_id TEXT, gdrive_web_link TEXT, uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL, created_at INTEGER NOT NULL DEFAULT (unixepoch()) );
CREATE INDEX attachments_ref_idx ON attachments(reference_type, reference_id);

CREATE TABLE system_secrets ( id INTEGER PRIMARY KEY AUTOINCREMENT, system_name TEXT NOT NULL, key_name TEXT NOT NULL, secret_value TEXT, note TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT, updated_by TEXT );
CREATE TABLE user_todos ( id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL, title TEXT NOT NULL, target_date INTEGER, status TEXT DEFAULT 'todo', created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT, updated_by TEXT );
CREATE INDEX user_todos_user_idx ON user_todos(user_id);
CREATE TABLE notifications ( id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, actor_id TEXT REFERENCES users(id) ON DELETE SET NULL, action_type TEXT, reference_type TEXT, reference_id INTEGER, message TEXT, is_read INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL DEFAULT (unixepoch()) );
CREATE INDEX notifications_user_idx ON notifications(user_id);

-- ===================== SEED =====================
INSERT INTO priorities (id,name,level,color) VALUES (1,'Critical',1,'#EC186E'),(2,'High',2,'#D4A017'),(3,'Medium',3,'#6B7280'),(4,'Low',4,'#9AA0A6');
INSERT INTO categories (id,name,color) VALUES (1,'Strategic','#001D58'),(2,'Operational','#6B7280'),(3,'Compliance','#D4A017');
INSERT INTO tags (id,name,color) VALUES (1,'Backend','#001D58'),(2,'Frontend','#EC186E'),(3,'Data','#D4A017'),(4,'Urgent','#EC186E');

-- system roles: 1=System Admin(GLOBAL), 2=User(PM), 3=Guest(GUEST)
INSERT INTO system_roles (id,role_name,module,permissions) VALUES
 (1,'System Admin','GLOBAL','["all"]'),
 (2,'User','PM','["use"]'),
 (3,'Guest','GUEST','[]');

INSERT INTO users (id,name,email,password_hash,pm_role,active) VALUES ('u-admin-ponnsth','Admin (Local)','admin@ponnsth.com','100000:c06ddce4df12fa9a36fbd46283897aba:f1cf10ea3c4bfa5734a35cf7116a1f67f07ea87bfa1e8a2aec2890a63e76287b','PMO',1);
INSERT INTO users (id,name,email,password_hash,pm_role,active) VALUES ('u-ponnsiphon','Ponn STH','ponnsiphon@gmail.com','100000:daca21d51faa4bb33df1e64c89bcc1a6:bdf65982b7a605f19d8829622e5d4933b05a8832e4a6f8b52e4a644a179708ac','PMO',1);
INSERT INTO users (id,name,email,pm_role,active) VALUES ('u-somchai','สมชาย ใจดี','somchai@viriyah.co.th','Product Owner',1);
INSERT INTO users (id,name,email,pm_role,active) VALUES ('u-suda','สุดา วิริยะ','suda@viriyah.co.th','Project Manager',1);
INSERT INTO users (id,name,email,pm_role,active) VALUES ('u-nattapong','ณัฐพงษ์ พัฒนา','nattapong@viriyah.co.th','Working Team',1);
INSERT INTO users (id,name,email,pm_role,active) VALUES ('u-guest','ผู้ใช้ใหม่ (Guest)','guest@example.com',NULL,1);

INSERT INTO user_roles (user_id,role_id) SELECT id,1 FROM users WHERE email='ponnsiphon@gmail.com';
INSERT INTO user_roles (user_id,role_id) SELECT id,1 FROM users WHERE email='admin@ponnsth.com';
INSERT INTO user_roles (user_id,role_id) SELECT id,2 FROM users WHERE email='somchai@viriyah.co.th';
INSERT INTO user_roles (user_id,role_id) SELECT id,2 FROM users WHERE email='suda@viriyah.co.th';
INSERT INTO user_roles (user_id,role_id) SELECT id,2 FROM users WHERE email='nattapong@viriyah.co.th';
INSERT INTO user_roles (user_id,role_id) SELECT id,3 FROM users WHERE email='guest@example.com';

INSERT INTO login_logs (user_id,email,auth_provider,device_info,ip_address,success,login_time) VALUES
 ('u-ponnsiphon','ponnsiphon@gmail.com','Google','Chrome / Windows','58.11.0.1',1,unixepoch()-3600),
 ('u-somchai','somchai@viriyah.co.th','Local','Safari / macOS','58.11.0.2',1,unixepoch()-7200),
 ('u-suda','suda@viriyah.co.th','Local','Edge / Windows','58.11.0.3',1,unixepoch()-86400),
 (NULL,'unknown@outside.com','Local','curl/8.0','1.2.3.4',0,unixepoch()-1800);

INSERT INTO themes (id,name,description) VALUES (1,'Digital Transformation','ยกระดับกระบวนการด้วยดิจิทัล'),(2,'Customer Experience','ปรับปรุงประสบการณ์ลูกค้า'),(3,'AI & Data','โครงการด้าน AI/Data');
INSERT INTO initiatives (id,theme_id,name,description) VALUES (1,1,'Core Platform','แพลตฟอร์มกลาง'),(2,2,'CRM Core','ระบบลูกค้า'),(3,3,'AI Accelerator','เร่งการใช้ AI');
INSERT INTO requirements (id,initiative_id,title,type,owner_id,status) VALUES (1,1,'ระบบจัดการงาน (PM)','Initiatives','u-ponnsiphon','In Progress'),(2,2,'ระบบลูกค้า 360','CR','u-somchai','Not Start'),(3,3,'AI Chatbot ตอบลูกค้า','Initiatives','u-suda','Not Start');
INSERT INTO products (id,requirement_id,name,status,priority_id) VALUES (1,1,'PM Web App','In Progress',2),(2,2,'CRM Web App','Not Start',1),(3,3,'AI Chatbot','Not Start',2);
INSERT INTO product_owners (product_id,user_id) VALUES (1,'u-ponnsiphon'),(2,'u-somchai'),(3,'u-suda');

INSERT INTO projects (id,name,description,status,priority_id,category_id,theme_id,product_id) VALUES
 (1,'PM Platform Rollout','นำ PM Platform ไปใช้จริง','In Progress',2,1,1,1),
 (2,'CRM Modernization','ปรับปรุง CRM','In Progress',1,1,2,2),
 (3,'Data Warehouse Migration','ย้าย DW','Not Start',3,2,3,NULL),
 (4,'Mobile App Revamp','ปรับโฉมแอป','In Progress',2,2,2,2),
 (5,'AI Chatbot Pilot','นำร่อง Chatbot','Not Start',2,1,3,3);
INSERT INTO project_managers (project_id,user_id) VALUES (1,'u-ponnsiphon'),(1,'u-suda'),(2,'u-suda');

INSERT INTO features (id,product_id,project_id,name,status) VALUES (1,1,1,'Kanban Board','In Progress'),(2,1,1,'Reporting','In Progress'),(3,2,2,'Customer 360','Not Start'),(4,3,5,'NLP Model','Not Start');
INSERT INTO feature_resource_plans (feature_id,role_required,headcount,estimated_mandays) VALUES (1,'Developer',2,20),(3,'Developer',3,40);
INSERT INTO project_milestones (project_id,title,deliverable,target_date,status) VALUES (1,'MVP Launch','ปล่อย MVP ให้ทีมภายใน',unixepoch()+2592000,'In Progress'),(1,'Phase 2','CRUD + Gantt ครบ',unixepoch()+5184000,'Not Start'),(2,'CRM Kickoff','เริ่มโครงการ',unixepoch()+1296000,'Not Start');
INSERT INTO sprints (project_id,name,goal,start_date,end_date,status) VALUES (1,'Sprint 1','วาง core + auth',unixepoch()-1209600,unixepoch(),'Closed'),(1,'Sprint 2','CRUD + board',unixepoch(),unixepoch()+1209600,'Active');

INSERT INTO workflow_statuses (id,project_id,name,category,sort_order,color) VALUES
 (1,1,'Backlog','backlog',0,'#9AA0A6'),(2,1,'To Do','todo',1,'#6B7280'),(3,1,'In Progress','doing',2,'#D4A017'),(4,1,'Done','done',3,'#2E7D32'),(5,1,'Drop','drop',4,'#EC186E'),
 (6,2,'To Do','todo',1,'#6B7280'),(7,2,'In Progress','doing',2,'#D4A017'),(8,2,'Done','done',3,'#2E7D32');

INSERT INTO tasks (id,feature_id,project_id,assignee_id,title,workflow_status_id,priority_id,sort_order,estimated_hours,budget_cost,start_date,due_date,completed_datetime) VALUES
 (1,1,1,'u-somchai','ออกแบบ Data Schema',4,1,1,8,5000,unixepoch()-864000,unixepoch()-604800,unixepoch()-604800),
 (2,1,1,'u-suda','ทำ UI หน้า Login',4,2,2,6,4000,unixepoch()-604800,unixepoch()-259200,unixepoch()-259200),
 (3,1,1,'u-nattapong','เชื่อมต่อ Google OAuth',3,1,1,10,6000,unixepoch()-259200,unixepoch()+86400,NULL),
 (4,2,1,'u-somchai','ทำหน้า Dashboard',3,2,2,12,7000,unixepoch()-172800,unixepoch()+172800,NULL),
 (5,2,1,'u-suda','ทำ Export รายงาน',2,3,1,5,3000,unixepoch(),unixepoch()+432000,NULL),
 (6,2,1,'u-nattapong','ออกแบบ Gantt',1,3,1,9,4000,NULL,NULL,NULL),
 (7,3,2,'u-somchai','ออกแบบ Customer 360',6,1,1,9,6000,unixepoch(),unixepoch()+432000,NULL),
 (8,3,2,'u-suda','เชื่อม API ลูกค้า',7,2,1,14,8000,unixepoch(),unixepoch()+864000,NULL);

INSERT INTO task_worklogs (task_id,user_id,work_date,hours_spent,note) VALUES
 (1,'u-somchai',unixepoch()-604800,8,'เสร็จ schema หลัก'),
 (2,'u-suda',unixepoch()-259200,6,'UI login เสร็จ'),
 (3,'u-nattapong',unixepoch()-86400,4,'ตั้งค่า OAuth client'),
 (4,'u-somchai',unixepoch()-86400,5,'วาง layout dashboard'),
 (3,'u-nattapong',unixepoch(),3,'debug callback');

INSERT INTO issues (reference_type,reference_id,title,description,action_plan,status,raised_by) VALUES ('project',1,'Google login secret หลุด','client secret เคยหลุด','reset secret','Closed','u-ponnsiphon'),('task',5,'ยังไม่มี library export','ต้องเลือกวิธี','ประเมิน 2 ทาง','Open','u-suda');
INSERT INTO risks (project_id,title,probability,impact,mitigation_plan,status) VALUES (1,'ทีมมีเวลาจำกัด','High','Medium','จัดลำดับ P1 ก่อน','Open'),(2,'ข้อมูลลูกค้าไม่สะอาด','Medium','High','ทำ data cleansing','Open');
INSERT INTO meetings (id,title,meeting_date,minutes_longtext) VALUES (1,'PM Platform Kickoff',unixepoch()-604800,'สรุป: อนุมัติเริ่มโครงการ');
INSERT INTO meeting_attendees (meeting_id,user_id) VALUES (1,'u-ponnsiphon'),(1,'u-somchai');
INSERT INTO user_todos (user_id,title,status,target_date) SELECT id,'รีวิว PR วันนี้','todo',unixepoch()+86400 FROM users WHERE email='ponnsiphon@gmail.com';
INSERT INTO system_secrets (system_name,key_name,note) VALUES ('Google OAuth','GOOGLE_CLIENT_SECRET','ตั้งใน Cloudflare Secret'),('Telegram Bot','BOT_TOKEN','ใช้แจ้งเตือน');
