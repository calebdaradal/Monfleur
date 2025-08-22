// functions/characters/[id].js

export async function onRequestGet({ params }) {
  const { id } = params;
  const character = await getFile(`data/characters/${id}.json`);
  if (!character) return json({ error: "Not found" }, 404);
  return json(character);
}

// --- helpers ---
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

import fs from "fs/promises";
async function getFile(path) {
  try {
    const buf = await fs.readFile(path, "utf8");
    return JSON.parse(buf);
  } catch { return null; }
}

