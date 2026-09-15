export function parseOfx(raw) {
  const items = [];
  const blocks = raw.split(/<\/STMTTRN>|<STMTTRN>/i);
  blocks.forEach((block) => {
    if (!/<(?:TRNAMT|AMT)>/i.test(block)) return;
    const amtMatch = block.match(/<(?:TRNAMT|AMT)>([\d.\-]+)/i);
    const memoMatch = block.match(/<(?:MEMO|NAME)>([^<\n\r]+)/i);
    const dateMatch = block.match(/<(?:DTPOSTED|DTSTART)>(\d{8})/i);
    if (!amtMatch) return;
    const rawVal = parseFloat(amtMatch[1]);
    let date = new Date().toISOString().slice(0, 10);
    if (dateMatch) {
      const y = dateMatch[1].slice(0, 4), m = dateMatch[1].slice(4, 6), d = dateMatch[1].slice(6, 8);
      date = `${y}-${m}-${d}`;
    }
    items.push({
      date,
      desc: memoMatch ? memoMatch[1].trim() : 'Lançamento OFX',
      val: Math.abs(rawVal),
      tipo: rawVal >= 0 ? 'receita' : 'despesa',
      cat: null
    });
  });
  if (!items.length) { const e = new Error('no rows'); e.code = 'NO_ROWS'; throw e; }
  return items;
}
