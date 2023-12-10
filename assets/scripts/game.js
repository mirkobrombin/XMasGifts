document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const elements = {
    body: document.body,
    player: document.getElementById("player"),
    giftContainer: document.getElementById("gift-container"),
    mineContainer: document.getElementById("mine-container"),
    grinchContainer: document.getElementById("grinch-container"),
    candyContainer: document.getElementById("candy-container"),
    gameContainer: document.getElementById("game-container"),
    gameMessages: document.getElementById("game-messages"),
    scoreValue: document.getElementById("score-value"),
    scoreReqValue: document.getElementById("score-req-value"),
    lifesValue: document.getElementById("lifes-value"),
    levelValue: document.getElementById("level-value"),
    candiesValue: document.getElementById("candies-value"),
    roofs: document.getElementById("roofs"),
    menu: document.getElementById("menu"),
    pauseMenu: document.getElementById("pause"),
    settings: document.getElementById("settings"),
    creditsMenu: document.getElementById("credits"),
    playButton: document.getElementById("play-button"),
    resumeButton: document.getElementById("resume-button"),
    instructionsButton: document.getElementById("instructions-button"),
    settingsButton: document.getElementById("settings-button"),
    instructions: document.getElementById("instructions"),
    backButtons: document.querySelectorAll("#back-button"),
    gameoverMenu: document.getElementById("gameover-menu"),
    finalScore: document.getElementById("final-score"),
    playAgainButton: document.getElementById("play-again-button"),
    shareButton: document.getElementById("share-button"),
    creditsButton: document.getElementById("credits-button"),
    settingsMusic: document.getElementById("settings-music"),
    settingsSound: document.getElementById("settings-sound"),
    settingsFullscreen: document.getElementById("settings-fullscreen"),
    pauseStatus: document.getElementById("pause-status"),
    musicStatus: document.getElementById("music-status"),
    soundStatus: document.getElementById("sound-status"),
    shootButton: document.getElementById("shoot-button"),
  };

  // Sounds
  const sounds = {
    giftCollectSound: new Audio("/assets/sounds/gift-collect.wav"),
    bombImpactSound: new Audio("/assets/sounds/bomb-impact.wav"),
    shootSound: new Audio("/assets/sounds/shoot.wav"),
  };

  // Tracks
  const tracks = [
    "/assets/music/music-1.mp3",
    "/assets/music/music-2.mp3",
    "/assets/music/music-3.mp3",
  ];

  // Platform
  const platform = navigator.userAgent.match(
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
  )
    ? "mobile"
    : "desktop";

  // Game state
  let state = {
    score: 0,
    currentLevel: 1,
    lifes: 3,
    giftsRequired: 10,
    gameInterval: null,
    giftInterval: null,
    isGameRunning: false,
    levelReqMultiplier: 1.5,
    comboCount: 0,
    comboMultiplier: 1,
    speedMultiplier: 0.2,
    mineDropRisk: 0.2,
    grinchDropRisk: 0.05,
    lifeDropRisk: 0.01,
    candyDropRisk: 0.1,
    santaIsVisible: false,
    playerStarted: false,
    grinchDampingFactor: 0.02,
    candies: 0,
    candiesRequired: 5,
    musicPlayer: null,
    playerBottomPosition: platform === "mobile" ? "20%" : "5%",
  };

  // Settings
  let settings = {
    music: true,
    sound: true,
    fullscreen: true,
  };

  // Cheats
  const cheats = {
    xmas: () => {
      state.candies += 10;
      displayMessage("Cheat code activated: xmas!");
      updateCandies();
    },
    sos: () => {
      state.lifes++;
      displayMessage("Cheat code activated: sos!");
      updateLifes();
    },
  };
  let availableCheats = { ...cheats };
  let activeCheatCode = [];

  /**
   * Load the game settings from localStorage.
   */
  const loadSettings = () => {
    const savedSettings = localStorage.getItem("gameSettings");
    if (savedSettings) {
      settings = JSON.parse(savedSettings);
      elements.settingsMusic.value = settings.music ? "on" : "off";
      elements.settingsSound.value = settings.sound ? "on" : "off";
      elements.settingsFullscreen.value = settings.fullscreen ? "on" : "off";

      if (settings.music) {
        elements.musicStatus.textContent = "music_note";
      } else {
        elements.musicStatus.textContent = "music_off";
      }

      if (settings.sound) {
        elements.soundStatus.textContent = "volume_up";
      } else {
        elements.soundStatus.textContent = "volume_off";
      }
    }
  };

  /**
   * Save the current settings to localStorage.
   */
  const saveSettings = () => {
    localStorage.setItem("gameSettings", JSON.stringify(settings));
    loadSettings();
  };

  /**
   * Update the displayed score, level, and lifes.
   */
  const updateScore = () => {
    const { score, giftsRequired, currentLevel } = state;
    elements.scoreValue.textContent = score;
    elements.scoreReqValue.textContent = giftsRequired;
    elements.levelValue.textContent = currentLevel;
    elements.finalScore.textContent = score;
  };

  /**
   * Update the displayed lifes.
   */
  const updateLifes = () => {
    const { lifes } = state;
    elements.lifesValue.textContent = lifes;
  };

  /**
   * Update the displayed candies.
   */
  const updateCandies = () => {
    const { candies } = state;
    elements.candiesValue.textContent = candies;
  };

  /**
   * Clear the gift container from all gifts.
   */
  const clearGiftContainer = () => {
    elements.giftContainer.innerHTML = "";
  };

  /**
   * Check for collision between two elements.
   * @param {DOMRect} element1Rect - The bounding rectangle of the first element.
   * @param {DOMRect} element2Rect - The bounding rectangle of the second element.
   * @returns {boolean} - True if a collision occurs, false otherwise.
   */
  const checkCollision = (element1Rect, element2Rect) => {
    const { isGameRunning } = state;
    if (!isGameRunning) return false;

    const element1Radius = element1Rect.width / 2;
    const element2Radius = element2Rect.width / 2;

    const element1X = element1Rect.left + element1Radius;
    const element1Y = element1Rect.top + element1Radius;

    const element2X = element2Rect.left + element2Radius;
    const element2Y = element2Rect.top + element2Radius;

    const distance = Math.sqrt(
      (element1X - element2X) ** 2 + (element1Y - element2Y) ** 2
    );

    let gap = 10;
    let maxDistance = element1Radius + element2Radius - gap;
    let result = distance < maxDistance;

    console.log("Collision:", result, "Distance:", distance);

    return result;
  };

  /**
   * Create a new gift, grinch, or life element and add it to the game container.
   */
  const createDrops = () => {
    const { isGameRunning, speedMultiplier } = state;
    if (isGameRunning) {
      const isMine = Math.random() < state.mineDropRisk;
      const islife = Math.random() < state.lifeDropRisk;
      const isCandy = Math.random() < state.candyDropRisk;
      const isGrinch =
        state.currentLevel > 2 && Math.random() < state.grinchDropRisk;

      const element = document.createElement("div");
      element.className = isMine
        ? "mine"
        : islife
        ? "life"
        : isCandy
        ? "candy"
        : isGrinch
        ? "grinch"
        : "gift";

      let randomX = Math.random() * (window.innerWidth - element.offsetWidth);
      element.style.left = randomX + "px";

      let mouseXDiff = 0;
      let mouseXDiffTarget = 0;

      if (islife) {
        // it's a life
        elements.giftContainer.appendChild(element);
      } else if (isMine) {
        // it's a mine
        elements.mineContainer.appendChild(element);
      } else if (isGrinch) {
        // it's a grinch
        elements.grinchContainer.appendChild(element);

        // desktop behavior
        document.addEventListener("mousemove", (e) => {
          if (state.isGameRunning && element.classList.contains("grinch")) {
            const mouseX = e.clientX;
            mouseXDiffTarget = mouseX - element.offsetWidth / 2;
            mouseXDiff +=
              (mouseXDiffTarget - mouseXDiff) * state.grinchDampingFactor;

            element.style.left = mouseXDiff + "px";
          }
        });

        // mobile behavior
        document.addEventListener("touchmove", (e) => {
          if (state.isGameRunning && element.classList.contains("grinch")) {
            const mouseX = e.touches[0].clientX;
            mouseXDiffTarget = mouseX - element.offsetWidth / 2;
            mouseXDiff +=
              (mouseXDiffTarget - mouseXDiff) * state.grinchDampingFactor;

            element.style.left = mouseXDiff + "px";
          }
        });
      } else if (isCandy) {
        // it's a candy
        elements.candyContainer.appendChild(element);
      } else {
        // it's a gift
        const randomHue = Math.random() * 360;
        element.style.filter = `hue-rotate(${randomHue}deg)`;
        elements.giftContainer.appendChild(element);
      }

      const duration = 4 - speedMultiplier;
      element.style.animation = `fall ${duration}s linear infinite`;

      element.addEventListener("animationiteration", () => {
        if (isMine) {
          elements.mineContainer.removeChild(element);
        } else if (isGrinch) {
          elements.grinchContainer.removeChild(element);
        } else if (isCandy) {
          elements.candyContainer.removeChild(element);
        } else {
          elements.giftContainer.removeChild(element);
        }
      });
    }
  };

  /**
   * Shoot a candy from the player.
   */
  const shootCandies = () => {
    const { isGameRunning, candies } = state;
    if (isGameRunning && candies > 0) {
      state.candies = Math.max(0, state.candies - 1);
      updateCandies();

      const bullet = document.createElement("div");
      bullet.className = "bullet";
      bullet.style.left = elements.player.style.left;
      bullet.style.bottom = state.playerBottomPosition;
      elements.gameContainer.appendChild(bullet);

      bullet.style.animation = `shoot 2s linear`;

      if (settings.sound) {
        sounds.shootSound.currentTime = 0;
        sounds.shootSound.play();
      }

      const checkCollisionsDuringAnimation = () => {
        const bulletRect = bullet.getBoundingClientRect();

        const mines = document.querySelectorAll(".mine");
        const grinchs = document.querySelectorAll(".grinch");
        const gifts = document.querySelectorAll(".gift");
        const lifes = document.querySelectorAll(".life");

        mines.forEach((mine) => {
          const mineRect = mine.getBoundingClientRect();
          if (checkCollision(mineRect, bulletRect)) {
            elements.mineContainer.removeChild(mine);
            elements.gameContainer.removeChild(bullet);

            if (settings.sound) {
              sounds.bombImpactSound.currentTime = 0;
              sounds.bombImpactSound.play();
            }
          }
        });

        grinchs.forEach((grinch) => {
          const grinchRect = grinch.getBoundingClientRect();
          if (checkCollision(grinchRect, bulletRect)) {
            elements.grinchContainer.removeChild(grinch);
            elements.gameContainer.removeChild(bullet);

            if (settings.sound) {
              sounds.bombImpactSound.currentTime = 0;
              sounds.bombImpactSound.play();
            }
          }
        });

        gifts.forEach((gift) => {
          const giftRect = gift.getBoundingClientRect();
          if (checkCollision(giftRect, bulletRect)) {
            collectGift(gift);
            elements.gameContainer.removeChild(bullet);
          }
        });

        lifes.forEach((life) => {
          const lifeRect = life.getBoundingClientRect();
          if (checkCollision(lifeRect, bulletRect)) {
            collectLife(life);
            elements.gameContainer.removeChild(bullet);
          }
        });

        if (bullet.getAnimations().length > 0) {
          requestAnimationFrame(checkCollisionsDuringAnimation);
        }
      };

      checkCollisionsDuringAnimation();

      bullet.addEventListener("animationend", () => {
        elements.gameContainer.removeChild(bullet);
      });
    }
  };

  /**
   * Reduce the player's remaining lifes and update the game state accordingly.
   */
  const reducelife = () => {
    const { isGameRunning, lifes } = state;
    if (isGameRunning) {
      state.lifes--;

      if (lifes === 0) {
        showGameOverMenu();
      }

      updateLifes();
    }
  };

  /**
   * Same as reducelife, but removes 30% of player's score as well.
   */
  const reducelifeAndScore = () => {
    const { isGameRunning, lifes } = state;
    if (isGameRunning) {
      state.lifes--;

      if (lifes === 0) {
        showGameOverMenu();
      }

      updateLifes();

      state.score = Math.floor(state.score * 0.7);
      updateScore();
    }
  };

  /**
   * Handle the collection of a gift by the player.
   * @param {HTMLElement} gift - The collected gift element.
   */
  const collectGift = (gift) => {
    const { isGameRunning, score, giftsRequired } = state;
    if (isGameRunning) {
      elements.player.style.outlineColor = getPrimaryColor(gift);
      state.score++;
      updateScore();

      if (score >= giftsRequired) {
        nextLevel();
      }

      elements.giftContainer.removeChild(gift);
      elements.player.classList.add("is-collecting");

      if (settings.sound) {
        sounds.giftCollectSound.currentTime = 0;
        sounds.giftCollectSound.play();
      }

      setTimeout(() => {
        elements.player.classList.remove("is-collecting");
      }, 100);

      state.comboCount++;
      if (state.comboCount === 3) {
        displayCombo(3);
        state.comboMultiplier = 3;
      } else if (state.comboCount === 5) {
        displayCombo(5);
        state.comboMultiplier = 5;
      } else if (state.comboCount > 5) {
        state.comboCount = 0;
        state.comboMultiplier = 1;
      }

      state.score += state.comboMultiplier;
    }
  };

  /**
   * Handle the collection of a life by the player.
   * @param {HTMLElement} life - The collected life element.
   */
  const collectLife = (life) => {
    const { isGameRunning, lifes } = state;
    if (isGameRunning) {
      state.lifes++;
      updateLifes();

      elements.giftContainer.removeChild(life);
      elements.player.classList.add("is-collecting");

      displayMessage("Extra life!");

      if (settings.sound) {
        sounds.giftCollectSound.currentTime = 0;
        sounds.giftCollectSound.play();
      }

      setTimeout(() => {
        elements.player.classList.remove("is-collecting");
      }, 100);
    }
  };

  /**
   * Handle the collection of a candy by the player.
   * @param {HTMLElement} candy - The collected candy element.
   */
  const collectCandy = (candy) => {
    const { isGameRunning, candies } = state;
    if (isGameRunning) {
      state.candies++;
      updateCandies();

      elements.candyContainer.removeChild(candy);
      elements.player.classList.add("is-collecting");

      if (settings.sound) {
        sounds.giftCollectSound.currentTime = 0;
        sounds.giftCollectSound.play();
      }

      setTimeout(() => {
        elements.player.classList.remove("is-collecting");
      }, 100);
    }
  };

  /**
   * Display the combo message with the given multiplier.
   * @param {number} multiplier - The combo multiplier.
   */
  const displayCombo = (multiplier) => {
    displayMessage(`Combo x${multiplier}`);
  };

  /**
   * Display a game message with the given text.
   * @param {string} message - The text to display.
   */
  const displayMessage = (message) => {
    const span = document.createElement("span");
    span.textContent = message;
    elements.gameMessages.appendChild(span);
    setTimeout(() => {
      elements.gameMessages.removeChild(span);
    }, 1000);
  };

  /**
   * Get the primary color of a gift element.
   * @param {HTMLElement} gift - The gift element.
   * @returns {string} - The primary color of the gift.
   */
  const getPrimaryColor = (gift) => {
    const style = window.getComputedStyle(gift);
    const filter = style.getPropertyValue("filter");

    const match = filter.match(/hue-rotate\((\d+(\.\d+)?)deg\)/);

    if (match && match[1]) {
      const hue = match[1];
      return `hsl(${hue}, 100%, 15%)`;
    } else {
      return "#ff636370";
    }
  };

  /**
   * Advance to the next game level, increasing the speed, the gifts required, and the player's lifes.
   */
  const nextLevel = () => {
    state.lifes++;
    updateLifes();

    state.currentLevel++;
    state.giftsRequired = Math.floor(
      state.giftsRequired * state.levelReqMultiplier
    );
    state.speedMultiplier = state.speedMultiplier + 0.2;
    if (state.mineDropRisk < 0.2) {
      state.mineDropRisk = state.mineDropRisk + 0.05;
    }
    if (state.grinchDropRisk < 0.3) {
      state.grinchDropRisk = state.grinchDropRisk + 0.05;
    }
    updateLevel();

    if (state.currentLevel < 7) return;

    const random = Math.random();
    if (random < 0.5) {
      toggleDayNightCycle();
    }
  };

  /**
   * Toggle the day-night cycle by switching the .day and .night classes on the game container.
   */
  const toggleDayNightCycle = () => {
    const { gameContainer } = elements;

    gameContainer.classList.toggle("day");
    gameContainer.classList.toggle("night");

    console.log("Day-night cycle toggled!");
  };

  /**
   * Update the displayed level and gifts required for the current level.
   */
  const updateLevel = () => {
    const { currentLevel, giftsRequired } = state;
    elements.levelValue.textContent = currentLevel;
    elements.scoreReqValue.textContent = giftsRequired;
    showLevelUpMessage();
  };

  /**
   * Display the level up message.
   */
  const showLevelUpMessage = () => {
    displayMessage(`Level ${state.currentLevel}`);
  };

  /**
   * Display the game instructions page.
   */
  const showInstructions = () => {
    elements.menu.classList.add("hidden");
    elements.instructions.classList.remove("hidden");
  };

  /**
   * Display the game settings page.
   */
  const showSettings = () => {
    elements.menu.classList.add("hidden");
    elements.settings.classList.remove("hidden");
  };

  /**
   * Display the game over menu. Stop the game and display the final score.
   */
  const showGameOverMenu = () => {
    elements.gameoverMenu.classList.remove("hidden");
    elements.finalScore.textContent = state.score;
    stopGame();
  };

  /**
   * Quit the game and return to the main menu. Reset the game state.
   */
  const quitGame = () => {
    stopGame();
    showMenu();
    resetGame();
    state.isGameRunning = false;
  };

  /** Share the game on Twitter. */
  const shareGame = () => {
    const url = "https://twitter.com/intent/tweet";
    const text = "I just scored " + state.score + " points on XMasGifts!";
    const hashtags = "XMasGifts";
    const params = `?text=${encodeURIComponent(
      text
    )}&hashtags=${encodeURIComponent(hashtags)}&url=xmas.mirko.pm`;
    const fullUrl = url + params;
    window.open(fullUrl, "_blank");
  };

  /**
   * Show the main menu page.
   */
  const showMenu = () => {
    elements.menu.classList.remove("hidden");
    elements.instructions.classList.add("hidden");
    elements.gameoverMenu.classList.add("hidden");
    elements.settings.classList.add("hidden");
    elements.pauseMenu.classList.add("hidden");
    elements.creditsMenu.classList.add("hidden");
  };

  /**
   * Pause the game. Stop the game intervals and display the pause menu.
   */
  const showPause = () => {
    elements.menu.classList.add("hidden");
    elements.instructions.classList.add("hidden");
    elements.gameoverMenu.classList.add("hidden");
    elements.settings.classList.add("hidden");
    elements.pauseMenu.classList.remove("hidden");
    elements.creditsMenu.classList.add("hidden");
  };

  /**
   * Hide the main menu page.
   */
  const hideMenu = () => {
    elements.menu.classList.add("hidden");
    elements.instructions.classList.add("hidden");
    elements.gameoverMenu.classList.add("hidden");
    elements.settings.classList.add("hidden");
    elements.pauseMenu.classList.add("hidden");
    elements.creditsMenu.classList.add("hidden");
  };

  /**
   * Show the credits page.
   */
  const showCredits = () => {
    elements.menu.classList.add("hidden");
    elements.instructions.classList.add("hidden");
    elements.gameoverMenu.classList.add("hidden");
    elements.settings.classList.add("hidden");
    elements.pauseMenu.classList.add("hidden");
    elements.creditsMenu.classList.remove("hidden");
  };

  /**
   * Start the game. Hide the main menu, reset the game state, and enter fullscreen.
   */
  const startGame = () => {
    hideMenu();
    resetGame();
    if (!state.playerStarted && settings.music) startMusicPlayer();

    elements.gameContainer.style.cursor = "none";
    state.isGameRunning = true;

    enterFullscreen();

    state.giftInterval = setInterval(createDrops, 1200);
    state.gameInterval = setInterval(checkGameStatus, 100);
  };

  /**
   * Resume the game. Restart the game intervals.
   */
  const resumeGame = () => {
    state.isGameRunning = true;
    state.giftInterval = setInterval(createDrops, 1200);
    state.gameInterval = setInterval(checkGameStatus, 100);
    elements.gameContainer.style.cursor = "none";
    hideMenu();
    enterFullscreen();

    if (!state.playerStarted && settings.music) startMusicPlayer();
  };

  /**
   * Stop the game. Clear all intervals and reset the game state.
   */
  const stopGame = () => {
    stopMusicPlayer();
    clearInterval(state.gameInterval);
    clearInterval(state.giftInterval);

    state.isGameRunning = false;
    elements.gameContainer.style.cursor = "default";
  };

  /**
   * Reset the game state.
   */
  const resetGame = () => {
    state.score = 0;
    state.currentLevel = 1;
    state.giftsRequired = 10;
    state.lifes = 3;
    state.candies = 0;
    state.mineDropRisk = 0.2;
    state.grinchDropRisk = 0.05;
    state.lifeDropRisk = 0.01;
    state.speedMultiplier = 0.2;
    state.comboCount = 0;
    state.comboMultiplier = 1;

    updateScore();
    updateLifes();
    updateCandies();
    clearGiftContainer();

    availableCheats = { ...cheats };
    activeCheatCode = [];

    elements.player.style.bottom = state.playerBottomPosition;
    elements.player.style.left = "50%";
  };

  /**
   * Enter fullscreen mode.
   */
  const enterFullscreen = () => {
    if (settings.fullscreen) {
      if (elements.body.requestFullscreen) {
        elements.body.requestFullscreen();
      } else if (elements.body.mozRequestFullScreen) {
        /* Firefox */
        elements.body.mozRequestFullScreen();
      } else if (elements.body.webkitRequestFullscreen) {
        /* Chrome, Safari and Opera */
        elements.body.webkitRequestFullscreen();
      } else if (elements.body.msRequestFullscreen) {
        /* IE/Edge */
        elements.body.msRequestFullscreen();
      }
    }
  };

  /**
   * Check the game status. Check for collisions and check for game over.
   */
  const checkGameStatus = () => {
    if (!state.isGameRunning) return;

    const gifts = document.querySelectorAll(".gift");
    const lifes = document.querySelectorAll(".life");
    const candies = document.querySelectorAll(".candy");
    const mines = document.querySelectorAll(".mine");
    const grinchs = document.querySelectorAll(".grinch");
    const playerRect = elements.player.getBoundingClientRect();
    const basePoint = playerRect.bottom - playerRect.height - 20;

    lifes.forEach((life) => {
      const lifeRect = life.getBoundingClientRect();

      if (lifeRect.bottom > basePoint) {
        if (checkCollision(lifeRect, playerRect)) {
          collectLife(life);
        }
      }
    });

    mines.forEach((mine) => {
      const mineRect = mine.getBoundingClientRect();

      if (mineRect.bottom > basePoint) {
        if (checkCollision(mineRect, playerRect)) {
          reducelife();
          if (settings.sound) {
            sounds.bombImpactSound.currentTime = 0;
            sounds.bombImpactSound.play();
          }
        }
      }
    });

    grinchs.forEach((grinch) => {
      const grinchRect = grinch.getBoundingClientRect();

      if (grinchRect.bottom > basePoint) {
        if (checkCollision(grinchRect, playerRect)) {
          reducelifeAndScore();
          if (settings.sound) {
            sounds.bombImpactSound.currentTime = 0;
            sounds.bombImpactSound.play();
          }
        }
      }
    });

    gifts.forEach((gift) => {
      const giftRect = gift.getBoundingClientRect();

      if (giftRect.bottom >= window.innerHeight) {
        reducelife();
      } else {
        if (giftRect.bottom > basePoint) {
          if (checkCollision(giftRect, playerRect)) {
            collectGift(gift);
          }
        }
      }
    });

    candies.forEach((candy) => {
      const candyRect = candy.getBoundingClientRect();

      if (candyRect.bottom >= window.innerHeight) {
        state.candies = Math.max(0, state.candies - 1);
      } else {
        if (candyRect.bottom > basePoint) {
          if (checkCollision(candyRect, playerRect)) {
            collectCandy(candy);
          }
        }
      }
    });
  };

  /**
   * Start the music player.
   */
  const startMusicPlayer = () => {
    state.playerStarted = true;

    let currentTrack = 0;
    const audio = new Audio(tracks[currentTrack]);
    audio.loop = false;
    audio.play();

    audio.addEventListener("ended", () => {
      currentTrack++;
      if (currentTrack >= tracks.length) {
        currentTrack = 0;
      }
      audio.src = tracks[currentTrack];
      audio.play();
    });

    state.musicPlayer = audio;
  };

  /**
   * Stop the music player.
   */
  const stopMusicPlayer = () => {
    state.playerStarted = false;

    if (state.musicPlayer) {
      state.musicPlayer.pause();
    }
  };

  /**
   * Start the roofs animation.
   */
  const startRoofsAnimation = () => {
    let x = 0;
    setInterval(() => {
      x--;
      elements.roofs.style.backgroundPositionX = x + "px";
    }, 100);
  };

  /**
   * Start the santa animation.
   */
  const startSantaAnimation = () => {
    setInterval(() => {
      if (!state.santaIsVisible) {
        const santa = document.createElement("img");
        santa.src = "/assets/images/santas.svg";
        santa.className = "santas";
        elements.gameContainer.appendChild(santa);

        santa.style.animation = `santas 5s linear`;

        santa.addEventListener("animationend", () => {
          elements.gameContainer.removeChild(santa);
          state.santaIsVisible = false;
        });

        state.santaIsVisible = true;
      }
    }, 30000);
  };

  // Event listeners
  elements.playButton.addEventListener("click", startGame);
  elements.resumeButton.addEventListener("click", resumeGame);
  elements.instructionsButton.addEventListener("click", showInstructions);
  elements.settingsButton.addEventListener("click", showSettings);
  elements.creditsButton.addEventListener("click", showCredits);
  elements.backButtons.forEach((button) => {
    button.addEventListener("click", showMenu);
  });
  elements.playAgainButton.addEventListener("click", startGame, true);
  elements.shareButton.addEventListener("click", shareGame);
  elements.pauseStatus.addEventListener("click", () => {
    stopGame();
    showPause();
  });
  elements.musicStatus.addEventListener("click", () => {
    settings.music = !settings.music;
    saveSettings();
    if (!settings.music) {
      stopMusicPlayer();
    } else {
      startMusicPlayer();
    }
  });
  elements.soundStatus.addEventListener("click", () => {
    settings.sound = !settings.sound;
    saveSettings();
  });

  // Settings listeners
  elements.settingsMusic.addEventListener("change", (e) => {
    settings.music = e.target.value === "on";
    saveSettings();
    if (!settings.music) {
      stopMusicPlayer();
    }
  });
  elements.settingsSound.addEventListener("change", (e) => {
    settings.sound = e.target.value === "on";
    saveSettings();
  });
  elements.settingsFullscreen.addEventListener("change", (e) => {
    settings.fullscreen = e.target.value === "on";
    saveSettings();
  });

  // Desktop controls
  if (platform === "desktop") {
    document.addEventListener("mousemove", (e) => {
      if (state.isGameRunning) {
        const mouseX = e.clientX;
        elements.player.style.left = mouseX + "px";
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space" && state.isGameRunning) {
        shootCandies();
      }

      if (e.code === "KeyP" && state.isGameRunning) {
        stopGame();
        showPause();
      }
    });
  }

  // Mobile controls
  if (platform === "mobile") {
    document.addEventListener("touchmove", (e) => {
      if (state.isGameRunning) {
        let touches = e.touches[0];
        console.log(touches.target);
        if (touches.target === elements.shootButton) {
          console.log("cannot move");
          return;
        }

        const mouseX = touches.clientX;
        elements.player.style.left = mouseX + "px";
      }
    });
    elements.shootButton.addEventListener("touchstart", shootCandies);
  }

  // Desktop cheat codes
  if (platform === "desktop") {
    document.addEventListener("keydown", (e) => {
      activeCheatCode.push(e.key.toLowerCase());
      console.log("available cheats:", availableCheats);

      for (const code in availableCheats) {
        if (activeCheatCode.join("") === code) {
          availableCheats[code]();
          activeCheatCode = [];
          delete availableCheats[code];
        }
      }

      setTimeout(() => {
        activeCheatCode = [];
      }, 1000);
    });
  }

  // Initial setup
  loadSettings();
  showMenu();
  startRoofsAnimation();
  startSantaAnimation();
});
