(function () {
  try {
    var t = localStorage.getItem("loterias-ia:theme");
    var prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (t === "dark" || (!t && prefersDark)) {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {}
})();
