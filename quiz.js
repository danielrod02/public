// quiz.js
// Handles quiz rendering, timer, and cheat detection

const hostPart = 'https://quiz-worker.oscarformired.workers.dev';

const quizForm = document.getElementById('quizForm');
const quizQuestionsDiv = document.getElementById('quiz-questions');
const timerDiv = document.getElementById('timer');
const loader = document.getElementById('loader');
const loaderMessage = document.getElementById('loader-message');
const cheatWarning = document.getElementById('cheat-warning');

let timer;
let timeLeft = 20 * 60; // 20 minutes in seconds

function startTimer() {
    timer = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timer);
            quizForm.submit();
        } else {
            timeLeft--;
            const min = Math.floor(timeLeft / 60);
            const sec = timeLeft % 60;
            timerDiv.textContent = `Tiempo restante: ${min}:${sec.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

function renderQuiz(quiz, user) {
    quizQuestionsDiv.innerHTML = '';
    quiz.forEach((q, idx) => {
        const qDiv = document.createElement('div');
        qDiv.className = 'question-block';
        const opciones = Object.entries(q.opciones); // [['A', 'Option 1'], ['B', 'Option 2'], ...]
        qDiv.innerHTML = `
          <fieldset>
        <legend style="font-size: 1.5rem; margin-bottom: 20px">Q${idx + 1}: ${q.pregunta}</legend>
        <input type="hidden" id="q${idx}" name="q${idx}" value="${q.pregunta}">
        ${opciones.map(([key, value]) => `
          <label>
            <input type="radio" name="q${idx}" value="${key}" required>
            ${key}: ${value}
          </label>
        `).join('')}
        <label style="margin-top: 20px">Justificacion
          <textarea name="justification${idx}" required></textarea>
        </label>
          </fieldset>
          <hr>
        `;
        quizQuestionsDiv.appendChild(qDiv);
    });
    document.getElementById('user_id').value = user.id;
    document.getElementById('user_name').value = user.name;
    document.getElementById('user_email').value = user.email;

    loader.style.display = 'none';
    loaderMessage.style.display = 'none';
}

async function fetchQuiz() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const name = params.get('name');
    const email = params.get('email');
    if (!id || !name || !email) {
        window.location.href = '/index.html';
        return;
    }
    const res = await fetch(`${hostPart}/api/quiz?id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`);
    if (res.status !== 200) {
        quizQuestionsDiv.innerHTML = '<p>Could not load quiz.</p>';
        return;
    }
    const quiz = await res.json();
    console.debug(quiz);
    renderQuiz(quiz, { id, name, email });
    startTimer();
}

// Cheat detection
let cheatDetected = false;
function blockUser() {
    cheatWarning.style.display = 'block';
    quizForm.style.display = 'none';
    fetch(`${hostPart}/api/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: document.getElementById('user_id').value, cheat: true })
    });
}

function handleCheat() {
    if (!cheatDetected) {
        cheatDetected = true;
        blockUser();
    }
}

document.addEventListener('visibilitychange', () => {
    if (document.hidden) handleCheat();
});
window.addEventListener('blur', handleCheat);
// window.addEventListener('beforeunload', handleCheat);

window.onload = fetchQuiz;
