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

let modoEdicionActivo = false;
let metaEditandoIndex = null;
let modoEdicionHabitos = false;
let habitoEditandoId = null;
let modoEdicionAgenda = false;
let eventoEditando = null; 
let modoEdicionTodo = false; 
let todoEditandoIndex = null;

let fechaActualAgenda = new Date();

/* --- AL CARGAR EL DOCUMENTO (DOM) --- */
document.addEventListener('DOMContentLoaded', () => {
    const labelAnio = document.getElementById('year-label');
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
    if(btnClear) btnClear.addEventListener('click', () => {
        pinIngresado = "";
        actualizarInterfazPin();
    });

    const btnEnter = document.getElementById('btn-enter');
    if(btnEnter) btnEnter.addEventListener('click', validarPin);

    // Navegación del Menú
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
        if (btn) {
            btn.addEventListener('click', () => navegar(botonesMenu[id]));
        }
    }

    history.replaceState({ page: 'menu' }, "", "");

    // Configuración escuchadores básicos
    const toggleDark = document.getElementById('btn-toggle-dark');
    if(toggleDark) toggleDark.addEventListener('click', cambiarTema);
    
    const colorPicker = document.getElementById('color-picker');
    if(colorPicker) colorPicker.addEventListener('input', cambiarColorAcento);
    
    const changePin = document.getElementById('btn-change-pin');
    if(changePin) changePin.addEventListener('click', cambiarPinAction);
    
    const btnExport = document.getElementById('btn-export');
    if(btnExport) btnExport.addEventListener('click', exportarDatos);
    
    const importFile = document.getElementById('import-file');
    if(importFile) importFile.addEventListener('change', importarDatos);

    // Arranque inicial de datos
    cargarMetas();
    cargarHabitos();
    cargarTareas();
    renderizarSemana();
    dibujarRueda();
});


/* --- LOGICA GENERAL DE METAS --- */
const optEditMetas = document.getElementById('opt-edit-metas');
if (optEditMetas) {
    optEditMetas.onclick = (e) => {
        e.stopPropagation();
        modoEdicionActivo = !modoEdicionActivo;
        metaEditandoIndex = null;
        cargarMetas();
    };
}

const inputNuevaMeta = document.getElementById('input-nueva-meta');
if (inputNuevaMeta) {
    inputNuevaMeta.onkeydown = (e) => {
        if (e.key === 'Enter') guardarMeta(e.target.value.trim());
    };
}

function cargarMetas() {
    const anio = new Date().getFullYear();
    const metas = JSON.parse(localStorage.getItem(`journal_metas_${anio}`)) || [];
    const lista = document.getElementById('lista-metas');
    if(!lista) return;

    lista.innerHTML = "";
    metas.forEach((m, index) => {
        const li = document.createElement('li');
        li.className = `meta-item ${m.completada ? 'completed' : ''}`;
        
        const span = document.createElement('span');
        span.textContent = m.texto;
        li.appendChild(span);

        if (modoEdicionActivo) {
            const btnDel = document.createElement('button');
            btnDel.className = "btn-delete-meta";
            btnDel.textContent = "×";
            btnDel.onclick = (e) => { e.stopPropagation(); borrarMetaDirecto(index); };
            li.appendChild(btnDel);
        } else {
            li.onclick = () => {
                m.completada = !m.completada;
                localStorage.setItem(`journal_metas_${anio}`, JSON.stringify(metas));
                cargarMetas();
            };
        }
        lista.appendChild(li);
    });

    const container = document.getElementById('input-container-meta');
    if (modoEdicionActivo) {
        container.classList.remove('hidden');
        document.getElementById('input-nueva-meta').focus();
    } else {
        container.classList.add('hidden');
    }
}

function guardarMeta(texto) {
    if (texto === "") return;
    const anio = new Date().getFullYear();
    let metas = JSON.parse(localStorage.getItem(`journal_metas_${anio}`)) || [];
    metas.push({ texto: texto, completada: false });
    localStorage.setItem(`journal_metas_${anio}`, JSON.stringify(metas));
    document.getElementById('input-nueva-meta').value = "";
    cargarMetas();
}

function borrarMetaDirecto(index) {
    const anio = new Date().getFullYear();
    let metas = JSON.parse(localStorage.getItem(`journal_metas_${anio}`)) || [];
    metas.splice(index, 1);
    localStorage.setItem(`journal_metas_${anio}`, JSON.stringify(metas));
    cargarMetas();
}


/* --- LOGICA REFORMADA DE HÁBITOS (INLINE LIMPIO) --- */
const optEditHab = document.getElementById('opt-edit-habitos');
if (optEditHab) {
    optEditHab.onclick = (e) => {
        e.stopPropagation();
        modoEdicionHabitos = !modoEdicionHabitos;
        cargarHabitos();
    };
}

function cargarHabitos() {
    const clave = obtenerClaveMes();
    const habitos = JSON.parse(localStorage.getItem(clave)) || [];
    const contenedor = document.getElementById('contenedor-habitos');
    const labelMes = document.getElementById('habit-month-label');
    if(!contenedor) return;
    contenedor.innerHTML = "";

    const fechaActual = new Date();
    const anio = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();

    if(labelMes) {
        const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        labelMes.textContent = "- " + nombresMeses[mes];
    }

    const diasEnMes = new Date(anio, mes + 1, 0).getDate();
    let primerDiaSemana = new Date(anio, mes, 1).getDay(); 
    if (primerDiaSemana === 0) primerDiaSemana = 7; 

    habitos.forEach((habito) => {
        const item = document.createElement('div');
        item.className = 'habit-item';
        
        let puntosHTML = "";
        for (let i = 1; i < primerDiaSemana; i++) {
            puntosHTML += `<div class="habit-dot-spacer"></div>`;
        }

        for (let d = 1; d <= diasEnMes; d++) {
            const isChecked = habito.completados && habito.completados.includes(d) ? 'checked' : '';
            puntosHTML += `
                <div class="habit-dot-wrapper" onclick="alternarDiaHabito('${habito.id}', ${d})">
                    <div class="habit-dot ${isChecked}"></div>
                    <span class="dot-day">${d}</span>
                </div>`;
        }

        item.innerHTML = `
            <div class="habit-header">
                <span class="habit-name">${habito.nombre}</span>
                ${modoEdicionHabitos ? `<button class="btn-delete-habit" onclick="borrarHabito('${habito.id}')">×</button>` : ''}
            </div>
            <div class="dots-container">
                <div class="habit-day-header">
                    <span class="habit-day-label">L</span><span class="habit-day-label">M</span>
                    <span class="habit-day-label">M</span><span class="habit-day-label">J</span>
                    <span class="habit-day-label">V</span><span class="habit-day-label">S</span>
                    <span class="habit-day-label">D</span>
                </div>
                ${puntosHTML}
            </div>
        `;
        contenedor.appendChild(item);
    });

    // Inyección del Input Inline Limpio si está en modo edición
    if (modoEdicionHabitos) {
        const divInline = document.createElement('div');
        divInline.className = "input-inline-container";
        
        const inputHab = document.createElement('input');
        inputHab.type = "text";
        inputHab.placeholder = "+ Escribe un nuevo hábito y presiona Enter...";
        inputHab.onkeydown = (e) => {
            if (e.key === 'Enter') {
                guardarNuevoHabitoInline(e.target.value.trim());
            }
        };
        
        divInline.appendChild(inputHab);
        contenedor.appendChild(divInline);
        inputHab.focus();
    }
}

function guardarNuevoHabitoInline(nombre) {
    if (nombre === "") return;
    const clave = obtenerClaveMes();
    let habitos = JSON.parse(localStorage.getItem(clave)) || [];
    habitos.push({ id: 'hab_' + Date.now(), nombre, completados: [] });
    localStorage.setItem(clave, JSON.stringify(habitos));
    cargarHabitos();
}

function alternarDiaHabito(id, dia) {
    if (modoEdicionHabitos) return; // Evitar clicks accidentales editando
    const clave = obtenerClaveMes();
    let habitos = JSON.parse(localStorage.getItem(clave)) || [];
    habitos = habitos.map(h => {
        if (h.id === id) {
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
    const clave = obtenerClaveMes();
    let habitos = JSON.parse(localStorage.getItem(clave)) || [];
    habitos = habitos.filter(h => h.id !== id);
    localStorage.setItem(clave, JSON.stringify(habitos));
    cargarHabitos();
}

function obtenerClaveMes() {
    const fecha = new Date();
    return `journal_habits_${fecha.getFullYear()}_${fecha.getMonth() + 1}`;
}


/* --- TO-DO LIST CORREGIDA COMPLETAMENTE --- */
const optEditTodo = document.getElementById('opt-edit-todo');
if (optEditTodo) {
    optEditTodo.onclick = (e) => {
        e.stopPropagation();
        modoEdicionTodo = !modoEdicionTodo;
        cargarTareas();
    };
}

const inputTodoElement = document.getElementById('todo-tarea');
if (inputTodoElement) {
    inputTodoElement.onkeydown = (e) => {
        if (e.key === 'Enter') guardarTarea(e.target.value.trim());
    };
}

function cargarTareas() {
    const tareas = JSON.parse(localStorage.getItem('journal_todo')) || [];
    const lista = document.getElementById('lista-tareas');
    if(!lista) return;

    lista.innerHTML = "";
    tareas.forEach((tarea, index) => {
        const li = document.createElement('li');
        li.className = `todo-item ${tarea.completada ? 'done' : ''}`;
        
        li.innerHTML = `
            <div class="todo-check ${tarea.completada ? 'active' : ''}"></div>
            <span>${tarea.texto}</span>
            ${modoEdicionTodo ? `<button class="btn-delete-meta" onclick="event.stopPropagation(); borrarTarea(${index})">×</button>` : ''}
        `;

        if (!modoEdicionTodo) {
            li.onclick = () => alternarTarea(index);
        }
        lista.appendChild(li);
    });

    const container = document.getElementById('input-container-todo');
    if (modoEdicionTodo) {
        container.classList.remove('hidden');
        document.getElementById('todo-tarea').focus();
    } else {
        container.classList.add('hidden');
    }
}

function guardarTarea(texto) {
    if (texto === "") return;
    let tareas = JSON.parse(localStorage.getItem('journal_todo')) || [];
    tareas.push({ texto: texto, completada: false });
    localStorage.setItem('journal_todo', JSON.stringify(tareas));
    document.getElementById('todo-tarea').value = "";
    cargarTareas();
}

function alternarTarea(index) {
    let tareas = JSON.parse(localStorage.getItem('journal_todo')) || [];
    if(tareas[index]) {
        tareas[index].completada = !tareas[index].completada;
        localStorage.setItem('journal_todo', JSON.stringify(tareas));
        cargarTareas();
    }
}

function borrarTarea(index) {
    let tareas = JSON.parse(localStorage.getItem('journal_todo')) || [];
    tareas.splice(index, 1);
    localStorage.setItem('journal_todo', JSON.stringify(tareas));
    cargarTareas();
}


/* --- AGENDA SEMANAL REPARADA --- */
const optEditAgenda = document.getElementById('opt-edit-agenda');
if (optEditAgenda) {
    optEditAgenda.onclick = (e) => {
        e.stopPropagation();
        modoEdicionAgenda = !modoEdicionAgenda;
        renderizarSemana();
    };
}

const inputAgendaTarea = document.getElementById('agenda-tarea');
if(inputAgendaTarea) {
    inputAgendaTarea.onkeydown = (e) => {
        if (e.key === 'Enter') guardarEventoAgenda();
    };
}

function obtenerLunes(d) {
    d = new Date(d);
    let day = d.getDay(), diff = d.getDate() - day + (day == 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function renderizarSemana() {
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
        let eventosHTML = "";

        eventos.forEach((ev, idx) => {
            eventosHTML += `
                <div class="agenda-evento ${ev.done ? 'completado' : ''}" onclick="event.stopPropagation(); alternarEventoAgenda('${isoFecha}', ${idx})">
                    <span>${ev.hora ? `<b>${ev.hora}</b> ` : ''}${ev.tarea}</span>
                    ${modoEdicionAgenda ? `<button class="btn-delete-meta" onclick="event.stopPropagation(); borrarEventoAgenda('${isoFecha}', ${idx})">×</button>` : ''}
                </div>
            `;
        });

        const divDia = document.createElement('div');
        divDia.className = "agenda-dia-col";
        divDia.innerHTML = `
            <div class="agenda-dia-header">
                <span class="nombre-dia">${nombresDias[i]}</span>
                <span class="numero-dia">${diaF.getDate()}</span>
            </div>
            <div class="agenda-eventos-lista">${eventosHTML}</div>
        `;

        if (modoEdicionAgenda) {
            divDia.onclick = () => abrirEditorAgendaInline(isoFecha);
        }
        contenedor.appendChild(divDia);
    }

    const containerInput = document.getElementById('input-container-agenda');
    if (!modoEdicionAgenda && containerInput) containerInput.classList.add('hidden');
}

function abrirEditorAgendaInline(fecha) {
    const container = document.getElementById('input-container-agenda');
    document.getElementById('agenda-fecha').value = fecha;
    document.getElementById('agenda-tarea').value = "";
    document.getElementById('agenda-hora').value = "";
    if(container) container.classList.remove('hidden');
    document.getElementById('agenda-tarea').focus();
}

function guardarEventoAgenda() {
    const tarea = document.getElementById('agenda-tarea').value.trim();
    const fecha = document.getElementById('agenda-fecha').value;
    const hora = document.getElementById('agenda-hora').value;

    if (tarea && fecha) {
        let evs = JSON.parse(localStorage.getItem(`agenda_${fecha}`)) || [];
        evs.push({ tarea, hora, done: false });
        localStorage.setItem(`agenda_${fecha}`, JSON.stringify(evs));
        document.getElementById('agenda-tarea').value = "";
        document.getElementById('input-container-agenda').classList.add('hidden');
        renderizarSemana();
    }
}

function alternarEventoAgenda(fecha, idx) {
    let evs = JSON.parse(localStorage.getItem(`agenda_${fecha}`)) || [];
    if(evs[idx]) {
        evs[idx].done = !evs[idx].done;
        localStorage.setItem(`agenda_${fecha}`, JSON.stringify(evs));
        renderizarSemana();
    }
}

function borrarEventoAgenda(fecha, idx) {
    let evs = JSON.parse(localStorage.getItem(`agenda_${fecha}`)) || [];
    evs.splice(idx, 1);
    localStorage.setItem(`agenda_${fecha}`, JSON.stringify(evs));
    renderizarSemana();
}

function navegarSemana(dias) {
    fechaActualAgenda.setDate(fechaActualAgenda.getDate() + dias);
    renderizarSemana();
}


/* --- CICLO MENSTRUAL Y RUEDA CORREGIDA --- */
function obtenerFechaInicioCiclo(registros, hoyStr) {
    const fechaBase = new Date("2026-04-30T00:00:00");
    const hoy = new Date(hoyStr + "T00:00:00");
    if (hoy < fechaBase) return fechaBase;
    
    const diferenciaMilisegundos = hoy - fechaBase;
    const diasTranscurridos = Math.floor(diferenciaMilisegundos / (1000 * 60 * 60 * 24));
    const ciclosCompletos = Math.floor(diasTranscurridos / 28);
    
    let inicioCicloActual = new Date(fechaBase);
    inicioCicloActual.setDate(fechaBase.getDate() + (ciclosCompletos * 28));
    return inicioCicloActual;
}

function dibujarRueda() {
    const contenedor = document.getElementById('canvas-rueda');
    if (!contenedor) return;

    contenedor.querySelectorAll('.punto-dia').forEach(p => p.remove());
    const registros = JSON.parse(localStorage.getItem('ciclo_logs')) || {};
    
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    const hoyStr = hoy.toISOString().split('T')[0];
    
    const inicioCiclo = obtenerFechaInicioCiclo(registros, hoyStr);
    const radio = 145; 

    for (let i = 0; i < 28; i++) {
        let fechaActual = new Date(inicioCiclo);
        fechaActual.setDate(inicioCiclo.getDate() + i);
        let iso = fechaActual.toISOString().split('T')[0];
        let reg = registros[iso];

        const div = document.createElement('div');
        div.className = 'punto-dia';
        
        let angulo = (i * (360 / 28) - 90) * (Math.PI / 180);
        let x = radio * Math.cos(angulo);
        let y = radio * Math.sin(angulo);
        div.style.left = `calc(50% + ${x}px - 22px)`;
        div.style.top = `calc(50% + ${y}px - 22px)`;

        let iconoLuna = obtenerIconoLuna(fechaActual);
        div.innerHTML = `<span>${iconoLuna}</span><small>${fechaActual.getDate()}</small>`;
        
        const dotContainer = document.createElement('div');
        dotContainer.className = 'dot-container';

        if (reg && reg.sangrado && reg.sangrado !== "") {
            const dotSangre = document.createElement('div');
            dotSangre.className = 'indicador-sangre';
            dotContainer.appendChild(dotSangre);
        }

        if (iso === hoyStr) {
            const dotHoy = document.createElement('div');
            dotHoy.className = 'indicador-hoy';
            dotContainer.appendChild(dotHoy);
            
            const txtDia = document.getElementById('txt-dia-ciclo');
            const txtFecha = document.getElementById('txt-fecha-ciclo');
            if (txtDia) txtDia.textContent = `Día ${i + 1}`;
            if (txtFecha) txtFecha.textContent = `${fechaActual.getDate()}/${fechaActual.getMonth() + 1}`;
        }

        div.appendChild(dotContainer);
        div.onclick = (e) => { e.stopPropagation(); abrirRegistro(iso, !reg); };
        contenedor.appendChild(div);
    }
    
    const labelInicio = document.getElementById('txt-inicio-ciclo-label');
    if (labelInicio) {
        labelInicio.textContent = `Ciclo actual iniciado el: ${inicioCiclo.getDate()}/${inicioCiclo.getMonth() + 1}/${inicioCiclo.getFullYear()}`;
    }
}

function abrirRegistro(fecha, forzarEdicion = false) {
    const modal = document.getElementById('modal-registro');
    if (!modal) return;
    
    document.getElementById('reg-fecha').value = fecha;
    const registros = JSON.parse(localStorage.getItem('ciclo_logs')) || {};
    const datos = registros[fecha];

    document.getElementById('reg-sangrado').value = datos?.sangrado || "";
    document.getElementById('reg-dolor').value = datos?.dolor || "";
    document.getElementById('reg-energia').value = datos?.energia || "media";
    document.getElementById('reg-animo').value = datos?.animo || "calma";
    document.getElementById('reg-observaciones').value = datos?.observaciones || "";

    modal.classList.remove('hidden');
    alternarModoEdicionTarjeta(forzarEdicion);
}

function alternarModoEdicionTarjeta(enModoEdicion) {
    const campos = ['reg-sangrado', 'reg-dolor', 'reg-energia', 'reg-animo', 'reg-observaciones'];
    campos.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = !enModoEdicion;
    });

    const btnGuardar = document.getElementById('btn-guardar-reg');
    const btnModificar = document.getElementById('btn-modificar-reg');

    if (enModoEdicion) {
        if(btnGuardar) btnGuardar.classList.remove('hidden');
        if(btnModificar) btnModificar.classList.add('hidden');
    } else {
        if(btnGuardar) btnGuardar.classList.add('hidden');
        if(btnModificar) btnModificar.classList.remove('hidden');
    }
}

function guardarRegistro() {
    const fecha = document.getElementById('reg-fecha').value;
    if (!fecha) return;
    
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
}

function obtenerIconoLuna(f) {
    const lunas = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
    const ciclo = 29.53;
    const base = new Date("2024-01-11");
    const diff = (f - base) / 86400000;
    const pos = (diff % ciclo + ciclo) % ciclo;
    return lunas[Math.floor((pos / ciclo) * 8)] || "🌙";
}


/* --- SISTEMA DE PIN Y SEGURIDAD --- */
function actualizarInterfazPin() {
    for (let i = 1; i <= 4; i++) {
        const slot = document.getElementById(`slot-${i}`);
        if (slot) i <= pinIngresado.length ? slot.classList.add('filled') : slot.classList.remove('filled');
    }
}

function validarPin() {
    if (pinIngresado === PIN_CORRECTO) {
        document.getElementById('lock-screen').style.display = 'none';
        pinIngresado = ""; 
    } else {
        alert("PIN Incorrecto.");
        pinIngresado = "";
        actualizarInterfazPin();
    }
}


/* --- NAVEGACIÓN Y CONFIGURACIÓN --- */
function navegar(pantalla) { location.hash = pantalla; }
window.addEventListener('hashchange', () => {
    const pantalla = location.hash.replace('#', '') || 'menu';
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const vistaDestino = document.getElementById(`view-${pantalla}`);
    if (vistaDestino) vistaDestino.classList.add('active');
    window.scrollTo(0, 0);
});
if (!location.hash) location.hash = 'menu';

function cambiarTema() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('journalDarkMode', document.body.classList.contains('dark-mode'));
}
if (localStorage.getItem('journalDarkMode') === 'true') document.body.classList.add('dark-mode');

function cambiarColorAcento(e) {
    const color = e.target.value;
    document.documentElement.style.setProperty('--accent-color', color);
    localStorage.setItem('journalAccentColor', color);
}
const colorGuardado = localStorage.getItem('journalAccentColor');
if (colorGuardado) document.documentElement.style.setProperty('--accent-color', colorGuardado);

function cambiarPinAction() {
    const nuevoPin = prompt("Nuevo PIN de 4 dígitos:");
    if (nuevoPin && nuevoPin.length === 4 && !isNaN(nuevoPin)) {
        localStorage.setItem('journalPin', nuevoPin);
        alert("PIN actualizado.");
    } else {
        alert("PIN no válido.");
    }
}

function exportarDatos() {
    const blob = new Blob([JSON.stringify(localStorage)], { type: "application/json" });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `backup_journal.json`;
    a.click();
}

function importarDatos(e) {
    const archivo = e.target.files[0];
    if (!archivo) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const datos = JSON.parse(e.target.result);
            Object.keys(datos).forEach(key => localStorage.setItem(key, datos[key]));
            alert("Backup cargado con éxito.");
            location.reload();
        } catch (err) { alert("Error al importar."); }
    };
    reader.readAsText(archivo);
}