const API = "/characters";

document.getElementById("uploadForm").addEventListener("submit", async e => {
  e.preventDefault();
  const form = new FormData(e.target);
  const res = await fetch(API, { method: "POST", body: form });
  const data = await res.json();
  document.getElementById("uploadStatus").textContent = JSON.stringify(data);
  loadDB();
});

async function loadDB() {
  const res = await fetch(API);
  const data = await res.json();
  document.getElementById("cards").innerHTML = data.items.map(c => `
    <div class="card">
      <img src="${c.preview || ""}" alt="">
      <div>${c.id} — ${c.owner}</div>
    </div>
  `).join("");
}
loadDB();

