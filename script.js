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

// Aseguramos estados definidos desde el arranque
let modoEdicionActivo = false;
let metaEditandoIndex = null;
let modoEdicionHabitos = false;
let habitoEditandoId = null;
let modoEdicionAgenda = false;
let eventoEditando = null; // Declarada por seguridad para Agenda
let modoEdicionTodo = false; // Declarada por seguridad para TODO
let todoEditandoIndex = null;

/* --- AL CARGAR EL DOCUMENTO (DOM) --- */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inyectar el año dinámico
    const labelAnio = document.getElementById('year-label');
    if (labelAnio) {
        labelAnio.textContent = new Date().getFullYear();
    }

    // 2. Configurar el Teclado Numérico
    document.querySelectorAll('.num-btn[data-val]').forEach(boton => {
        boton.addEventListener('click', () => {
            if (pinIngresado.length < 4) {
                pinIngresado += boton.getAttribute('data-val');
                actualizarInterfazPin();
            }
        });
    });

    // 3. Botones de control del PIN
    const btnClear = document.getElementById('btn-clear');
    if(btnClear) btnClear.addEventListener('click', () => {
        pinIngresado = "";
        actualizarInterfazPin();
    });

    const btnEnter = document.getElementById('btn-enter');
    if(btnEnter) btnEnter.addEventListener('click', validarPin);

    // 4. Configurar Navegación del Menú (Escuchadores)
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

    // 5. Estado inicial en el historial
    history.replaceState({ page: 'menu' }, "", "");

    // Escuchadores para Configuración de forma segura
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

    // Inicializaciones de arranque al cargar el DOM
    cargarMetas();
    cargarHabitos();
    renderizarSemana();
    dibujarRueda();
}); // <--- ¡AQUÍ ESTÁ LA LLAVE CORRECTA QUE FALTABA PARA CERRAR EL DOMContentLoaded!


/* --- ESCUCHADORES DE METAS --- */
document.addEventListener('click', (e) => {
    const listaMetas = document.getElementById('lista-metas');
    const inputContainerMeta = document.getElementById('input-container-meta');
    const optEditMetas = document.getElementById('opt-edit-metas');

    if (modoEdicionActivo) {
        const clicFueraLista = listaMetas && !listaMetas.contains(e.target);
        const clicFueraInput = inputContainerMeta && !inputContainerMeta.contains(e.target);
        const clicFueraBotonEditar = optEditMetas && !optEditMetas.contains(e.target);

        if (clicFueraLista && clicFueraInput && clicFueraBotonEditar) {
            const val = document.getElementById('input-nueva-meta').value.trim();
            if (val !== "") {
                guardarMeta(val, true); 
            } else {
                modoEdicionActivo = false;
                metaEditandoIndex = null;
                if(inputContainerMeta) inputContainerMeta.classList.add('hidden');
                cargarMetas();
            }
        }
    }
});

const optEditMetas = document.getElementById('opt-edit-metas');
if (optEditMetas) {
    optEditMetas.onclick = (e) => {
        e.stopPropagation();
        const val = document.getElementById('input-nueva-meta').value.trim();
        if (modoEdicionActivo && val !== "") {
            guardarMeta(val, true);
            return;
        }
        modoEdicionActivo = !modoEdicionActivo;
        metaEditandoIndex = null;
        const inputContainerMeta = document.getElementById('input-container-meta');
        if(!modoEdicionActivo && inputContainerMeta) {
            inputContainerMeta.classList.add('hidden');
        }
        cargarMetas();
    };
}

const optHistorialMetas = document.getElementById('opt-historial-metas');
if (optHistorialMetas) {
    optHistorialMetas.onclick = (e) => {
        e.stopPropagation();
        console.log("Abriendo historial...");
    };
}

const inputNuevaMeta = document.getElementById('input-nueva-meta');
if (inputNuevaMeta) {
    inputNuevaMeta.onkeydown = (e) => {
        if (e.key === 'Enter') {
            guardarMeta(e.target.value.trim(), false); 
        }
        if (e.key === 'Escape') {
            modoEdicionActivo = false;
            metaEditandoIndex = null;
            document.getElementById('input-container-meta').classList.add('hidden');
            cargarMetas();
        }
    };
}


/* --- ESCUCHADORES DE HÁBITOS --- */
document.addEventListener('click', (e) => {
    const contenedorHabitos = document.getElementById('contenedor-habitos');
    const inputContainer = document.getElementById('input-container-habito');
    const optEditHab = document.getElementById('opt-edit-habitos');

    if (modoEdicionHabitos) {
        const clicFueraGrid = contenedorHabitos && !contenedorHabitos.contains(e.target);
        const clicFueraInput = inputContainer && !inputContainer.contains(e.target);
        const clicFueraBotonEditar = optEditHab && !optEditHab.contains(e.target);

        if (clicFueraGrid && clicFueraInput && clicFueraBotonEditar) {
            const val = document.getElementById('input-nuevo-habito').value.trim();
            if (val !== "") {
                guardarHabito(); 
            } else {
                modoEdicionHabitos = false;
                habitoEditandoId = null;
                if(inputContainer) inputContainer.classList.add('hidden');
                cargarHabitos();
            }
        }
    }
});

const optEditHab = document.getElementById('opt-edit-habitos');
if (optEditHab) {
    optEditHab.onclick = (e) => {
        e.stopPropagation();
        modoEdicionHabitos = !modoEdicionHabitos;
        cargarHabitos();
    };
}

const optHistHab = document.getElementById('opt-historial-habitos');
if (optHistHab) {
    optHistHab.onclick = (e) => {
        e.stopPropagation();
        toggleHistorialHabitos();
    };
}

const inputNuevoHabito = document.getElementById('input-nuevo-habito');
if (inputNuevoHabito) {
    inputNuevoHabito.onkeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            guardarHabito();
        }
        if (e.key === 'Escape') {
            modoEdicionHabitos = false;
            document.getElementById('input-container-habito').classList.add('hidden');
            cargarHabitos();
        }
    };
}


/* --- ESCUCHADORES AGENDA --- */
const optEditAgenda = document.getElementById('opt-edit-agenda');
document.addEventListener('click', (e) => {
    const grid = document.getElementById('semana-container');
    const inputCont = document.getElementById('input-container-agenda');
    const btnEditFloat = document.getElementById('opt-edit-agenda');

    if (modoEdicionAgenda) {
        const clicFueraGrid = grid && !grid.contains(e.target);
        const clicFueraFormulario = inputCont && !inputCont.contains(e.target);
        const clicFueraBotonEdit = btnEditFloat && !btnEditFloat.contains(e.target);

        if (clicFueraGrid && clicFueraFormulario && clicFueraBotonEdit) {
            const tareaTexto = document.getElementById('agenda-tarea').value.trim();
            if (tareaTexto !== "") {
                guardarEventoAgenda(); 
            } else {
                modoEdicionAgenda = false;
                cerrarEditorAgenda();
                renderizarSemana();
            }
        }
    }
});

if (optEditAgenda) {
    optEditAgenda.onclick = (e) => {
        e.stopPropagation();
        const inputCont = document.getElementById('input-container-agenda');
        if (modoEdicionAgenda && inputCont && !inputCont.classList.contains('hidden')) {
            const tareaTexto = document.getElementById('agenda-tarea').value.trim();
            if(tareaTexto !== "") {
                guardarEventoAgenda();
                return;
            }
        }
        modoEdicionAgenda = !modoEdicionAgenda;
        if (!modoEdicionAgenda) cerrarEditorAgenda();
        renderizarSemana();
    };
}

const optLimpiarAgenda = document.getElementById('opt-limpiar-completados-agenda');
if (optLimpiarAgenda) {
    optLimpiarAgenda.onclick = (e) => {
        e.stopPropagation();
        limpiarAgendaCompletada();
    };
}

const btnSemanaPrev = document.getElementById('btn-semana-prev');
if(btnSemanaPrev) btnSemanaPrev.onclick = () => navegarSemana(-7);

const btnSemanaNext = document.getElementById('btn-semana-next');
if(btnSemanaNext) btnSemanaNext.onclick = () => navegarSemana(7);

const inputContAgenda = document.getElementById('input-container-agenda');
if(inputContAgenda) {
    inputContAgenda.onkeydown = (e) => {
        if (e.key === 'Escape') {
            modoEdicionAgenda = false;
            cerrarEditorAgenda();
            renderizarSemana();
        }
    };
}

// --- GESTOS DESLIZAR ---
let touchStartX = 0;
let touchEndX = 0;
const agendaGrid = document.getElementById('semana-container');
if (agendaGrid) {
    agendaGrid.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    agendaGrid.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        manejarGestoAgenda();
    }, { passive: true });
}

function manejarGestoAgenda() {
    const umbral = 60; 
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
    if (touchStartX - touchEndX > umbral) navegarSemana(7);
    else if (touchEndX - touchStartX > umbral) navegarSemana(-7);
}


/* --- ESCUCHADORES DEL CICLO LUNAR --- */
const modalRegistro = document.getElementById('modal-registro');
const optAddReg = document.getElementById('opt-add-registro');
const optVerCiclos = document.getElementById('opt-ver-ciclos');
const btnModificarReg = document.getElementById('btn-modificar-reg');
const regFechaInput = document.getElementById('reg-fecha');

document.addEventListener('click', (e) => {
    if (e.target === modalRegistro) {
        modalRegistro.classList.add('hidden');
    }
});

if(optAddReg) {
    optAddReg.onclick = (e) => {
        e.stopPropagation();
        const hoyIso = new Date().toISOString().split('T')[0];
        abrirRegistro(hoyIso);
    };
}

if (optVerCiclos) {
    optVerCiclos.onclick = (e) => {
        e.stopPropagation();
        if (typeof mostrarHistorialCiclos === 'function') mostrarHistorialCiclos();
        else alert("Función 'Ciclos Anteriores' en desarrollo.");
    };
}

if (regFechaInput) {
    regFechaInput.onchange = (e) => {
        abrirRegistro(e.target.value);
    };
}

if (btnModificarReg) {
    btnModificarReg.onclick = () => {
        alternarModoEdicionTarjeta(true);
    };
}

const btnSaveReg = document.getElementById('btn-guardar-reg');
if(btnSaveReg) btnSaveReg.onclick = guardarRegistro;

const btnCancelReg = document.getElementById('btn-cancelar-reg');
if(btnCancelReg) btnCancelReg.onclick = () => modalRegistro.classList.add('hidden');


/* --- FUNCIONES DE SEGURIDAD --- */
function actualizarInterfazPin() {
    for (let i = 1; i <= 4; i++) {
        const slot = document.getElementById(`slot-${i}`);
        if (slot) {
            i <= pinIngresado.length ? slot.classList.add('filled') : slot.classList.remove('filled');
        }
    }
}

function validarPin() {
    if (pinIngresado === PIN_CORRECTO) {
        document.getElementById('lock-screen').style.display = 'none';
        pinIngresado = ""; 
    } else {
        alert("PIN Incorrecto. Intenta de nuevo.");
        pinIngresado = "";
        actualizarInterfazPin();
    }
}


/* --- NAVEGACIÓN POR GESTOS --- */
window.addEventListener('hashchange', () => {
    const pantalla = location.hash.replace('#', '') || 'menu';
    ejecutarCambioVisual(pantalla);
});

function navegar(pantalla) {
    location.hash = pantalla;
}

function ejecutarCambioVisual(pantalla) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const vistaDestino = document.getElementById(`view-${pantalla}`);
    if (vistaDestino) {
        vistaDestino.classList.add('active');
        if (pantalla === 'menu') {
            const labelAnio = document.getElementById('year-label');
            if (labelAnio) labelAnio.textContent = new Date().getFullYear();
        }
    }
    window.scrollTo(0, 0);
}

if (!location.hash) {
    location.hash = 'menu';
} else {
    ejecutarCambioVisual(location.hash.replace('#', ''));
}


/* --- MODO OSCURO --- */
function cambiarTema() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('journalDarkMode', document.body.classList.contains('dark-mode'));
}
if (localStorage.getItem('journalDarkMode') === 'true') {
    document.body.classList.add('dark-mode');
}


/* --- FUNCIONES DE CONFIGURACIÓN --- */
function cambiarColorAcento(e) {
    const color = e.target.value;
    document.documentElement.style.setProperty('--accent-color', color);
    localStorage.setItem('journalAccentColor', color);
}

const colorGuardado = localStorage.getItem('journalAccentColor');
if (colorGuardado) {
    document.documentElement.style.setProperty('--accent-color', colorGuardado);
    setTimeout(() => { if(document.getElementById('color-picker')) document.getElementById('color-picker').value = colorGuardado; }, 100);
}

function cambiarPinAction() {
    const nuevoPin = prompt("Introduce tu nuevo PIN de 4 dígitos:");
    if (nuevoPin && nuevoPin.length === 4 && !isNaN(nuevoPin)) {
        localStorage.setItem('journalPin', nuevoPin);
        alert("PIN actualizado correctamente.");
    } else {
        alert("PIN no válido. Debe ser de 4 números.");
    }
}

function exportarDatos() {
    const datos = JSON.stringify(localStorage);
    const blob = new Blob([datos], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_journal_${new Date().toISOString().slice(0,10)}.json`;
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
            alert("Copia de seguridad cargada. La app se reiniciará.");
            location.reload();
        } catch (err) {
            alert("Error al leer el archivo de copia.");
        }
    };
    reader.readAsText(archivo);
}


/* --- FUNCIONES DE METAS --- */
function cargarMetas() {
    const anio = new Date().getFullYear();
    const metas = JSON.parse(localStorage.getItem(`journal_metas_${anio}`)) || [];
    const lista = document.getElementById('lista-metas');
    const labelAnio = document.getElementById('meta-year-label');
    const inputContainer = document.getElementById('input-container-meta');
    
    if(labelAnio) labelAnio.textContent = anio;
    if(!lista) return;

    lista.innerHTML = "";
    metas.forEach((m, index) => {
        const li = document.createElement('li');
        li.className = `meta-item ${m.completada ? 'completed' : ''}`;
        
        if (modoEdicionActivo && metaEditandoIndex === index) {
            li.classList.add('editando');
        }

        const span = document.createElement('span');
        span.textContent = m.texto;
        li.appendChild(span);

        if (modoEdicionActivo) {
            const btnDel = document.createElement('button');
            btnDel.className = "btn-delete-meta";
            btnDel.textContent = "×";
            btnDel.onclick = (e) => {
                e.stopPropagation();
                borrarMetaDirecto(index);
            };
            li.appendChild(btnDel);
            
            li.onclick = (e) => {
                e.stopPropagation();
                prepararEdicion(index, m.texto);
            };
        } else {
            li.onclick = () => {
                m.completada = !m.completada;
                localStorage.setItem(`journal_metas_${anio}`, JSON.stringify(metas));
                cargarMetas();
            };
        }
        lista.appendChild(li);
    });

    if (modoEdicionActivo && metaEditandoIndex === null) {
        const liNueva = document.createElement('li');
        liNueva.className = "add-trigger-area";
        liNueva.textContent = "+ Añadir nueva meta...";
        liNueva.onclick = (e) => {
            e.stopPropagation();
            activarEscrituraMeta();
        };
        lista.appendChild(liNueva);
    }

    if (!modoEdicionActivo && inputContainer) {
        inputContainer.classList.add('hidden');
    }
}

function activarEscrituraMeta() {
    metaEditandoIndex = null;
    const inputContainer = document.getElementById('input-container-meta');
    const inputField = document.getElementById('input-nueva-meta');
    
    if(inputContainer) inputContainer.classList.remove('hidden');
    if(inputField) {
        inputField.value = "";
        inputField.focus();
    }
}

function prepararEdicion(index, textoActual) {
    metaEditandoIndex = index;
    const inputContainer = document.getElementById('input-container-meta');
    const inputField = document.getElementById('input-nueva-meta');
    
    if(inputContainer) inputContainer.classList.remove('hidden');
    if(inputField) {
        inputField.value = textoActual;
        inputField.focus();
    }
    cargarMetas();
}

function guardarMeta(texto, forzarCierreModo = false) {
    if (texto === "") return;
    const anio = new Date().getFullYear();
    let metas = JSON.parse(localStorage.getItem(`journal_metas_${anio}`)) || [];

    if (metaEditandoIndex !== null) {
        metas[metaEditandoIndex].texto = texto;
    } else {
        metas.push({ texto: texto, completada: false });
    }

    localStorage.setItem(`journal_metas_${anio}`, JSON.stringify(metas));
    
    document.getElementById('input-nueva-meta').value = "";
    document.getElementById('input-container-meta').classList.add('hidden');
    metaEditandoIndex = null;

    if (forzarCierreModo) {
        modoEdicionActivo = false;
    }
    cargarMetas();
}

function borrarMetaDirecto(index) {
    const anio = new Date().getFullYear();
    let metas = JSON.parse(localStorage.getItem(`journal_metas_${anio}`)) || [];
    metas.splice(index, 1);
    localStorage.setItem(`journal_metas_${anio}`, JSON.stringify(metas));
    
    metaEditandoIndex = null;
    document.getElementById('input-container-meta').classList.add('hidden');
    cargarMetas();
}


/* --- FUNCIONES DE HÁBITOS --- */
function obtenerClaveMes(offsetAnio = 0, offsetMes = 0) {
    const fecha = new Date();
    let d = new Date(fecha.getFullYear() + offsetAnio, fecha.getMonth() + offsetMes, 1);
    return `journal_habits_${d.getFullYear()}_${d.getMonth() + 1}`;
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
        item.className = `habit-item ${habitoEditandoId === habito.id ? 'editando' : ''}`;
        
        let puntosHTML = "";
        for (let i = 1; i < primerDiaSemana; i++) {
            puntosHTML += `<div class="habit-dot-spacer"></div>`;
        }

        for (let d = 1; d <= diasEnMes; d++) {
            const isChecked = habito.completados && habito.completados.includes(d) ? 'checked' : '';
            puntosHTML += `
                <div class="habit-dot-wrapper" onclick="event.stopPropagation(); alternarDiaHabito('${habito.id}', ${d})">
                    <div class="habit-dot ${isChecked}"></div>
                    <span class="dot-day">${d}</span>
                </div>`;
        }

        item.innerHTML = `
            <div class="habit-header">
                <span class="habit-name">${habito.nombre}</span>
                ${modoEdicionHabitos ? `<button class="btn-delete-habit" onclick="event.stopPropagation(); borrarHabito('${habito.id}')">×</button>` : ''}
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

        if (modoEdicionHabitos) {
            item.onclick = () => prepararEdicionHabito(habito);
        }
        contenedor.appendChild(item);
    });

    if (modoEdicionHabitos) {
        const divAdd = document.createElement('div');
        divAdd.className = "add-trigger-area";
        divAdd.style.textAlign = "center";
        divAdd.style.padding = "15px";
        divAdd.style.border = "1px dashed rgba(0,0,0,0.2)";
        divAdd.style.borderRadius = "12px";
        divAdd.style.cursor = "pointer";
        divAdd.textContent = "+ Añadir nuevo hábito...";
        divAdd.onclick = () => activarEscrituraHabito();
        contenedor.appendChild(divAdd);
    }
}

function toggleHistorialHabitos() {
    const contenedor = document.getElementById('historial-habitos-container');
    const btn = document.getElementById('opt-historial-habitos');
    if(!contenedor || !btn) return;

    contenedor.classList.toggle('hidden');
    if(!contenedor.classList.contains('hidden')) {
        btn.textContent = "Ocultar Historial";
        contenedor.innerHTML = "<p style='text-align:center; opacity:0.5; padding:10px;'>Historial de meses anteriores</p>";
    } else {
        btn.textContent = "Ver Historial";
    }
}


/* --- TAREAS (TODO) --- */
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
        `;

        li.onclick = (e) => {
            e.stopPropagation(); 
            if (modoEdicionTodo) {
                if (typeof prepararEdicionTodo === 'function') prepararEdicionTodo(index, tarea.texto);
            } else {
                if (typeof alternarTarea === 'function') alternarTarea(index);
            }
        };
        lista.appendChild(li);
    });

    if (!modoEdicionTodo) {
        const containerInput = document.getElementById('input-container-todo');
        if(containerInput) containerInput.classList.add('hidden');
        todoEditandoIndex = null;
    }
}


/* --- AGENDA --- */
function guardarEventoAgenda() {
    const tarea = document.getElementById('agenda-tarea').value.trim();
    const fecha = document.getElementById('agenda-fecha').value;
    const hora = document.getElementById('agenda-hora').value;

    if (tarea && fecha) {
        if (eventoEditando) {
            let evsViejos = JSON.parse(localStorage.getItem(`agenda_${eventoEditando.fecha}`));
            if(evsViejos) {
                evsViejos.splice(eventoEditando.index, 1);
                localStorage.setItem(`agenda_${eventoEditando.fecha}`, JSON.stringify(evsViejos));
            }
        }
        
        const evsDestino = JSON.parse(localStorage.getItem(`agenda_${fecha}`)) || [];
        evsDestino.push({ tarea, hora, done: false });
        localStorage.setItem(`agenda_${fecha}`, JSON.stringify(evsDestino));
        
        modoEdicionAgenda = false; 
        if (typeof cerrarEditorAgenda === 'function') cerrarEditorAgenda();
        if (typeof renderizarSemana === 'function') renderizarSemana();
    }
}


/* --- FUNCIONES DEL CICLO LUNAR --- */
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
    
    const labelInicio = document.getElementById('txt-inicio-ciclo-label');
    if (labelInicio) {
        labelInicio.textContent = `Ciclo iniciado el: ${inicioCiclo.getDate()}/${inicioCiclo.getMonth() + 1}/${inicioCiclo.getFullYear()}`;
    }

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

        let iconoLuna = typeof obtenerIconoLuna === 'function' ? obtenerIconoLuna(fechaActual) : "🌙";
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

        div.onclick = (e) => {
            e.stopPropagation();
            if (reg) {
                abrirRegistro(iso, false);
            } else {
                if (confirm("Aún no tienes registro de este día. ¿Deseas registrar?")) {
                    abrirRegistro(iso, true); 
                }
            }
        };
        contenedor.appendChild(div);
    }
}

function abrirRegistro(fecha, forzarEdicion = false) {
    const modal = document.getElementById('modal-registro');
    if (!modal) return;
    
    const inputFecha = document.getElementById('reg-fecha');
    if (inputFecha) inputFecha.value = fecha;

    const registros = JSON.parse(localStorage.getItem('ciclo_logs')) || {};
    const datos = registros[fecha];

    const fSangrado = document.getElementById('reg-sangrado');
    const fDolor = document.getElementById('reg-dolor');
    const fEnergia = document.getElementById('reg-energia');
    const fAnimo = document.getElementById('reg-animo');
    const fObservaciones = document.getElementById('reg-observaciones');

    if(fSangrado) fSangrado.value = datos?.sangrado || "";
    if(fDolor) fDolor.value = datos?.dolor || "";
    if(fEnergia) fEnergia.value = datos?.energia || "media";
    if(fAnimo) fAnimo.value = datos?.animo || "calma";
    if(fObservaciones) fObservaciones.value = datos?.observaciones || "";

    modal.classList.remove('hidden');

    if (datos && !forzarEdicion) {
        alternarModoEdicionTarjeta(false); 
    } else {
        alternarModoEdicionTarjeta(true);  
    }
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
    const elFecha = document.getElementById('reg-fecha');
    if (!elFecha) return;
    
    const fecha = elFecha.value;
    const registros = JSON.parse(localStorage.getItem('ciclo_logs')) || {};

    registros[fecha] = {
        sangrado: document.getElementById('reg-sangrado')?.value || "",
        dolor: document.getElementById('reg-dolor')?.value || "",
        energia: document.getElementById('reg-energia')?.value || "media",
        animo: document.getElementById('reg-animo')?.value || "calma",
        observaciones: document.getElementById('reg-observaciones')?.value || ""
    };

    localStorage.setItem('ciclo_logs', JSON.stringify(registros));
    
    const modal = document.getElementById('modal-registro');
    if (modal) modal.classList.add('hidden');
    
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