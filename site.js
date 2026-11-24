const menuButton = document.querySelector(".menu-button");
const menuPanel = document.querySelector(".menu-panel");

function setMenuOpen(open) {
  menuButton.setAttribute("aria-expanded", String(open));
  menuPanel.setAttribute("aria-hidden", String(!open));
  menuPanel.classList.toggle("open", open);
  document.body.classList.toggle("menu-open", open);
}

menuButton.addEventListener("click", () => {
  setMenuOpen(menuButton.getAttribute("aria-expanded") !== "true");
});

menuPanel.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenuOpen(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
    setMenuOpen(false);
    menuButton.focus();
  }
});

const contactForm = document.querySelector("#contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const recipient = formData.get("topic");
    const subject = String(formData.get("subject"));
    const body = [
      `Name: ${formData.get("name")}`,
      `Email: ${formData.get("email")}`,
      "",
      formData.get("message"),
    ].join("\n");
    document.querySelector("#contact-status").textContent = "Opening your email app...";
    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

const articleSearch = document.querySelector("#article-search");
if (articleSearch) {
  const articleCards = Array.from(document.querySelectorAll(".archive-card"));
  const pageSize = 4;
  const pageCountLabel = document.querySelector("#archive-page");
  const resultCount = document.querySelector("#archive-count");
  const emptyMessage = document.querySelector("#archive-empty");
  const previousButton = document.querySelector("#archive-previous");
  const nextButton = document.querySelector("#archive-next");
  let currentPage = 1;

  function updateArchive() {
    const query = articleSearch.value.trim().toLocaleLowerCase();
    const matches = articleCards.filter((card) => card.textContent.toLocaleLowerCase().includes(query));
    const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
    currentPage = Math.min(currentPage, pageCount);

    articleCards.forEach((card) => { card.hidden = true; });
    matches.slice((currentPage - 1) * pageSize, currentPage * pageSize).forEach((card) => { card.hidden = false; });

    resultCount.textContent = `${matches.length} ${matches.length === 1 ? "post" : "posts"}${query ? " found" : ""}`;
    pageCountLabel.textContent = matches.length ? `Page ${currentPage} of ${pageCount}` : "No results";
    previousButton.disabled = currentPage === 1 || matches.length === 0;
    nextButton.disabled = currentPage === pageCount || matches.length === 0;
    emptyMessage.hidden = matches.length !== 0;
  }

  articleSearch.addEventListener("input", () => {
    currentPage = 1;
    updateArchive();
  });
  previousButton.addEventListener("click", () => {
    currentPage -= 1;
    updateArchive();
  });
  nextButton.addEventListener("click", () => {
    currentPage += 1;
    updateArchive();
  });
  updateArchive();
}
