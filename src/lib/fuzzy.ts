/** Simple fuzzy score — higher is better. 0 = no match. */
export function fuzzyScore(query: string, text: string): number {
  const q = query.trim().toLowerCase();
  const t = text.toLowerCase();
  if (!q) return 1;
  if (t === q) return 1000;
  if (t.startsWith(q)) return 500 + (100 - Math.min(q.length, 100));
  if (t.includes(q)) return 300;

  let ti = 0;
  let score = 0;
  let streak = 0;
  for (let qi = 0; qi < q.length; qi++) {
    const ch = q[qi];
    let found = false;
    while (ti < t.length) {
      if (t[ti] === ch) {
        score += 10 + streak * 4;
        if (ti === 0 || t[ti - 1] === " " || t[ti - 1] === "-" || t[ti - 1] === ".") {
          score += 15;
        }
        streak += 1;
        ti += 1;
        found = true;
        break;
      }
      streak = 0;
      ti += 1;
    }
    if (!found) return 0;
  }
  return score;
}
