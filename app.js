const input = document.getElementById("numberInput");
const baseSelect = document.getElementById("baseSelect");
const convertBtn = document.getElementById("convertBtn");
const clearBtn = document.getElementById("clearBtn");
const statusBox = document.getElementById("statusBox");
const statusIcon = document.getElementById("statusIcon");
const statusTitle = document.getElementById("statusTitle");
const statusText = document.getElementById("statusText");
const breakdown = document.getElementById("breakdown");
const breakdownEmpty = document.getElementById("breakdownEmpty");
const historyList = document.getElementById("historyList");
const historyEmpty = document.getElementById("historyEmpty");
const toast = document.getElementById("toast");
let lastValues = null;
let history = [];
let toastTimer;

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}
function formatBase(value, base) {
  if (base === 2) return value.toString(2);
  if (base === 8) return value.toString(8);
  if (base === 10) return value.toString(10);
  return value.toString(16).toUpperCase();
}
function parseValue(raw, base) {
  const cleaned = raw.trim().replace(/\s+/g, "");
  if (!cleaned) throw new Error("Enter a value to convert.");
  const patterns = {2:/^[01]+$/,8:/^[0-7]+$/,10:/^[0-9]+$/,16:/^[0-9a-fA-F]+$/};
  if (!patterns[base].test(cleaned)) {
    const labels = {2:"Binary accepts only 0 and 1.",8:"Octal accepts digits 0 to 7.",10:"Decimal accepts digits 0 to 9.",16:"Hexadecimal accepts digits 0 to 9 and letters A to F."};
    throw new Error(labels[base]);
  }
  // BigInt avoids precision loss for large integer inputs.
  return BigInt(parseInt(cleaned[0], base).toString()); // replaced below for safe exact parsing
}
function parseBigIntBase(raw, base) {
  const cleaned = raw.trim().replace(/\s+/g, "");
  if (!cleaned) throw new Error("Enter a value to convert.");
  const patterns = {2:/^[01]+$/,8:/^[0-7]+$/,10:/^[0-9]+$/,16:/^[0-9a-fA-F]+$/};
  if (!patterns[base].test(cleaned)) {
    const labels = {2:"Binary accepts only 0 and 1.",8:"Octal accepts digits 0 to 7.",10:"Decimal accepts digits 0 to 9.",16:"Hexadecimal accepts digits 0 to 9 and letters A to F."};
    throw new Error(labels[base]);
  }
  const digits = "0123456789ABCDEF";
  let result = 0n;
  for (const ch of cleaned.toUpperCase()) {
    result = result * BigInt(base) + BigInt(digits.indexOf(ch));
  }
  return result;
}
function setStatus(type, title, message, icon) {
  statusBox.className = `status-box ${type}`;
  statusIcon.textContent = icon;
  statusTitle.textContent = title;
  statusText.textContent = message;
}
function showBreakdown(raw, base, value) {
  breakdown.innerHTML = "";
  const digits = raw.trim().replace(/\s+/g, "").toUpperCase();
  const digitValues = [...digits].map(ch => parseInt(ch, base));
  const cards = [...digits].map((digit, index) => {
    const power = digits.length - index - 1;
    const amount = BigInt(digitValues[index]) * (BigInt(base) ** BigInt(power));
    const card = document.createElement("div");
    card.className = "place-card";
    card.innerHTML = `<div class="digit">${digit}</div><div class="place">${base}<sup>${power}</sup> place</div><div class="calc">${digitValues[index]} × ${base}<sup>${power}</sup></div>`;
    return {card, amount, power, digit, digitValue: digitValues[index]};
  });
  cards.forEach(item => breakdown.appendChild(item.card));
  const eq = document.createElement("div");
  eq.className = "equation";
  const terms = cards.map(item => `${item.digitValue} × ${base}<sup>${item.power}</sup>`).join(" + ");
  eq.innerHTML = `<span>DECIMAL CALCULATION&nbsp; </span>${terms} = <b>${value.toString()}</b>`;
  breakdown.appendChild(eq);
  breakdown.classList.remove("hidden");
  breakdownEmpty.classList.add("hidden");
}
function renderHistory() {
  historyList.innerHTML = "";
  historyEmpty.classList.toggle("hidden", history.length > 0);
  history.slice(0, 5).forEach(item => {
    const row = document.createElement("div");
    row.className = "history-item";
    const left = document.createElement("div");
    const src = document.createElement("div");
    src.className = "history-source";
    src.textContent = item.source;
    const meta = document.createElement("div");
    meta.className = "history-meta";
    meta.textContent = `Base ${item.base} → Decimal`;
    left.append(src, meta);
    const right = document.createElement("div");
    const answer = document.createElement("div");
    answer.className = "history-answer";
    answer.textContent = item.decimal;
    const base = document.createElement("div");
    base.className = "history-base";
    base.textContent = `DECIMAL VALUE`;
    right.append(answer, base);
    row.append(left, right);
    historyList.appendChild(row);
  });
}
function convert() {
  const raw = input.value;
  const base = Number(baseSelect.value);
  try {
    const value = parseBigIntBase(raw, base);
    const values = {
      binary: formatBase(value, 2),
      octal: formatBase(value, 8),
      decimal: value.toString(10),
      hex: formatBase(value, 16)
    };
    document.getElementById("binaryOut").textContent = values.binary;
    document.getElementById("octalOut").textContent = values.octal;
    document.getElementById("decimalOut").textContent = values.decimal;
    document.getElementById("hexOut").textContent = values.hex;
    document.getElementById("decimalMetric").textContent = values.decimal;
    document.getElementById("baseMetric").textContent = `Base ${base}`;
    setStatus("success", "Conversion successful", `Input interpreted as base ${base}. Equivalent values are ready below.`, "✓");
    showBreakdown(raw, base, value);
    lastValues = values;
    history.unshift({source:raw.trim(),base,decimal:values.decimal});
    history = history.slice(0, 5);
    renderHistory();
    notify("Number converted successfully.");
  } catch (error) {
    setStatus("error", "Cannot convert this input", error.message, "!");
    notify(error.message);
  }
}
convertBtn.addEventListener("click", convert);
input.addEventListener("keydown", e => { if (e.key === "Enter") convert(); });
clearBtn.addEventListener("click", () => {
  input.value = "";
  ["binaryOut","octalOut","decimalOut","hexOut","decimalMetric","baseMetric"].forEach(id => document.getElementById(id).textContent = "—");
  setStatus("", "Ready to convert", "Enter a value and select its number system.", "◎");
  breakdown.innerHTML = "";
  breakdown.classList.add("hidden");
  breakdownEmpty.classList.remove("hidden");
  lastValues = null;
  input.focus();
});
document.querySelectorAll(".examples button").forEach(button => {
  button.addEventListener("click", () => {
    input.value = button.dataset.value;
    baseSelect.value = button.dataset.base;
    convert();
  });
});
document.querySelectorAll(".copy").forEach(button => {
  button.addEventListener("click", async () => {
    if (!lastValues) { notify("Convert a number first."); return; }
    const value = lastValues[button.dataset.copy];
    try {
      await navigator.clipboard.writeText(value);
      notify("Copied to clipboard.");
    } catch {
      const temp = document.createElement("textarea");
      temp.value = value;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand("copy");
      temp.remove();
      notify("Copied to clipboard.");
    }
  });
});
document.getElementById("clearHistory").addEventListener("click", () => {
  history = [];
  renderHistory();
  notify("Conversion history cleared.");
});
