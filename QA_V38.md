# QA V38

- Source: ponnv2-v37.zip
- Root cause เดิม: JSX ปิด map ผิดใน `apps/web/src/components/board-client.tsx` บรรทัด 101
- แก้ไขตามรายการ: Gantt เดิม, version 2 บรรทัด, Meeting attachment count, ย้าย Sync เข้า editor, drawer animation

## Static checks
- PASS: board_syntax_fixed
- PASS: gantt_restored
- PASS: version_mobile
- PASS: attachment_count
- PASS: no_has_note_badge
- PASS: sync_inside_editor
- PASS: drawer_animation

## Build check
- Dependency installation ใน sandbox ไม่สำเร็จ จึงยังไม่มี executable production build result จาก environment นี้
- Cloudflare จะติดตั้ง dependency ใหม่ด้วย `bun install` ก่อน `npm run build:worker`
