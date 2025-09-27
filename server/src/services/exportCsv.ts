export function toCSV(headers: string[], rows: Array<Array<string | number | null | undefined>>): string {
  const esc = (v: any) => {
    if (v == null) return '';
    const s = String(v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  return [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
}
