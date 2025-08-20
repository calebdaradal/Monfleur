fetch("../data/characters.json")
  .then(res => res.json())
  .then(characters => {
    const grid = document.getElementById("character-grid");
    const searchInput = document.getElementById("search");

    function renderList(filter = "") {
      grid.innerHTML = "";
      characters
        .filter(c =>
          c.name.toLowerCase().includes(filter.toLowerCase()) ||
          c.id.toLowerCase().includes(filter.toLowerCase()) ||
          c.owner.toLowerCase().includes(filter.toLowerCase())
        )
        .forEach(c => {
          const card = document.createElement("div");
          card.className = "character-card";
          card.innerHTML = `
            <img src="../${c.image}" alt="${c.name}" style="width:100%;border-radius:4px;">
            <h3>${c.name}</h3>
            <p>ID: ${c.id}</p>
            <p>Owner: ${c.owner}</p>
            <a href="character.html?id=${c.id}">View Details</a>
          `;
          grid.appendChild(card);
        });
    }

    renderList();
    searchInput.addEventListener("input", e => renderList(e.target.value));
  });

