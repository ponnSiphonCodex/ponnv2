// รูปแบบวันที่มาตรฐานเดียวของทั้งระบบ: YYYY-MM-DD และ YYYY-MM-DD HH:mm น.
const TZ = "Asia/Bangkok";
export function fmtDate(u: number | null | undefined): string { if (!u) return "-"; return new Date(u * 1000).toLocaleDateString("sv-SE", { timeZone: TZ }); }
export function fmtDateTime(u: number | null | undefined): string { if (!u) return "-"; return new Date(u * 1000).toLocaleString("sv-SE", { timeZone: TZ }).slice(0, 16) + " น."; }
export function fmtMonth(u: number): string { return new Date(u * 1000).toLocaleDateString("sv-SE", { timeZone: TZ }).slice(0, 7); }
