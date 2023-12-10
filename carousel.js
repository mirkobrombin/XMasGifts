document.addEventListener("DOMContentLoaded", function () {
  const pages = document.querySelectorAll(".carousel-pages-page");
  const dotsContainer = document.querySelector(".carousel-dots");
  const dots = [];
  const prevButton = document.querySelector(".carousel-controls-button--prev");
  const nextButton = document.querySelector(".carousel-controls-button--next");
  const carouselPages = document.querySelector(".carousel-pages");

  let currentPage = 0;
  let touchStartX = 0;
  let touchEndX = 0;

  pages.forEach((page, index) => {
    const dot = document.createElement("span");
    dot.classList.add("carousel-dots-dot");
    dotsContainer.appendChild(dot);
    dots.push(dot);

    dot.addEventListener("click", () => {
      goToPage(index);
    });
  });

  dots[currentPage].classList.add("carousel-dots-dot--active");

  prevButton.classList.add("hidden");

  function goToPage(index) {
    pages[currentPage].classList.remove("carousel-pages-page--active");
    dots[currentPage].classList.remove("carousel-dots-dot--active");

    pages[index].classList.add("carousel-pages-page--active");
    dots[index].classList.add("carousel-dots-dot--active");

    currentPage = index;

    const translation = -currentPage * 100 + "%";
    carouselPages.style.transform = `translateX(${translation})`;

    if (currentPage === 0) {
      prevButton.classList.add("hidden");
    } else {
      prevButton.classList.remove("hidden");
    }
  }

  document.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
  });

  document.addEventListener("touchmove", (e) => {
    e.preventDefault();
  });

  document.addEventListener("touchend", (e) => {
    touchEndX = e.changedTouches[0].clientX;
    handleSwipe();
  });

  function handleSwipe() {
    const swipeThreshold = 50;

    const deltaX = touchEndX - touchStartX;

    if (deltaX > swipeThreshold && currentPage > 0) {
      goToPage(currentPage - 1);
    } else if (deltaX < -swipeThreshold && currentPage < pages.length - 1) {
      goToPage(currentPage + 1);
    }
  }

  prevButton.addEventListener("click", () => {
    if (currentPage > 0) {
      goToPage(currentPage - 1);
    }
  });

  nextButton.addEventListener("click", () => {
    if (currentPage < pages.length - 1) {
      goToPage(currentPage + 1);
    }
  });
});
