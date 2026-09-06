# QA V63 - Project Name Input UI Hotfix

## Root Cause
- Component `F` ถูกประกาศภายใน `ProjectWizard`
- ทุกครั้งที่ state เปลี่ยนจากการพิมพ์ React มองว่า `F` เป็น component type ใหม่
- Input จึงถูก unmount/remount ทุก keystroke ทำให้ focus หลุดและดูเหมือนช่องค้าง

## Fix
- ย้าย `F` และ `FieldProps` ออกนอก `ProjectWizard` ให้ component identity คงที่
- ไม่เปลี่ยน API, Database, validation หรือ business logic
- ครอบคลุม input/select/textarea/MultiSelect ทุกช่องใน Project Create/Edit
- Version: v63.2609070045

## Static QA
- วงเล็บและ JSX balance ผ่าน
- ยืนยันมี `function F` เพียงตำแหน่งเดียวและอยู่นอก ProjectWizard
- ZIP integrity ผ่าน
