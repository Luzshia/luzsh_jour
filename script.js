if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registrado con éxito', reg))
            .catch(err => console.error('Error al registrar el Service Worker', err));
    });
}

/* --- CONFIGURACIÓN INICIAL Y ESTADOS GLOBALES --- */
let pinIngresado = "";
const PIN_CORRECTO = localStorage.getItem('journalPin') || "1707"; 

let modoEdicionActivo = false; // Metas
let modoEdicionHabitos = false;
let modoEdicionTodo = false;
let modoEdicionAgenda = false;

let fechaActualAgenda = new Date();
let fechaSeleccionadaCiclo = new Date().toISOString().split('T')[0];

/* --- AL CARGAR EL DOCUMENTO (DOM) --- */
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar año dinámico
    const labelAnio = document.getElementById('meta-year-label');
    if (labelAnio) labelAnio.textContent = new Date().getFullYear();

    // Configurar Teclado Numérico PIN
    document.querySelectorAll('.num-btn[data-val]').forEach(boton => {
        boton.addEventListener('click', () => {
            if (pinIngresado.length < 4) {
                pinIngresado += boton.getAttribute('data-val');
                actualizarInterfazPin();
            }
        });
    });

    const btnClear = document.getElementById('btn-clear');
    if(btnClear) btnClear.addEventListener('click', () => { pinIngresado = ""; actualizarInterfazPin(); });

    const btnEnter = document.getElementById('btn-enter');
    if(btnEnter) btnEnter.addEventListener('click', validarPin);

    // Navegación del Menú Columna
    const botonesMenu = {
        'go-metas': 'metas',
        'go-habitos': 'habitos',
        'go-todo': 'todo',
        'go-agenda': 'agenda',
        'go-ciclo': 'ciclo',
        'go-config': 'config'
    };

    for (let id in botonesMenu) {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', () => navegar(botonesMenu[id]));
    }

    // Configuración general
    document.getElementById('btn-toggle-dark')?.addEventListener('click', cambiarTema);
    document.getElementById('color-picker')?.addEventListener('input', cambiarColorAcento);
    document.getElementById('btn-change-pin')?.addEventListener('click', cambiarPinAction);
    document.getElementById('btn-export')?.addEventListener('click', exportarDatos);
    document.getElementById('import-file')?.addEventListener('change', importarDatos);

    // Asignación de botones de edición
    document.getElementById('opt-edit-metas').onclick = (e) => {
        e.stopPropagation();
        desactivarOtrosModos('metas');
        modoEdicionActivo = !modoEdicionActivo;
        cargarMetas();
    };

    document.getElementById('opt-edit-habitos').onclick = (e) => {
        e.stopPropagation();
        desactivarOtrosModos('habitos');
        modoEdicionHabitos = !modoEdicionHabitos;
        cargarHabitos();
    };

    document.getElementById('opt-edit-todo').onclick = (e) => {
        e.stopPropagation();
        desactivarOtrosModos('todo');
        modoEdicionTodo = !modoEdicionTodo;
        cargarTareas();
    };

    document.getElementById('opt-edit-agenda').onclick = (e) => {
        e.stopPropagation();
        desactivarOtrosModos('agenda');
        modoEdicionAgenda = !modoEdicionAgenda;
        renderizarSemanaHobonichi();
    };

    // Arreglo del Botón de Registro del Ciclo
    document.getElementById('opt-edit-ciclo').onclick = (e) => {
        e.stopPropagation();
        const modal = document.getElementById('modal-registro');
        document.getElementById('reg-fecha').value = fechaSeleccionadaCiclo;
        if (modal) modal.classList.remove('hidden');
    };

    document.getElementById('btn-cerrar-modal').onclick = () => {
        document.getElementById('modal-registro').classList.add('hidden');
    };
    document.getElementById('btn-guardar-reg').onclick = guardarRegistroCiclo;

    // Agenda controles semanales
    document.getElementById('btn-semana-prev').onclick = () => { fechaActualAgenda.setDate(fechaActualAgenda.getDate() - 7); renderizarSemanaHobonichi(); };
    document.getElementById('btn-semana-next').onclick = () => { fechaActualAgenda.setDate(fechaActualAgenda.getDate() + 7); renderizarSemanaHobonichi(); };

    // Inputs de guardado con Enter
    document.getElementById('input-nueva-meta').onkeydown = (e) => { if (e.key === 'Enter') guardarMeta(e.target.value.trim()); };
    document.getElementById('todo-tarea').onkeydown = (e) => { if (e.key === 'Enter') guardarTarea(e.target.value.trim()); };

    // DETECTOR GLOBAL: GUARDAR Y CERRAR EDICIÓN AL PRESIONAR ESPACIOS VACÍOS
    document.addEventListener('click', (e) => {
        const areaProyecto = e.target.closest('.project-area');
        const esBotonEditar = e.target.closest('.edit-section-btn');
        const esInputCont = e.target.closest('.input-inline-container');

        if (!areaProyecto && !esBotonEditar && !esInputCont) {
            // Guardar o simplemente cerrar modos de edición activos
            if(modoEdicionActivo) { modoEdicionActivo = false; cargarMetas(); }
            if(modoEdicionHabitos) { modoEdicionHabitos = false; cargarHabitos(); }
            if(modoEdicionTodo) { modoEdicionTodo = false; cargarTareas(); }
            if(modoEdicionAgenda) { modoEdicionAgenda = false; renderizarSemanaHobonichi(); }
        }
    });

    // Carga inicial de datos
    cargarMetas();
    cargarHabitos();
    cargarTareas();
    renderizarSemanaHobonichi();
    dibujarRueda();
    cargarEstilosPredefinidos();
});

function desactivarOtrosModos(actual) {
    if(actual !== 'metas' && modoEdicionActivo) { modoEdicionActivo = false; cargarMetas(); }
    if(actual !== 'habitos' && modoEdicionHabitos) { modoEdicionHabitos = false; cargarHabitos(); }
    if(actual !== 'todo' && modoEdicionTodo) { modoEdicionTodo = false; cargarTareas(); }
    if(actual !== 'agenda' && modoEdicionAgenda) { modoEdicionAgenda = false; renderizarSemanaHobonichi(); }
}

/* --- INTERFAZ PIN --- */
function actualizarInterfazPin() {
    for (let i = 1; i <= 4; i++) {
        const slot = document.getElementById(`slot-${i}`);
        if(slot) {
            if (i <= pinIngresado.length) slot.classList.add('filled');
            else slot.classList.remove('filled');
        }
    }
}
function validarPin() {
    if (pinIngresado === PIN_CORRECTO) {
        document.getElementById('lock-screen').style.display = 'none';
    } else {
        alert("PIN Incorrecto");
        pinIngresado = "";
        actualizarInterfazPin();
    }
}

/* --- NAVEGACIÓN --- */
function navegar(vistaId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${vistaId}`)?.classList.add('active');
}

/* --- METAS --- */
function cargarMetas() {
    const anio = new Date().getFullYear();
    const metas = JSON.parse(localStorage.getItem(`journal_metas_${anio}`)) || [];
    const lista = document.getElementById('lista-metas');
    if(!lista) return;
    lista.innerHTML = "";

    metas.forEach((m, index) => {
        const li = document.createElement('li');
        li.className = `meta-item ${m.completada ? 'completed' : ''}`;
        li.innerHTML = `<span>${m.texto}</span>`;
        
        if (modoEdicionActivo) {
            const btn = document.createElement('button');
            btn.className = "btn-delete-meta";
            btn.textContent = "×";
            btn.onclick = (e) => { e.stopPropagation(); borrarMeta(index); };
            li.appendChild(btn);
        } else {
            li.onclick = () => { m.completada = !m.completada; localStorage.setItem(`journal_metas_${anio}`, JSON.stringify(metas)); cargarMetas(); };
        }
        lista.appendChild(li);
    });

    const container = document.getElementById('input-container-meta');
    if(modoEdicionActivo) { container.classList.remove('hidden'); document.getElementById('input-nueva-meta').focus(); }
    else container.classList.add('hidden');
}
function guardarMeta(texto) {
    if(!texto) return;
    const anio = new Date().getFullYear();
    let metas = JSON.parse(localStorage.getItem(`journal_metas_${anio}`)) || [];
    metas.push({ texto, completada: false });
    localStorage.setItem(`journal_metas_${anio}`, JSON.stringify(metas));
    document.getElementById('input-nueva-meta').value = "";
    cargarMetas();
}
function borrarMeta(index) {
    const anio = new Date().getFullYear();
    let metas = JSON.parse(localStorage.getItem(`journal_metas_${anio}`)) || [];
    metas.splice(index, 1);
    localStorage.setItem(`journal_metas_${anio}`, JSON.stringify(metas));
    cargarMetas();
}

/* --- HÁBITOS --- */
function cargarHabitos() {
    const clave = `journal_habits_${new Date().getFullYear()}_${new Date().getMonth() + 1}`;
    const habitos = JSON.parse(localStorage.getItem(clave)) || [];
    const contenedor = document.getElementById('contenedor-habitos');
    if(!contenedor) return;
    contenedor.innerHTML = "";

    const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    document.getElementById('habit-month-label').textContent = "- " + nombresMeses[new Date().getMonth()];

    const diasEnMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

    habitos.forEach(h => {
        const item = document.createElement('div');
        item.className = 'habit-item';
        let puntosHTML = "";

        for (let d = 1; d <= diasEnMes; d++) {
            const checked = h.completados?.includes(d) ? 'checked' : '';
            puntosHTML += `<div class="habit-dot ${checked}" onclick="event.stopPropagation(); alternarDiaHabito('${h.id}', ${d})">${d}</div>`;
        }

        item.innerHTML = `
            <div class="habit-header">
                <span class="habit-name">${h.nombre}</span>
                ${modoEdicionHabitos ? `<button class="btn-delete-meta" onclick="event.stopPropagation(); borrarHabito('${h.id}')">×</button>` : ''}
            </div>
            <div class="dots-container-notebook">${puntosHTML}</div>
        `;
        contenedor.appendChild(item);
    });

    if (modoEdicionHabitos) {
        const div = document.createElement('div');
        div.className = "input-inline-container";
        div.innerHTML = `<input type="text" id="input-nuevo-habito" placeholder="+ Nuevo hábito (Enter para guardar)...">`;
        contenedor.appendChild(div);
        const input = document.getElementById('input-nuevo-habito');
        input.focus();
        input.onkeydown = (e) => { if(e.key === 'Enter') guardarHabito(e.target.value.trim()); };
    }
}
function guardarHabito(nombre) {
    if(!nombre) return;
    const clave = `journal_habits_${new Date().getFullYear()}_${new Date().getMonth() + 1}`;
    let habitos = JSON.parse(localStorage.getItem(clave)) || [];
    habitos.push({ id: 'hab_'+Date.now(), nombre, completados: [] });
    localStorage.setItem(clave, JSON.stringify(habitos));
    cargarHabitos();
}
function alternarDiaHabito(id, dia) {
    if(modoEdicionHabitos) return;
    const clave = `journal_habits_${new Date().getFullYear()}_${new Date().getMonth() + 1}`;
    let habitos = JSON.parse(localStorage.getItem(clave)) || [];
    habitos = habitos.map(h => {
        if(h.id === id) {
            let comps = h.completados || [];
            comps = comps.includes(dia) ? comps.filter(d => d !== dia) : [...comps, dia];
            return { ...h, completados: comps };
        }
        return h;
    });
    localStorage.setItem(clave, JSON.stringify(habitos));
    cargarHabitos();
}
function borrarHabito(id) {
    const clave = `journal_habits_${new Date().getFullYear()}_${new Date().getMonth() + 1}`;
    let habitos = JSON.parse(localStorage.getItem(clave)) || [];
    habitos = habitos.filter(h => h.id !== id);
    localStorage.setItem(clave, JSON.stringify(habitos));
    cargarHabitos();
}

/* --- TO-DO LIST --- */
function cargarTareas() {
    const tareas = JSON.parse(localStorage.getItem('journal_todo')) || [];
    const lista = document.getElementById('lista-tareas');
    if(!lista) return;
    lista.innerHTML = "";

    tareas.forEach((t, index) => {
        const li = document.createElement('li');
        li.className = `todo-item-notebook ${t.completada ? 'done' : ''}`;
        li.innerHTML = `
            <div class="todo-bullet">•</div>
            <span>${t.texto}</span>
            ${modoEdicionTodo ? `<button class="btn-delete-meta" onclick="event.stopPropagation(); borrarTarea(${index})">×</button>` : ''}
        `;
        if(!modoEdicionTodo) li.onclick = () => { t.completada = !t.completada; localStorage.setItem('journal_todo', JSON.stringify(tareas)); cargarTareas(); };
        lista.appendChild(li);
    });

    const container = document.getElementById('input-container-todo');
    if(modoEdicionTodo) { container.classList.remove('hidden'); document.getElementById('todo-tarea').focus(); }
    else container.classList.add('hidden');
}
function guardarTarea(texto) {
    if(!texto) return;
    let tareas = JSON.parse(localStorage.getItem('journal_todo')) || [];
    tareas.push({ texto, completada: false });
    localStorage.setItem('journal_todo', JSON.stringify(tareas));
    document.getElementById('todo-tarea').value = "";
    cargarTareas();
}
function borrarTarea(index) {
    let tareas = JSON.parse(localStorage.getItem('journal_todo')) || [];
    tareas.splice(index, 1);
    localStorage.setItem('journal_todo', JSON.stringify(tareas));
    cargarTareas();
}

/* --- ESTILO AGENDA HOBONICHI ORIGINAL --- */
function obtenerLunes(d) {
    d = new Date(d);
    let day = d.getDay(), diff = d.getDate() - day + (day == 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function renderizarSemanaHobonichi() {
    const contenedor = document.getElementById('semana-container');
    if (!contenedor) return;
    contenedor.innerHTML = "";

    let lunes = obtenerLunes(fechaActualAgenda);
    const nombresDias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

    for (let i = 0; i < 7; i++) {
        let diaF = new Date(lunes);
        diaF.setDate(lunes.getDate() + i);
        let isoFecha = diaF.toISOString().split('T')[0];
        let eventos = JSON.parse(localStorage.getItem(`agenda_${isoFecha}`)) || [];

        let lineasHTML = "";
        eventos.forEach((ev, idx) => {
            lineasHTML += `
                <div class="hobo-line-item ${ev.done ? 'done' : ''}" onclick="event.stopPropagation(); alternarEventoAgenda('${isoFecha}', ${idx})">
                    <span class="hobo-bullet">▪</span>
                    <span class="hobo-text">${ev.texto}</span>
                    ${modoEdicionAgenda ? `<button class="btn-delete-meta" onclick="event.stopPropagation(); borrarEventoAgenda('${isoFecha}', ${idx})">×</button>` : ''}
                </div>`;
        });

        const colDia = document.createElement('div');
        colDia.className = "hobo-day-column";
        colDia.innerHTML = `
            <div class="hobo-day-header">
                <span class="hobo-num">${diaF.getDate()}</span>
                <span class="hobo-name">${nombresDias[i]}</span>
            </div>
            <div class="hobo-lines-container">
                ${lineasHTML}
                ${modoEdicionAgenda ? `
                    <div class="input-inline-container" onclick="event.stopPropagation();">
                        <input type="text" placeholder="+ Agregar..." onkeydown="if(event.key==='Enter') { guardarEventoHobonichi('${isoFecha}', this.value); this.value=''; }">
                    </div>
                ` : ''}
            </div>
        `;
        contenedor.appendChild(colDia);
    }
}
function guardarEventoHobonichi(fecha, texto) {
    if(!texto) return;
    let eventos = JSON.parse(localStorage.getItem(`agenda_${fecha}`)) || [];
    eventos.push({ texto, done: false });
    localStorage.setItem(`agenda_${fecha}`, JSON.stringify(eventos));
    renderizarSemanaHobonichi();
}
function alternarEventoAgenda(fecha, idx) {
    if(modoEdicionAgenda) return;
    let eventos = JSON.parse(localStorage.getItem(`agenda_${fecha}`)) || [];
    if(eventos[idx]) { eventos[idx].done = !eventos[idx].done; localStorage.setItem(`agenda_${fecha}`, JSON.stringify(eventos)); renderizarSemanaHobonichi(); }
}
function borrarEventoAgenda(fecha, idx) {
    let eventos = JSON.parse(localStorage.getItem(`agenda_${fecha}`)) || [];
    eventos.splice(idx, 1);
    localStorage.setItem(`agenda_${fecha}`, JSON.stringify(eventos));
    renderizarSemanaHobonichi();
}

/* --- CICLO LUNAR Y RUEDA --- */
function guardarRegistroCiclo() {
    const fecha = document.getElementById('reg-fecha').value;
    if(!fecha) return;
    const registros = JSON.parse(localStorage.getItem('ciclo_logs')) || {};
    registros[fecha] = {
        sangrado: document.getElementById('reg-sangrado').value,
        dolor: document.getElementById('reg-dolor').value,
        energia: document.getElementById('reg-energia').value,
        animo: document.getElementById('reg-animo').value,
        observaciones: document.getElementById('reg-observaciones').value
    };
    localStorage.setItem('ciclo_logs', JSON.stringify(registros));
    document.getElementById('modal-registro').classList.add('hidden');
    dibujarRueda();
    mostrarDetalleCiclo(fecha);
}

function mostrarDetalleCiclo(fecha) {
    const logs = JSON.parse(localStorage.getItem('ciclo_logs')) || {};
    const div = document.getElementById('info-ciclo-detalle');
    if(!div) return;

    if(logs[fecha]) {
        const r = logs[fecha];
        div.innerHTML = `
            <h4>Registros del ${fecha}:</h4>
            <p>🩸 <b>Sangrado:</b> ${r.sangrado || 'Ninguno'}</p>
            <p>⚡ <b>Dolor:</b> ${r.dolor || 'Ninguno'}</p>
            <p>🔋 <b>Energía:</b> ${r.energia}</p>
            <p>🎭 <b>Ánimo:</b> ${r.animo}</p>
            <p>📝 <b>Notas:</b> ${r.observaciones || 'Sin notas'}</p>
        `;
    } else {
        div.innerHTML = `<p class="placeholder-text">Día ${fecha} sin registros guardados.</p>`;
    }
}

function dibujarRueda() {
    const canvas = document.getElementById('rueda-ciclo');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,320,320);

    // Dibujamos un anillo minimalista representativo
    ctx.beginPath();
    ctx.arc(160, 160, 120, 0, 2 * Math.PI);
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--line-color').trim() || '#eee';
    ctx.lineWidth = 15;
    ctx.stroke();

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Rueda de Síntomas", 160, 165);
}

/* --- CONFIGURACIONES ADICIONALES --- */
function cambiarTema() { document.body.classList.toggle('dark-mode'); localStorage.setItem('journalDark', document.body.classList.contains('dark-mode')); }
function cambiarColorAcento(e) { document.documentElement.style.setProperty('--accent-color', e.target.value); localStorage.setItem('journalAccentColor', e.target.value); }
function cargarEstilosPredefinidos() { if(localStorage.getItem('journalDark') === 'true') document.body.classList.add('dark-mode'); const color = localStorage.getItem('journalAccentColor'); if(color) document.documentElement.style.setProperty('--accent-color', color); }
function cambiarPinAction() { const p = prompt("Nuevo PIN (4 dígitos):"); if(p && p.length===4) { localStorage.setItem('journalPin', p); alert("PIN actualizado"); } }
function exportarDatos() { const blob = new Blob([JSON.stringify(localStorage)], { type: "application/json" }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `backup_journal.json`; a.click(); }
function importarDatos(e) { const f = e.target.files[0]; if(!f) return; const reader = new FileReader(); reader.onload = function(e) { try { const d = JSON.parse(e.target.result); Object.keys(d).forEach(k => localStorage.setItem(k, d[k])); alert("Copia restaurada"); location.reload(); } catch(err) { alert("Error"); } }; reader.readAsText(f); }
