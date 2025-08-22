// functions/characters.js

export async function onRequestGet() {
  // Return the list of characters
  const list = await getFile("data/index.json");
  return json(list ?? { items: [] });
}

export async function onRequestPost({ request, env }) {
  const form = await request.formData();

  const id = form.get("mlNumber");
  if (!id) return json({ error: "mlNumber is required" }, 400);

  // Build character object
  const character = {
    id,
    owner: form.get("owner") || "",
    artist: form.get("artist") || "",
    biome: form.get("biome") || "",
    rarity: form.get("rarity") || "",
    traits: (form.get("traits") || "").split(",").map(s => s.trim()).filter(Boolean),
    notes: form.get("notes") || "",
    status: form.get("status") || "",
    value: form.get("value") || "",
    txLog: form.get("txlog") || "",
    images: {
      main: form.get("mainUrl") || "",
      preview: form.get("previewUrl") || ""
    },
    updatedAt: new Date().toISOString()
  };

  // Save character JSON into /data/characters
  await putFile(`data/characters/${id}.json`, JSON.stringify(character, null, 2));

  // Update index.json
  const index = (await getFile("data/index.json")) || { items: [] };
  const existingIdx = index.items.findIndex(c => c.id === id);
  const card = { id, owner: character.owner, preview: character.images.preview };
  if (existingIdx >= 0) index.items[existingIdx] = card;
  else index.items.push(card);
  await putFile("data/index.json", JSON.stringify(index, null, 2));

  return json({ ok: true, id });
}

// --- helpers ---
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

// Minimal local file helpers (for demo – replace with GitHub API in production)
import fs from "fs/promises";

async function getFile(path) {
  try {
    const buf = await fs.readFile(path, "utf8");
    return JSON.parse(buf);
  } catch { return null; }
}
async function putFile(path, content) {
  await fs.mkdir(path.split("/").slice(0, -1).join("/"), { recursive: true });
  await fs.writeFile(path, content, "utf8");
}

