
const fs = require("fs");

const URL = "http://127.0.0.1:5001/noti-currency/us-central1/getCurrency?from=KRW&to=USD";
const CSV_FILE = "./currency.csv";

const header = ["time","status","from","to","raw_response","error"];

function csvEscape(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  // CSV 규칙: , " \n 포함되면 전체를 "로 감싸고 내부 "는 ""로 이스케이프
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function ensureFile() {
  if (!fs.existsSync(CSV_FILE)) {
    // Excel-friendly UTF-8 BOM
    const bom = "\uFEFF";
    fs.writeFileSync(CSV_FILE, bom + header.join(",") + "\n", "utf8");
  }
}

function appendRow(row) {
  const line = row.map(csvEscape).join(",") + "\n";
  fs.appendFileSync(CSV_FILE, line, "utf8");
  console.log(line.trimEnd());
}

ensureFile();

async function tick() {
  const time = new Date().toISOString();
  try {
    const res = await fetch(URL);
    const body = await res.text();
    appendRow([time, res.status, "KRW", "USD", body, ""]);
  } catch (e) {
    appendRow([time, "ERROR", "KRW", "USD", "", e?.message ?? String(e)]);
  }
}

tick(); // 시작하자마자 1번 찍고
setInterval(tick, 60_000);

process.on("SIGINT", () => {
  appendRow([new Date().toISOString(), "STOP", "", "", "", "terminated"]);
  process.exit(0);
});
