let pin = localStorage.getItem('userPin') || "1707";
let cicloData = JSON.parse(localStorage.getItem('cicloData')) || [];
let habits = JSON.parse(localStorage.getItem('myHabits')) || [];

// --- SEGURIDAD ---
function checkPin() {
    const input = document.getElementById('pinInput').value;
    if(input === pin) {
        document.getElementById('lock-screen').style.display = 'none';
    } else {
        alert("PIN incorrecto");
    }
}

function changePin() {
    const newPin = document.getElementById('newPin').value;
    if(newPin.length === 4) {
        pin = newPin;
        localStorage.setItem('userPin', pin);
        alert("PIN cambiado con éxito");
    } else {
        alert("El PIN debe ser de 4 dígitos");
    }
}

// --- NAVEGACIÓN ---
function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('view-' + id).classList.add('active');
    if(id === 'habitos') renderHabits();
    if(id === 'ciclo') renderCiclo();
}

// --- LÓGICA DE HÁBITOS (Ancho y renderizado) ---
function addHabit() {
    const name = document.getElementById('habitName').value;
    if(!name) return;
    habits.push({ id: Date.now(), name, history: [] });
    localStorage.setItem('myHabits', JSON.stringify(habits));
    closeModal('habitModal');
    renderHabits();
}

function renderHabits() {
    const container = document.getElementById('habitContainer');
    container.innerHTML = habits.map(h => `
        <div class="habit-card">
            <h3>${h.name}</h3>
            <div class="dots-grid">
                ${generarPuntos(h)}
            </div>
        </div>
    `).join('');
}

function generarPuntos(habit) {
    let html = '';
    for(let i = 1; i <= 31; i++) {
        const checked = habit.history.includes(i) ? 'checked' : '';
        html += `
            <div class="dot-wrapper" onclick="toggleDot(${habit.id}, ${i})">
                <div class="dot ${checked}"></div>
                <span class="dot-number">${i}</span>
            </div>
        `;
    }
    return html;
}

function toggleDot(hId, day) {
    const h = habits.find(x => x.id === hId);
    if(h.history.includes(day)) h.history = h.history.filter(d => d !== day);
    else h.history.push(day);
    localStorage.setItem('myHabits', JSON.stringify(habits));
    renderHabits();
}

// --- CICLO MENSTRUAL ---
function saveCicloData() {
    const entry = {
        date: document.getElementById('cicloDate').value,
        sangrado: document.getElementById('cSangrado').checked,
        relaciones: document.getElementById('cRelaciones').checked,
        emocion: document.getElementById('cEmocion').value,
        sueño: document.getElementById('cSueño').value,
        energia: document.getElementById('cEnergia').value,
        obs: document.getElementById('cObs').value
    };
    cicloData.push(entry);
    localStorage.setItem('cicloData', JSON.stringify(cicloData));
    renderCiclo();
    alert("Guardado");
}

function renderCiclo() {
    const list = document.getElementById('cicloHistory');
    list.innerHTML = cicloData.map(e => `
        <div class="ajuste-card">
            <small>${e.date}</small>
            <p>${e.sangrado ? '🩸 Sangrado' : ''} ${e.relaciones ? '👩‍❤️‍👨 Relaciones' : ''}</p>
            <p>😊 ${e.emocion} | 💤 ${e.sueño}h | ⚡ ${e.energia}/5</p>
            <p><i>${e.obs}</i></p>
        </div>
    `).reverse().join('');
}

// --- OTROS ---
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// Modales
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// Carga inicial
if(localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark-mode');