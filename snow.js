document.addEventListener("DOMContentLoaded", function () {
  const numSnowflakes = 50;
  const snowflakesContainer = document.querySelector(".snowflakes");

  for (let i = 0; i < numSnowflakes; i++) {
    createSnowflake();
  }

  function createSnowflake() {
    const snowflake = document.createElement("div");
    snowflake.classList.add("snowflake");
    snowflake.style.left = `${Math.random() * 100}vw`;
    snowflake.style.animationDuration = `${Math.random() * 3 + 2}s`;

    snowflake.addEventListener("animationiteration", () => {
      snowflake.style.left = `${Math.random() * 100}vw`;
    });

    snowflakesContainer.appendChild(snowflake);
  }
});
