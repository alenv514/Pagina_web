const quizData = {
  easy: [
    {
      question: "Si 1 USD = 17 MXN, ¿cuánto son 3 USD?",
      options: ["34 MXN", "51 MXN", "37 MXN", "68 MXN"],
      answer: "51 MXN"
    },
    {
      question: "¿Cuántos centímetros hay en 2 metros?",
      options: ["20", "200", "2000", "120"],
      answer: "200"
    },
    {
      question: "¿Cuántos minutos tiene 1 hora?",
      options: ["30", "60", "90", "100"],
      answer: "60"
    },
    {
      question: "En Dragon Ball, ¿de qué color es el traje clásico de Goku (adulto)?",
      options: ["Azul y naranja", "Rojo y negro", "Verde y blanco", "Morado y gris"],
      answer: "Azul y naranja"
    },
    {
      question: "¿Cuántos segundos tiene 1 minuto?",
      options: ["10", "30", "60", "120"],
      answer: "60"
    }
  ],
  medium: [
    {
      question: "Si 1 kg = 1000 g, ¿cuántos gramos son 3 kg?",
      options: ["300 g", "3000 g", "30 g", "1300 g"],
      answer: "3000 g"
    },
    {
      question: "Si 1 km = 1000 m, ¿cuántos km son 1500 m?",
      options: ["1.5", "15", "0.15", "2.5"],
      answer: "1.5"
    },
    {
      question: "Si 1 litro = 1000 ml, ¿cuántos ml son 2.5 litros?",
      options: ["250 ml", "2500 ml", "2050 ml", "1500 ml"],
      answer: "2500 ml"
    },
    {
      question: "En Dragon Ball Z, ¿quién es el rival principal de Goku al inicio de la saga Saiyan?",
      options: ["Freezer", "Cell", "Vegeta", "Buu"],
      answer: "Vegeta"
    },
    {
      question: "Si 1 USD = 17 MXN, ¿cuántos MXN son 10 USD?",
      options: ["170 MXN", "117 MXN", "107 MXN", "270 MXN"],
      answer: "170 MXN"
    }
  ],
  hard: [
    {
      question: "Si 1 pulgada = 2.54 cm, ¿cuántos cm son 10 pulgadas?",
      options: ["20.54 cm", "24.5 cm", "25.4 cm", "2.54 cm"],
      answer: "25.4 cm"
    },
    {
      question: "Si 1 milla = 1.609 km, ¿aprox. cuántos km son 5 millas?",
      options: ["8.045 km", "6.045 km", "7.5 km", "9.609 km"],
      answer: "8.045 km"
    },
    {
      question: "Si 1 GB = 1024 MB, ¿cuántos MB son 2 GB?",
      options: ["2000 MB", "1024 MB", "2048 MB", "4096 MB"],
      answer: "2048 MB"
    },
    {
      question: "En Dragon Ball, ¿cómo se llama la técnica de Goku de esfera de energía azul?",
      options: ["Final Flash", "Kamehameha", "Makankosappo", "Galick Gun"],
      answer: "Kamehameha"
    },
    {
      question: "Si 1 hora tiene 3600 segundos, ¿cuántos segundos son 2.5 horas?",
      options: ["7200", "7500", "9000", "9500"],
      answer: "9000"
    }
  ]
};

const timeByDifficulty = {
  easy: 25,
  medium: 20,
  hard: 16
};

const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const finalScreen = document.getElementById("final-screen");
const resultBackgroundEl = document.getElementById("result-bg-animation");

const difficultyButtons = document.querySelectorAll(".difficulty-btn");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const nextBtn = document.getElementById("next-btn");

const levelBadge = document.getElementById("level-badge");
const timerEl = document.getElementById("timer");
const questionCounterEl = document.getElementById("question-counter");
const scoreCounterEl = document.getElementById("score-counter");
const questionTextEl = document.getElementById("question-text");
const answersEl = document.getElementById("answers");
const feedbackEl = document.getElementById("feedback");
const wrongAnimationEl = document.getElementById("wrong-animation");
const wrongAnimationMediaEl = document.getElementById("wrong-animation-media");
const wrongAnimationIconEl = document.querySelector(".wrong-animation__icon");
const correctAnimationEl = document.getElementById("correct-animation");
const correctAnimationMediaEl = document.getElementById("correct-animation-media");
const correctAnimationIconEl = document.querySelector("#correct-animation .wrong-animation__icon");

const wrongAnimationSources = [
  "assets/images/error-animation.mp4",
  "assets/images/error1-animation.mp4"
];

const correctAnimationSources = [
  "assets/images/afirmativo-animation.mp4",
  "assets/images/afirmativo1-animation.mp4",
  "assets/images/afirmativo2-animation.mp4"
];

const resultAnimationSources = {
  win: "assets/images/win-animation.mp4",
  loss: "assets/images/perdida-animation.mp4"
};

const finalScoreEl = document.getElementById("final-score");
const finalMessageEl = document.getElementById("final-message");

const timerAudio = new Audio("assets/sounds/timer.mp3");

let selectedDifficulty = "easy";
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let timer = null;
let timeLeft = 0;
let wrongAnimationTimeout = null;
let wrongAnimationEndHandler = null;
let correctAnimationTimeout = null;
let correctAnimationEndHandler = null;

let confettiPieces = [];
let confettiAnimation = null;

setDifficultyUI("easy");

difficultyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setDifficultyUI(button.dataset.difficulty);
  });
});

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", goToStart);
nextBtn.addEventListener("click", goNextQuestion);

function setDifficultyUI(difficulty) {
  selectedDifficulty = difficulty;
  difficultyButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.difficulty === difficulty);
  });
}

function startGame() {
  score = 0;
  currentQuestionIndex = 0;
  questions = shuffle([...quizData[selectedDifficulty]]);
  hideResultBackground();
  document.body.classList.remove("final-screen-active");

  startScreen.classList.add("hidden");
  finalScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  levelBadge.textContent = `Nivel: ${labelDifficulty(selectedDifficulty)}`;
  scoreCounterEl.textContent = `Puntaje: ${score}`;

  showQuestion();
}

function showQuestion() {
  clearInterval(timer);
  hideWrongAnimation();
  hideCorrectAnimation();
  feedbackEl.textContent = "";
  feedbackEl.className = "feedback";
  nextBtn.classList.add("hidden");

  const question = questions[currentQuestionIndex];
  questionCounterEl.textContent = `Pregunta ${currentQuestionIndex + 1}/${questions.length}`;
  questionTextEl.textContent = question.question;

  answersEl.innerHTML = "";
  question.options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "answer-btn";
    button.textContent = option;
    button.addEventListener("click", () => checkAnswer(option, button));
    answersEl.appendChild(button);
  });

  startTimer();
}

function startTimer() {
  timeLeft = timeByDifficulty[selectedDifficulty];
  renderTimer();

  timer = setInterval(() => {
    timeLeft -= 1;

    if (timeLeft <= 5 && timeLeft > 0) {
      timerEl.classList.add("warning");
      safePlay(timerAudio);
    }

    if (timeLeft <= 0) {
      clearInterval(timer);
      lockAnswers();
      markCorrectAnswer();
      feedbackEl.textContent = "⏰";
      feedbackEl.className = "feedback bad";
      playWrongAnimationSequence();
      timeLeft = 0;
    }

    renderTimer();
  }, 1000);
}

function renderTimer() {
  timerEl.textContent = `⏱ ${String(timeLeft).padStart(2, "0")}`;
  if (timeLeft > 5) {
    timerEl.classList.remove("warning");
  }
}

function checkAnswer(option, selectedButton) {
  clearInterval(timer);
  lockAnswers();

  const question = questions[currentQuestionIndex];
  const isCorrect = option === question.answer;

  if (isCorrect) {
    score += 10;
    scoreCounterEl.textContent = `Puntaje: ${score}`;
    selectedButton.classList.add("correct");
    feedbackEl.textContent = "✅";
    feedbackEl.className = "feedback ok";
    hideWrongAnimation();
    playCorrectAnimationSequence();
  } else {
    selectedButton.classList.add("wrong");
    markCorrectAnswer();
    feedbackEl.textContent = "❌";
    feedbackEl.className = "feedback bad";
    hideCorrectAnimation();
    playWrongAnimationSequence();
  }
}

function markCorrectAnswer() {
  const correctAnswer = questions[currentQuestionIndex].answer;
  const buttons = answersEl.querySelectorAll("button");
  buttons.forEach((button) => {
    if (button.textContent === correctAnswer) {
      button.classList.add("correct");
    }
  });
}

function lockAnswers() {
  const buttons = answersEl.querySelectorAll("button");
  buttons.forEach((button) => {
    button.disabled = true;
  });
}

function goNextQuestion() {
  currentQuestionIndex += 1;
  if (currentQuestionIndex >= questions.length) {
    finishGame();
    return;
  }
  showQuestion();
}

function finishGame() {
  clearInterval(timer);
  hideWrongAnimation();
  hideCorrectAnimation();
  gameScreen.classList.add("hidden");
  finalScreen.classList.remove("hidden");
  document.body.classList.add("final-screen-active");

  const maxScore = questions.length * 10;
  const percent = Math.round((score / maxScore) * 100);

  finalScoreEl.textContent = `Tu puntaje: ${score} / ${maxScore} (${percent}%)`;

  if (percent >= 80) {
    finalMessageEl.textContent = "Excelente partida. ¡Nivel pro!";
    startConfetti();
  } else if (percent >= 50) {
    finalMessageEl.textContent = "Buen trabajo. Puedes superar tu marca.";
    stopConfetti();
  } else {
    finalMessageEl.textContent = "Sigue practicando, vas por buen camino.";
    stopConfetti();
  }

  if (percent > 50) {
    showResultBackground("win");
  } else if (percent < 50) {
    showResultBackground("loss");
  } else {
    hideResultBackground();
  }
}

function goToStart() {
  stopConfetti();
  hideResultBackground();
  clearInterval(timer);
  hideWrongAnimation();
  hideCorrectAnimation();
  document.body.classList.remove("final-screen-active");

  gameScreen.classList.add("hidden");
  finalScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");

  feedbackEl.textContent = "";
  feedbackEl.className = "feedback";
}

function showWrongAnimation() {
  if (!wrongAnimationEl) return;
  document.body.classList.add("wrong-active");
  clearTimeout(wrongAnimationTimeout);
  wrongAnimationEl.classList.remove("active");
  void wrongAnimationEl.offsetWidth;
  wrongAnimationEl.classList.add("active");
}

function hideWrongAnimation() {
  if (!wrongAnimationEl) return;
  document.body.classList.remove("wrong-active");
  clearTimeout(wrongAnimationTimeout);
  wrongAnimationEl.classList.remove("active");

  if (wrongAnimationMediaEl && wrongAnimationEndHandler) {
    wrongAnimationMediaEl.removeEventListener("ended", wrongAnimationEndHandler);
    wrongAnimationEndHandler = null;
  }

  if (wrongAnimationMediaEl && !wrongAnimationMediaEl.classList.contains("hidden")) {
    wrongAnimationMediaEl.pause();
  }
}

function showCorrectAnimation() {
  if (!correctAnimationEl) return;
  document.body.classList.add("correct-active");
  clearTimeout(correctAnimationTimeout);
  correctAnimationEl.classList.remove("active");
  void correctAnimationEl.offsetWidth;
  correctAnimationEl.classList.add("active");
}

function hideCorrectAnimation() {
  if (!correctAnimationEl) return;
  document.body.classList.remove("correct-active");
  clearTimeout(correctAnimationTimeout);
  correctAnimationEl.classList.remove("active");

  if (correctAnimationMediaEl && correctAnimationEndHandler) {
    correctAnimationMediaEl.removeEventListener("ended", correctAnimationEndHandler);
    correctAnimationEndHandler = null;
  }

  if (correctAnimationMediaEl && !correctAnimationMediaEl.classList.contains("hidden")) {
    correctAnimationMediaEl.pause();
  }
}

function playWrongAnimationSequence() {
  showWrongAnimation();

  if (!wrongAnimationMediaEl || !wrongAnimationIconEl) {
    wrongAnimationTimeout = setTimeout(() => {
      hideWrongAnimation();
      nextBtn.classList.remove("hidden");
    }, 1400);
    return;
  }

  clearTimeout(wrongAnimationTimeout);
  wrongAnimationMediaEl.pause();
  wrongAnimationMediaEl.classList.add("hidden");
  wrongAnimationIconEl.classList.remove("hidden");
  wrongAnimationMediaEl.src = pickRandom(wrongAnimationSources);
  wrongAnimationMediaEl.load();
  wrongAnimationMediaEl.muted = false;

  if (wrongAnimationEndHandler) {
    wrongAnimationMediaEl.removeEventListener("ended", wrongAnimationEndHandler);
  }

  wrongAnimationEndHandler = () => {
    hideWrongAnimation();
    nextBtn.classList.remove("hidden");
  };

  wrongAnimationMediaEl.addEventListener("ended", wrongAnimationEndHandler, { once: true });

  wrongAnimationMediaEl.addEventListener("loadeddata", () => {
    wrongAnimationMediaEl.classList.remove("hidden");
    wrongAnimationIconEl.classList.add("hidden");
    wrongAnimationMediaEl.currentTime = 0;

    wrongAnimationMediaEl.play().catch(() => {
      wrongAnimationTimeout = setTimeout(() => {
        hideWrongAnimation();
        nextBtn.classList.remove("hidden");
      }, 1600);
    });
  }, { once: true });

  wrongAnimationMediaEl.addEventListener("error", () => {
    wrongAnimationMediaEl.classList.add("hidden");
    wrongAnimationIconEl.classList.remove("hidden");
    wrongAnimationTimeout = setTimeout(() => {
      hideWrongAnimation();
      nextBtn.classList.remove("hidden");
    }, 1400);
  }, { once: true });
}

function playCorrectAnimationSequence() {
  showCorrectAnimation();

  if (!correctAnimationMediaEl || !correctAnimationIconEl) {
    correctAnimationTimeout = setTimeout(() => {
      hideCorrectAnimation();
      nextBtn.classList.remove("hidden");
    }, 1400);
    return;
  }

  clearTimeout(correctAnimationTimeout);
  correctAnimationMediaEl.pause();
  correctAnimationMediaEl.classList.add("hidden");
  correctAnimationIconEl.classList.remove("hidden");
  correctAnimationMediaEl.src = pickRandom(correctAnimationSources);
  correctAnimationMediaEl.load();
  correctAnimationMediaEl.muted = false;

  if (correctAnimationEndHandler) {
    correctAnimationMediaEl.removeEventListener("ended", correctAnimationEndHandler);
  }

  correctAnimationEndHandler = () => {
    hideCorrectAnimation();
    nextBtn.classList.remove("hidden");
  };

  correctAnimationMediaEl.addEventListener("ended", correctAnimationEndHandler, { once: true });

  correctAnimationMediaEl.addEventListener("loadeddata", () => {
    correctAnimationMediaEl.classList.remove("hidden");
    correctAnimationIconEl.classList.add("hidden");
    correctAnimationMediaEl.currentTime = 0;

    correctAnimationMediaEl.play().catch(() => {
      correctAnimationTimeout = setTimeout(() => {
        hideCorrectAnimation();
        nextBtn.classList.remove("hidden");
      }, 1600);
    });
  }, { once: true });

  correctAnimationMediaEl.addEventListener("error", () => {
    correctAnimationMediaEl.classList.add("hidden");
    correctAnimationIconEl.classList.remove("hidden");
    correctAnimationTimeout = setTimeout(() => {
      hideCorrectAnimation();
      nextBtn.classList.remove("hidden");
    }, 1400);
  }, { once: true });
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function showResultBackground(type) {
  if (!resultBackgroundEl) return;
  const source = resultAnimationSources[type];
  if (!source) return;

  resultBackgroundEl.classList.remove("hidden");
  resultBackgroundEl.src = source;
  resultBackgroundEl.muted = false;
  resultBackgroundEl.volume = 1;
  resultBackgroundEl.currentTime = 0;
  resultBackgroundEl.play().catch(() => {});
}

function hideResultBackground() {
  if (!resultBackgroundEl) return;
  resultBackgroundEl.pause();
  resultBackgroundEl.classList.add("hidden");
}

function labelDifficulty(difficulty) {
  if (difficulty === "easy") return "Fácil";
  if (difficulty === "medium") return "Media";
  return "Difícil";
}

function safePlay(audio) {
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function startConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  const context = canvas.getContext("2d");

  resizeCanvas(canvas);
  confettiPieces = createConfettiPieces(canvas.width, canvas.height, 170);

  if (confettiAnimation) {
    cancelAnimationFrame(confettiAnimation);
  }

  function animate() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    confettiPieces.forEach((piece) => {
      piece.y += piece.speedY;
      piece.x += Math.sin(piece.tilt) * 0.8;
      piece.tilt += 0.08;
      piece.rotation += piece.rotationSpeed;

      if (piece.y > canvas.height + 20) {
        piece.y = -20;
        piece.x = Math.random() * canvas.width;
      }

      context.save();
      context.translate(piece.x, piece.y);
      context.rotate(piece.rotation);
      context.fillStyle = piece.color;
      context.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
      context.restore();
    });

    confettiAnimation = requestAnimationFrame(animate);
  }

  window.addEventListener("resize", () => resizeCanvas(canvas), { once: true });
  animate();
}

function stopConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  const context = canvas.getContext("2d");
  if (confettiAnimation) {
    cancelAnimationFrame(confettiAnimation);
    confettiAnimation = null;
  }
  context.clearRect(0, 0, canvas.width, canvas.height);
}

function resizeCanvas(canvas) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function createConfettiPieces(width, height, amount) {
  const colors = ["#ef4444", "#22c55e", "#3b82f6", "#eab308", "#f97316", "#a855f7"];
  return Array.from({ length: amount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 8 + 4,
    speedY: Math.random() * 2 + 1.5,
    tilt: Math.random() * Math.PI * 2,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: Math.random() * 0.04 - 0.02,
    color: colors[Math.floor(Math.random() * colors.length)]
  }));
}
