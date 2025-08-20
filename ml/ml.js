fetch("../data/characters.json")
  .then(res => res.json())
  .then(characters => {
    const grid = document.getElementById("character-grid");
    const searchInput = document.getElementById("search");

    let currentSlide = 0;
    const itemsPerSlide = 5; // show 5 across
    const rowLimit = 3;      // max 3 rows visible

    function renderList(filter = "") {
      grid.innerHTML = "";
      const filtered = characters.filter(c =>
        c.name.toLowerCase().includes(filter.toLowerCase()) ||
        c.id.toLowerCase().includes(filter.toLowerCase()) ||
        c.owner.toLowerCase().includes(filter.toLowerCase())
      );

      filtered.forEach(c => {
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

      updateSlide();
    }

    function updateSlide() {
      const offset = -(currentSlide * (100 / itemsPerSlide)) + "%";
      grid.style.transform = `translateX(${offset})`;
    }

    document.getElementById("arrow-left").addEventListener("click", () => {
      if (currentSlide > 0) {
        currentSlide--;
        updateSlide();
      }
    });

    document.getElementById("arrow-right").addEventListener("click", () => {
      const totalItems = grid.children.length;
      const maxSlide = Math.ceil(totalItems / itemsPerSlide) - 1;
      if (currentSlide < maxSlide) {
        currentSlide++;
        updateSlide();
      }
    });

    renderList();
    searchInput.addEventListener("input", e => {
      currentSlide = 0;
      renderList(e.target.value);
    });
  });
