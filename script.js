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

// Estados globales asegurados
let modoEdicionActivo = false;
let metaEditandoIndex = null;
let modoEdicionHabitos = false;
let habitoEditandoId = null;
let modoEdicionAgenda = false;
let eventoEditando = null; 
let modoEdicionTodo = false; 
let todoEditandoIndex = null;

// Variable de control para la fecha de la Agenda
let fechaActualAgenda = new Date();

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

    // Inicializaciones automáticas de arranque
    cargarMetas();
    cargarHabitos();
    cargarTareas();
    renderizarSemana();
    dibujarRueda();
});


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
        const inputField = document.getElementById('input-nueva-meta');
        const val = inputField ? inputField.value.trim() : "";
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


/* --- ESCUCHADORES TAREAS (TODO) --- */
const optEditTodo = document.getElementById('opt-edit-todo');
if (optEditTodo) {
    optEditTodo.onclick = (e) => {
        e.stopPropagation();
        modoEdicionTodo = !modoEdicionTodo;
        if(modoEdicionTodo) {
            activarEscrituraTodo();
        } else {
            document.getElementById('input-container-todo').classList.add('hidden');
            cargarTareas();
        }
    };
}

const inputNuevaTarea = document.getElementById('input-nueva-tarea');
if (inputNuevaTarea) {
    inputNuevaTarea.onkeydown = (e) => {
        if (e.key === 'Enter') {
            guardarTarea(e.target.value.trim());
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

const btnSemanaPrev = document.getElementById('btn-semana-prev');
if(btnSemanaPrev) btnSemanaPrev.onclick = () => navegarSemana(-7);

const btnSemanaNext = document.getElementById('btn-semana-next');
if(btnSemanaNext) btnSemanaNext.onclick = () => navegarSemana(7);


/* --- ESCUCHADORES DEL CICLO LUNAR --- */
const modalRegistro = document.getElementById('modal-registro');
const optAddReg = document.getElementById('opt-add-registro');
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
        abrirRegistro(hoyIso, true);
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


/* --- NAVEGACIÓN --- */
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


/* --- TEMA Y CONFIGURACIÓN --- */
function cambiarTema() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('journalDarkMode', document.body.classList.contains('dark-mode'));
}
if (localStorage.getItem('journalDarkMode') === 'true') {
    document.body.classList.add('dark-mode');
}

function cambiarColorAcento(e) {
    const color = e.target.value;
    document.documentElement.style.setProperty('--accent-color', color);
    localStorage.setItem('journalAccentColor', color);
}

const colorGuardado = localStorage.getItem('journalAccentColor');
if (colorGuardado) {
    document.documentElement.style.setProperty('--accent-color', colorGuardado);
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

// Inyección segura para evitar colapsos al importar
function importarDatos(e) {
    const archivo = e.target.files[0];
    if (!archivo) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const datos = JSON.parse(e.target.result);
            Object.keys(datos).forEach(key => localStorage.setItem(key, datos[key]));
            alert("Copia de seguridad cargada con éxito.");
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

    if (forzarCierreModo) modoEdicionActivo = false;
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

    if (modoEdicionHabitos && habitoEditandoId === null) {
        const divAdd = document.createElement('div');
        divAdd.className = "add-trigger-area";
        divAdd.textContent = "+ Añadir nuevo hábito...";
        divAdd.onclick = () => activarEscrituraHabito();
        contenedor.appendChild(divAdd);
    }
}

function activarEscrituraHabito() {
    habitoEditandoId = null;
    const container = document.getElementById('input-container-habito');
    const field = document.getElementById('input-nuevo-habito');
    if(container) container.classList.remove('hidden');
    if(field) {
        field.value = "";
        field.focus();
    }
}

function prepararEdicionHabito(habito) {
    habitoEditandoId = habito.id;
    const container = document.getElementById('input-container-habito');
    const field = document.getElementById('input-nuevo-habito');
    if(container) container.classList.remove('hidden');
    if(field) {
        field.value = habito.nombre;
        field.focus();
    }
}

function guardarHabito() {
    const field = document.getElementById('input-nuevo-habito');
    if (!field) return;
    const nombre = field.value.trim();
    if (nombre === "") return;

    const clave = obtenerClaveMes();
    let habitos = JSON.parse(localStorage.getItem(clave)) || [];

    if (habitoEditandoId !== null) {
        habitos = habitos.map(h => h.id === habitoEditandoId ? { ...h, nombre } : h);
    } else {
        habitos.push({ id: 'hab_' + Date.now(), nombre, completados: [] });
    }

    localStorage.setItem(clave, JSON.stringify(habitos));
    field.value = "";
    document.getElementById('input-container-habito').classList.add('hidden');
    habitoEditandoId = null;
    cargarHabitos();
}

function alternarDiaHabito(id, dia) {
    const clave = obtenerClaveMes();
    let habitos = JSON.parse(localStorage.getItem(clave)) || [];
    habitos = habitos.map(h => {
        if (h.id === id) {
            let comps = h.completados || [];
            if (comps.includes(dia)) {
                comps = comps.filter(d => d !== dia);
            } else {
                comps.push(dia);
            }
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
    habitoEditandoId = null;
    document.getElementById('input-container-habito').classList.add('hidden');
    cargarHabitos();
}

function toggleHistorialHabitos() {
    const contenedor = document.getElementById('historial-habitos-container');
    const btn = document.getElementById('opt-historial-habitos');
    if(!contenedor || !btn) return;
    contenedor.classList.toggle('hidden');
    btn.textContent = contenedor.classList.contains('hidden') ? "Ver Historial" : "Ocultar Historial";
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
            ${modoEdicionTodo ? `<button class="btn-delete-meta" onclick="event.stopPropagation(); borrarTarea(${index})">×</button>` : ''}
        `;

        li.onclick = (e) => {
            e.stopPropagation(); 
            if (modoEdicionTodo) {
                prepararEdicionTodo(index, tarea.texto);
            } else {
                alternarTarea(index);
            }
        };
        lista.appendChild(li);
    });

    if (modoEdicionTodo && todoEditandoIndex === null) {
        const liNueva = document.createElement('li');
        liNueva.className = "add-trigger-area";
        liNueva.textContent = "+ Añadir nueva tarea...";
        liNueva.onclick = (e) => {
            e.stopPropagation();
            activarEscrituraTodo();
        };
        lista.appendChild(liNueva);
    }
}

function activarEscrituraTodo() {
    todoEditandoIndex = null;
    const container = document.getElementById('input-container-todo');
    const field = document.getElementById('input-nueva-tarea');
    if(container) container.classList.remove('hidden');
    if(field) {
        field.value = "";
        field.focus();
    }
}

function prepararEdicionTodo(index, texto) {
    todoEditandoIndex = index;
    const container = document.getElementById('input-container-todo');
    const field = document.getElementById('input-nueva-tarea');
    if(container) container.classList.remove('hidden');
    if(field) {
        field.value = texto;
        field.focus();
    }
}

function guardarTarea(texto) {
    if (texto === "") return;
    let tareas = JSON.parse(localStorage.getItem('journal_todo')) || [];

    if (todoEditandoIndex !== null) {
        tareas[todoEditandoIndex].texto = texto;
    } else {
        tareas.push({ texto: texto, completada: false });
    }

    localStorage.setItem('journal_todo', JSON.stringify(tareas));
    document.getElementById('input-nueva-tarea').value = "";
    document.getElementById('input-container-todo').classList.add('hidden');
    todoEditandoIndex = null;
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
    todoEditandoIndex = null;
    document.getElementById('input-container-todo').classList.add('hidden');
    cargarTareas();
}


/* --- AGENDA --- */
function obtenerLunes(d) {
    d = new Date(d);
    let day = d.getDay(),
        diff = d.getDate() - day + (day == 0 ? -6 : 1);
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

        divDia.onclick = () => {
            if (modoEdicionAgenda) {
                abrirEditorAgenda(isoFecha);
            }
        };

        contenedor.appendChild(divDia);
    }
}

function abrirEditorAgenda(fecha, index = null, hora = "", tarea = "") {
    eventoEditando = { fecha, index };
    const container = document.getElementById('input-container-agenda');
    const txtTarea = document.getElementById('agenda-tarea');
    const txtFecha = document.getElementById('agenda-fecha');
    const txtHora = document.getElementById('agenda-hora');

    if(container) container.classList.remove('hidden');
    if(txtFecha) txtFecha.value = fecha;
    if(txtHora) txtHora.value = hora;
    if(txtTarea) {
        txtTarea.value = tarea;
        txtTarea.focus();
    }
}

function cerrarEditorAgenda() {
    const container = document.getElementById('input-container-agenda');
    if(container) container.classList.add('hidden');
    eventoEditando = null;
    const txtTarea = document.getElementById('agenda-tarea');
    if(txtTarea) txtTarea.value = "";
}

function guardarEventoAgenda() {
    const tarea = document.getElementById('agenda-tarea').value.trim();
    const fecha = document.getElementById('agenda-fecha').value;
    const hora = document.getElementById('agenda-hora').value;

    if (tarea && fecha) {
        let evs = JSON.parse(localStorage.getItem(`agenda_${fecha}`)) || [];
        if (eventoEditando && eventoEditando.index !== null && eventoEditando.fecha === fecha) {
            evs[eventoEditando.index] = { tarea, hora, done: false };
        } else {
            evs.push({ tarea, hora, done: false });
        }
        localStorage.setItem(`agenda_${fecha}`, JSON.stringify(evs));
        modoEdicionAgenda = false; 
        cerrarEditorAgenda();
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


/* --- FUNCIONES DEL CICLO LUNAR --- */
function obtenerFechaInicioCiclo(registros, hoyStr) {
    const fechaBase = new Date("2026-04-30T00:00:00");
    const hoy = new Date(hoyStr + "T00:00:00");
    if (hoy < fechaBase) return fechaBase;
    const diferenciaMilisegundos = hoy - fechaBase;
    const diasTranscurridos = Math.floor(diferenciaMilisegundos / (1000 * 60 * 60 * 24));
    const ciclosCompletos = Math.floor(diasTranscurridos / 28);
    let inicioCicloActual = new Date(fechaBase);
    inicioCicloActual.setDate(fechaBase.getDate() + (cyclesCompletos * 28));
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

        div.onclick = (e) => {
            e.stopPropagation();
            abrirRegistro(iso, !reg);
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