const WIN1252_EXTENDED_MAP: Record<number, number> = {
  0x20ac: 0x80, // €
  0x201a: 0x82, // ‚
  0x0192: 0x83, // ƒ
  0x201e: 0x84, // „
  0x2026: 0x85, // …
  0x2020: 0x86, // †
  0x2021: 0x87, // ‡
  0x02c6: 0x88, // ˆ
  0x2030: 0x89, // ‰
  0x0160: 0x8a, // Š
  0x2039: 0x8b, // ‹
  0x0152: 0x8c, // Œ
  0x017d: 0x8e, // Ž
  0x2018: 0x91, // ‘
  0x2019: 0x92, // ’
  0x201c: 0x93, // “
  0x201d: 0x94, // ”
  0x2022: 0x95, // •
  0x2013: 0x96, // –
  0x2014: 0x97, // —
  0x02dc: 0x98, // ˜
  0x2122: 0x99, // ™
  0x0161: 0x9a, // š
  0x203a: 0x9b, // ›
  0x0153: 0x9c, // œ
  0x017e: 0x9e, // ž
  0x0178: 0x9f, // Ÿ
};

function encodeWindows1252(value: string) {
  const bytes: number[] = [];
  for (const char of value) {
    const codePoint = char.codePointAt(0);
    if (codePoint === undefined) continue;

    if (codePoint <= 0x7f) {
      bytes.push(codePoint);
      continue;
    }

    const mapped = WIN1252_EXTENDED_MAP[codePoint];
    if (mapped !== undefined) {
      bytes.push(mapped);
      continue;
    }

    if (codePoint >= 0xa0 && codePoint <= 0xff) {
      bytes.push(codePoint);
      continue;
    }

    bytes.push(0x3f); // '?'
  }

  return new Uint8Array(bytes);
}

function concatBytes(chunks: Uint8Array[]) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;

  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }

  return output;
}

function escapePdfText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r/g, " ")
    .replace(/\n/g, " ");
}

function buildSimplePdf(lines: string[]) {
  const textLines = lines.length ? lines : ["Relatorio sem dados."];
  const content = [
    "BT",
    "/F1 11 Tf",
    "50 790 Td",
    ...textLines.flatMap((line, index) => [`${index === 0 ? "" : "0 -14 Td"}(${escapePdfText(line)}) Tj`]),
    "ET",
  ].join("\n");

  const contentBytes = encodeWindows1252(content);
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
    `4 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n${content}\nendstream\nendobj\n`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n",
  ];

  const headerBytes = encodeWindows1252("%PDF-1.4\n");
  const objectBytes = objects.map((obj) => encodeWindows1252(obj));

  const offsets: number[] = [0];
  let currentOffset = headerBytes.length;
  for (const obj of objectBytes) {
    offsets.push(currentOffset);
    currentOffset += obj.length;
  }

  const xrefStart = currentOffset;
  const xref = [
    "xref",
    `0 ${objects.length + 1}`,
    "0000000000 65535 f ",
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `),
    "trailer",
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    "startxref",
    String(xrefStart),
    "%%EOF",
  ].join("\n");

  return concatBytes([headerBytes, ...objectBytes, encodeWindows1252(xref)]);
}

export function downloadSimplePdf(filename: string, lines: string[]) {
  const bytes = buildSimplePdf(lines);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
