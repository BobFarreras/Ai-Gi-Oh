// scripts/lib/cli-ui.mjs - Toolkit de UI para terminal con tema AI-GI-OH (ANSI puro, sin dependencias).

const SUPPORTS_COLOR =
  process.env.FORCE_COLOR !== "0" &&
  process.env.NO_COLOR === undefined &&
  (process.stdout.isTTY || process.env.FORCE_COLOR === "1" || process.env.CI === undefined);

const CODES = {
  reset: "[0m",
  bold: "[1m",
  dim: "[2m",
  cyan: "[36m",
  cyanBright: "[96m",
  green: "[32m",
  greenBright: "[92m",
  yellow: "[33m",
  red: "[31m",
  redBright: "[91m",
  magenta: "[35m",
  blue: "[34m",
  gray: "[90m",
  white: "[37m",
};

/** Envuelve `text` con un código ANSI si la terminal soporta color. */
export function paint(colorName, text) {
  const code = CODES[colorName];
  if (!code || !SUPPORTS_COLOR) return String(text);
  return `${code}${text}${CODES.reset}`;
}

/** Elimina todos los códigos ANSI de una cadena (útil para tests y logs limpios). */
export function stripAnsi(text) {
  return String(text).replace(/\[[0-9;]*m/g, "");
}

/** Cabecera ASCII de la marca AI-GI-OH. Devuelve la cadena (no imprime). */
export function banner() {
  const art = [
    "  █████╗ ██╗      ██████╗ ██╗      ██████╗ ██╗  ██╗",
    " ██╔══██╗██║     ██╔════╝ ██║     ██╔═══██╗██║  ██║",
    " ███████║██║ ███╗██║  ███╗██║ ███╗██║   ██║███████║",
    " ██╔══██║██║     ██║   ██║██║     ██║   ██║██╔══██║",
    " ██║  ██║██║     ╚██████╔╝██║     ╚██████╔╝██║  ██║",
    " ╚═╝  ╚═╝╚═╝      ╚═════╝ ╚═╝      ╚═════╝ ╚═╝  ╚═╝",
  ];
  const subtitle = "        ⚡ Setup de contribuidor local ⚡";
  return [
    "",
    ...art.map((line) => paint("cyanBright", line)),
    paint("magenta", subtitle),
    "",
  ].join("\n");
}

/** Línea separadora con título de sección. */
export function section(title) {
  const line = "─".repeat(Math.max(0, 52 - title.length - 4));
  return `\n${paint("cyan", "▓▓")} ${paint("bold", paint("cyanBright", title.toUpperCase()))} ${paint("gray", line)}`;
}

const ICONS = {
  ok: paint("greenBright", "✔"),
  fail: paint("redBright", "✖"),
  warn: paint("yellow", "▲"),
  info: paint("cyan", "ℹ"),
  step: paint("magenta", "▶"),
  pending: paint("gray", "·"),
};

/** Formatea una línea de estado: `<icono> <texto>`. Pura, testeable. */
export function statusLine(kind, text, detail) {
  const icon = ICONS[kind] ?? ICONS.info;
  const suffix = detail ? ` ${paint("gray", `— ${detail}`)}` : "";
  return `  ${icon} ${text}${suffix}`;
}

export const ui = {
  print: (text = "") => console.log(text),
  banner: () => console.log(banner()),
  section: (title) => console.log(section(title)),
  ok: (text, detail) => console.log(statusLine("ok", text, detail)),
  fail: (text, detail) => console.log(statusLine("fail", text, detail)),
  warn: (text, detail) => console.log(statusLine("warn", text, detail)),
  info: (text, detail) => console.log(statusLine("info", text, detail)),
  step: (text, detail) => console.log(statusLine("step", text, detail)),
  pending: (text, detail) => console.log(statusLine("pending", text, detail)),
  note: (text) => console.log(`    ${paint("gray", text)}`),
  command: (text) => console.log(`    ${paint("cyanBright", "$")} ${paint("white", text)}`),
};
