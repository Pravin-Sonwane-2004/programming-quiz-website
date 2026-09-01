/* ==========================================================================
   Programming Quiz Website - shared client logic
   Handles: dark mode, mobile navigation, question loading, quiz flow,
   scoring, review of wrong answers and performance tracking.
   ========================================================================== */

/* Global state */
let questions = {};
let currentLanguage = "";
let currentQuestionIndex = 0;
let score = 0;
let totalQuestions = 30;
let questionsShuffled = [];
let selectedAnswers = [];
let incorrectAnswers = [];
let isOptionSelected = false;
let isCountdownActive = false;

const USER_DEFINED_TIME = 2; // seconds to count down before each question
const QUIZ_RESULTS_KEY = "quizResults";

/* -------------------------------------------------------------------------- */
/* Dark mode + mobile menu (safe on every page that includes this script)     */
/* -------------------------------------------------------------------------- */

function initDarkMode() {
  const toggle = document.getElementById("dark-mode-toggle");
  const saved = localStorage.getItem("darkMode");
  const isDark = saved === null ? true : saved === "true";

  document.body.classList.toggle("dark-mode", isDark);
  document.body.classList.toggle("light-mode", !isDark);

  if (toggle) {
    toggle.textContent = isDark ? "Switch to Light Mode" : "Switch to Dark Mode";
    toggle.addEventListener("click", () => {
      const nowDark = document.body.classList.toggle("dark-mode");
      document.body.classList.toggle("light-mode", !nowDark);
      localStorage.setItem("darkMode", nowDark ? "true" : "false");
      toggle.textContent = nowDark ? "Switch to Light Mode" : "Switch to Dark Mode";
    });
  }
}

function initMenuToggle() {
  const toggle = document.getElementById("menu-toggle");
  const navLinks = document.querySelector(".nav-links");
  if (!toggle || !navLinks) return;

  toggle.addEventListener("click", () => navLinks.classList.toggle("active"));
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => navLinks.classList.remove("active"));
  });
}

/* -------------------------------------------------------------------------- */
/* Question data                                                              */
/* -------------------------------------------------------------------------- */

async function loadQuestions() {
  try {
    const response = await fetch("/questions.json");
    if (!response.ok) throw new Error("Failed to load questions");
    questions = await response.json();
    if (questions && Object.keys(questions).length) {
      console.log("Questions loaded.");
    } else {
      console.warn("No questions available.");
    }
  } catch (err) {
    console.error("Error loading questions:", err);
  }
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function shuffleArray(array) {
  const copy = Array.isArray(array) ? array.slice() : [];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function updateProgressBar(current, total) {
  const bar = document.getElementById("progressBar");
  if (!bar) return;
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;
  bar.style.width = `${percent}%`;
}

function saveQuizResult(language, scored, total) {
  try {
    const saved = JSON.parse(localStorage.getItem(QUIZ_RESULTS_KEY) || "[]");
    saved.push({
      language,
      score: scored,
      total,
      percentage: total > 0 ? Math.round((scored / total) * 100) : 0,
      date: new Date().toISOString(),
    });
    localStorage.setItem(QUIZ_RESULTS_KEY, JSON.stringify(saved.slice(-20)));
  } catch (_err) {
    /* ignore localStorage errors (private mode, disabled storage, etc.) */
  }
}

/* -------------------------------------------------------------------------- */
/* Quiz flow                                                                  */
/* -------------------------------------------------------------------------- */

function startQuiz(language) {
  currentLanguage = language;
  currentQuestionIndex = 0;
  score = 0;
  incorrectAnswers = [];
  isOptionSelected = false;
  isCountdownActive = false;

  if (!questions[currentLanguage] || questions[currentLanguage].length === 0) {
    alert(`No questions available for ${currentLanguage}`);
    return;
  }

  // Copy + shuffle, never mutate the source data.
  questionsShuffled = shuffleArray(questions[currentLanguage]);
  totalQuestions = questionsShuffled.length;

  document.querySelectorAll(".quiz-intro").forEach((el) => {
    el.style.display = "none";
  });
  const languageButtons = document.getElementById("language-buttons");
  if (languageButtons) languageButtons.style.display = "none";

  const performanceSection = document.getElementById("performanceSection");
  if (performanceSection) performanceSection.style.display = "none";

  updateProgressBar(0, totalQuestions);
  showQuestion();
}

function showQuestion() {
  const quizSection = document.getElementById("quizSection");
  if (!quizSection) return;

  const question = questionsShuffled[currentQuestionIndex];
  if (!question) {
    showFinalPerformance();
    return;
  }
  if (isCountdownActive) return;

  isCountdownActive = true;
  let countdown = USER_DEFINED_TIME;
  quizSection.innerHTML = `
    <div class="countdown-timer">
      <h3>Get ready! The next question will appear in <span id="countdown">${countdown}</span> seconds...</h3>
    </div>
  `;

  const countdownInterval = setInterval(() => {
    countdown -= 1;
    const el = document.getElementById("countdown");
    if (el) el.textContent = countdown;

    if (countdown <= 0) {
      clearInterval(countdownInterval);
      isCountdownActive = false;
      showQuizQuestion(question);
    }
  }, 1000);
}

function showQuizQuestion(question) {
  const quizSection = document.getElementById("quizSection");
  if (!quizSection) return;
  quizSection.innerHTML = "";

  const card = document.createElement("div");
  card.className = "quiz-question";

  const heading = document.createElement("h3");
  heading.textContent = `${currentQuestionIndex + 1}. ${question.question}`;
  card.appendChild(heading);

  shuffleArray(question.options).forEach((option) => {
    const optionDiv = document.createElement("div");
    optionDiv.className = "option";
    optionDiv.textContent = option;
    optionDiv.addEventListener("click", () => selectOption(optionDiv, option, question.answer));
    card.appendChild(optionDiv);
  });

  const resultMessage = document.createElement("div");
  resultMessage.id = "result-message";
  card.appendChild(resultMessage);

  quizSection.appendChild(card);
  updateProgressBar(currentQuestionIndex + 1, totalQuestions);

  if (typeof quizSection.scrollIntoView === "function") {
    quizSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function selectOption(element, selected, correctAnswer) {
  if (isOptionSelected || isCountdownActive) return;
  isOptionSelected = true;

  const currentQuestion = questionsShuffled[currentQuestionIndex];
  const resultMessage = document.getElementById("result-message");

  if (selected === correctAnswer) {
    score += 1;
    if (resultMessage) {
      resultMessage.textContent = "Correct!";
      resultMessage.style.color = "#2e7d32";
    }
  } else {
    if (resultMessage) {
      resultMessage.textContent = `Incorrect! The correct answer is: ${correctAnswer}`;
      resultMessage.style.color = "#c62828";
    }
    incorrectAnswers.push({
      question: currentQuestion.question,
      options: currentQuestion.options,
      correctAnswer: currentQuestion.answer,
      selectedAnswer: selected,
    });
  }

  element.classList.add("selected");
  document.querySelectorAll(".option").forEach((opt) => {
    opt.style.pointerEvents = "none";
  });

  setTimeout(() => {
    currentQuestionIndex += 1;
    isOptionSelected = false;

    if (currentQuestionIndex >= totalQuestions) {
      showFinalPerformance();
    } else if (currentQuestionIndex % 10 === 0) {
      showIntermediatePerformance();
    } else {
      showQuestion();
    }
  }, 1200);
}

function evaluatePerformance(scored, answered) {
  const percentage = answered > 0 ? (scored / answered) * 100 : 0;
  if (percentage === 100) {
    return "Excellent! You answered all questions correctly. Keep up the great work!";
  }
  if (percentage >= 90) {
    return "Great job! You have a strong understanding of the material.";
  }
  if (percentage >= 80) {
    return "Good job! You answered most questions correctly. A little more practice and you will be perfect.";
  }
  if (percentage >= 70) {
    return "Nice effort! You are getting there. Keep studying and you will improve even more.";
  }
  if (percentage >= 60) {
    return "You are doing okay, but there is room for improvement. Keep practicing!";
  }
  if (percentage >= 50) {
    return "You are getting better! Keep working on it and you will see more progress.";
  }
  return "Improvement needed. Do not give up - keep practicing and you will get better!";
}

function showIntermediatePerformance() {
  const quizSection = document.getElementById("quizSection");
  if (!quizSection) return;
  const answered = currentQuestionIndex;
  const percentage = answered > 0 ? ((score / answered) * 100).toFixed(2) : "0.00";

  quizSection.innerHTML = `
    <div class="performance-message">
      <h3>Your Performance Till Now</h3>
      <p>${evaluatePerformance(score, answered)}</p>
      <p>Current Score: ${score} out of ${answered} (${percentage}%)</p>
      <button class="quiz-button" id="continue-quiz-btn">Continue Quiz</button>
    </div>
  `;
  const continueBtn = document.getElementById("continue-quiz-btn");
  if (continueBtn) continueBtn.addEventListener("click", showQuestion);
}

function showFinalPerformance() {
  saveQuizResult(currentLanguage, score, totalQuestions);

  const performanceSection = document.getElementById("performanceSection");
  if (!performanceSection) return;
  performanceSection.style.display = "block";

  const percentage = totalQuestions > 0 ? ((score / totalQuestions) * 100).toFixed(2) : "0.00";
  performanceSection.innerHTML = `
    <div class="performance-message">
      <h3>Quiz Complete!</h3>
      <p>Language: <strong>${currentLanguage}</strong></p>
      <p>${evaluatePerformance(score, totalQuestions)}</p>
      <p>Final Score: ${score} out of ${totalQuestions} (${percentage}%)</p>
      ${incorrectAnswers.length > 0 ? '<button class="quiz-button" id="review-btn">Review Incorrect Answers</button><button class="quiz-button" id="retake-btn">Retake Incorrect Questions</button>' : ""}
      <button class="quiz-button" id="restart-btn">Restart Quiz</button>
    </div>
  `;

  const reviewBtn = document.getElementById("review-btn");
  if (reviewBtn) reviewBtn.addEventListener("click", enterReviewMode);
  const retakeBtn = document.getElementById("retake-btn");
  if (retakeBtn) retakeBtn.addEventListener("click", retakeIncorrectQuestions);
  const restartBtn = document.getElementById("restart-btn");
  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      document.querySelectorAll(".quiz-intro").forEach((el) => {
        el.style.display = "";
      });
      const languageButtons = document.getElementById("language-buttons");
      if (languageButtons) languageButtons.style.display = "";
      performanceSection.style.display = "none";
      const quizSection = document.getElementById("quizSection");
      if (quizSection) quizSection.innerHTML = "";
      updateProgressBar(0, totalQuestions);
    });
  }

  if (typeof performanceSection.scrollIntoView === "function") {
    performanceSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function enterReviewMode() {
  const quizSection = document.getElementById("quizSection");
  if (!quizSection) return;
  quizSection.innerHTML = "";

  const heading = document.createElement("h3");
  heading.textContent = "Review Incorrect Answers";
  quizSection.appendChild(heading);

  if (incorrectAnswers.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "No incorrect answers to review. Well done!";
    quizSection.appendChild(empty);
  } else {
    incorrectAnswers.forEach((incorrect, index) => {
      const questionElement = document.createElement("div");
      questionElement.className = "review-question";

      const qTitle = document.createElement("h4");
      qTitle.textContent = `${index + 1}. ${incorrect.question}`;
      questionElement.appendChild(qTitle);

      const yourAnswer = document.createElement("p");
      yourAnswer.textContent = `Your Answer: ${incorrect.selectedAnswer}`;
      questionElement.appendChild(yourAnswer);

      const correctAnswer = document.createElement("p");
      correctAnswer.textContent = `Correct Answer: ${incorrect.correctAnswer}`;
      questionElement.appendChild(correctAnswer);

      quizSection.appendChild(questionElement);
    });
  }

  const backButton = document.createElement("button");
  backButton.className = "quiz-button";
  backButton.textContent = "Back to Results";
  backButton.addEventListener("click", showFinalPerformance);
  quizSection.appendChild(backButton);
}

function retakeIncorrectQuestions() {
  const questionsToRetake = incorrectAnswers.slice();
  if (questionsToRetake.length === 0) {
    alert("No incorrect questions to retake.");
    return;
  }

  currentQuestionIndex = 0;
  score = 0;

  questionsShuffled = questionsToRetake.map((incorrect) => ({
    question: incorrect.question,
    options: incorrect.options,
    answer: incorrect.correctAnswer,
  }));
  totalQuestions = questionsShuffled.length;
  incorrectAnswers = [];

  const performanceSection = document.getElementById("performanceSection");
  if (performanceSection) performanceSection.style.display = "none";
  showQuestion();
}

/* Initialize */
(() => {
  if (typeof document === "undefined") return;
  document.addEventListener("DOMContentLoaded", () => {
    initDarkMode();
    initMenuToggle();
    loadQuestions();
  });
})();