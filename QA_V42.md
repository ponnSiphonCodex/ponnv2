# QA V42

## Regression fixes
- PASS: Gantt filter block rendered once only
- PASS: Profile removed Workload, Overdue, Availability Status, Role / Skills
- PASS: Global body/form font = 15px
- PASS: Page Header = 18px
- PASS: Field hint = 12px, neutral gray, medium weight
- PASS: Month/year moved to dedicated header band above date scale
- PASS: Left label header has matching spacer to prevent scale offset
- PASS: Project List page exists with Active Project count and Create Project button
- PASS: Previous board-client JSX compile error remains fixed
- PASS: Today marker sibling JSX wrapped with Fragment
- PASS: ZIP integrity check

## Changed files
- apps/web/src/components/gantt-client.tsx
- apps/web/src/components/profile-modal.tsx
- apps/web/src/components/app-shell.tsx
- apps/web/src/components/board-client.tsx
- apps/web/src/app/pm/projects/page.tsx
- apps/web/src/app/globals.css
