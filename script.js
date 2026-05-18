if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(() => console.log('Service Worker Registrado'));
}

/* --- CONFIGURACIÓN INICIAL --- */
let pinIngresado = "";
// El PIN es 1707 por defecto. Se guarda en el motor del navegador.
const PIN_CORRECTO = localStorage.getItem('journalPin') || "1707"; 

/* --- AL CARGAR EL DOCUMENTO --- */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inyectar el año dinámico (Solo si el elemento existe en la vista actual)
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
                // Verificación automática al llegar a 4 dígitos opcional:
                // if (pinIngresado.length === 4) { setTimeout(validarPin, 200); }
            }
        });
    });

    // 3. Botones de control del PIN
    document.getElementById('btn-clear').addEventListener('click', () => {
        pinIngresado = "";
        actualizarInterfazPin();
    });

    document.getElementById('btn-enter').addEventListener('click', validarPin);

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

    // 5. Estado inicial en el historial para que el gesto "atrás" funcione
    // Esto marca el "Menú" como el punto de partida real.
    history.replaceState({ page: 'menu' }, "", "");

    // Escuchadores para Configuración
    document.getElementById('btn-toggle-dark').addEventListener('click', cambiarTema);
    document.getElementById('color-picker').addEventListener('input', cambiarColorAcento);
    document.getElementById('btn-change-pin').addEventListener('click', cambiarPinAction);
    document.getElementById('btn-export').addEventListener('click', exportarDatos);
    document.getElementById('import-file').addEventListener('change', importarDatos);

/* --- ESCUCHADORES DE METAS --- */
const btnMetasMenu = document.getElementById('btn-metas-menu');
const metasDropdown = document.getElementById('metas-dropdown');

document.addEventListener('click', (e) => {
    const listaMetas = document.getElementById('lista-metas');
    const inputContainerMeta = document.getElementById('input-container-meta');
    const optEditMetas = document.getElementById('opt-edit-metas');

    // Cerrar dropdown si se clica fuera
    if (metasDropdown && !metasDropdown.contains(e.target) && e.target !== btnMetasMenu) {
        metasDropdown.classList.add('hidden');
    }

    // Cerrar modo edición si se clica en el "blanco"
    if (modoEdicionActivo) {
        const clicFueraLista = listaMetas && !listaMetas.contains(e.target);
        const clicFueraInput = inputContainerMeta && !inputContainerMeta.contains(e.target);
        // Evitar que el clic en el botón de menú o de editar desactive el modo
        const clicFueraBotones = e.target !== btnMetasMenu && e.target !== optEditMetas;

        if (clicFueraLista && clicFueraInput && clicFueraBotones) {
            modoEdicionActivo = false;
            metaEditandoIndex = null;
            cargarMetas();
        }
    }
});

if (btnMetasMenu) {
    btnMetasMenu.onclick = (e) => {
        e.stopPropagation();
        metasDropdown.classList.toggle('hidden');
    };
}

const optEditMetas = document.getElementById('opt-edit-metas');
if(optEditMetas) {
    optEditMetas.onclick = (e) => {
        e.stopPropagation();
        modoEdicionActivo = !modoEdicionActivo;
        if (metasDropdown) metasDropdown.classList.add('hidden');
        cargarMetas();
    };
}

const btnSaveMeta = document.getElementById('btn-save-meta');
if(btnSaveMeta) {
    btnSaveMeta.onclick = (e) => {
        e.stopPropagation();
        const val = document.getElementById('input-nueva-meta').value.trim();
        guardarMeta(val, true); 
    };
}

const inputNuevaMeta = document.getElementById('input-nueva-meta');
if(inputNuevaMeta) {
    inputNuevaMeta.onkeydown = (e) => {
        if (e.key === 'Enter') {
            guardarMeta(e.target.value.trim(), false); 
        }
        if (e.key === 'Escape') {
            modoEdicionActivo = false;
            cargarMetas();
        }
    };
}

// Inicializar
cargarMetas();

/* --- ESCUCHADORES DE HÁBITOS --- */
const btnHabitosMenu = document.getElementById('btn-habitos-menu');
const habitosDropdown = document.getElementById('habitos-dropdown');

if (btnHabitosMenu) {
    btnHabitosMenu.onclick = (e) => {
        e.stopPropagation();
        habitosDropdown.classList.toggle('hidden');
    };
}

document.addEventListener('click', (e) => {
    const contenedorHabitos = document.getElementById('contenedor-habitos');
    const inputContainer = document.getElementById('input-container-habito');
    
    if (habitosDropdown && !habitosDropdown.contains(e.target) && e.target !== btnHabitosMenu) {
        habitosDropdown.classList.add('hidden');
    }

    if (modoEdicionHabitos) {
        const clicFueraGrid = contenedorHabitos && !contenedorHabitos.contains(e.target);
        const clicFueraInput = inputContainer && !inputContainer.contains(e.target);
        const clicFueraBotonMenu = e.target !== btnHabitosMenu;

        if (clicFueraGrid && clicFueraInput && clicFueraBotonMenu) {
            modoEdicionHabitos = false;
            habitoEditandoId = null;
            if(inputContainer) inputContainer.classList.add('hidden');
            cargarHabitos();
        }
    }
});

const optEditHab = document.getElementById('opt-edit-habitos');
if (optEditHab) {
    optEditHab.onclick = (e) => {
        e.stopPropagation();
        modoEdicionHabitos = !modoEdicionHabitos;
        habitosDropdown.classList.add('hidden');
        cargarHabitos();
    };
}

const optHistHab = document.getElementById('opt-historial-habitos');
if (optHistHab) {
    optHistHab.onclick = () => {
        toggleHistorialHabitos();
        habitosDropdown.classList.add('hidden');
    };
}

const btnSaveHabito = document.getElementById('btn-save-habito');
if (btnSaveHabito) {
    btnSaveHabito.onclick = () => guardarHabito();
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

cargarHabitos();


/* --- ESCUCHADORES DE TO-DO LIST --- */
const btnTodoMenu = document.getElementById('btn-todo-menu');
const todoDropdown = document.getElementById('todo-dropdown');
const optAddTodo = document.getElementById('opt-add-todo');

document.addEventListener('click', (e) => {
    const contenedorTareas = document.getElementById('lista-tareas');
    const inputContainerTodo = document.getElementById('input-container-todo');

    // Cerrar dropdown
    if (todoDropdown && !todoDropdown.contains(e.target) && e.target !== btnTodoMenu) {
        todoDropdown.classList.add('hidden');
    }

    // Salir del modo edición/añadir si clicas fuera
    if (modoEdicionTodo) {
        const clicFueraLista = contenedorTareas && !contenedorTareas.contains(e.target);
        const clicFueraInput = inputContainerTodo && !inputContainerTodo.contains(e.target);
        const clicFueraBotones = e.target !== btnTodoMenu && e.target !== optAddTodo;

        if (clicFueraLista && clicFueraInput && clicFueraBotones) {
            modoEdicionTodo = false;
            todoEditandoIndex = null;
            cargarTareas();
        }
    }
});

if (btnTodoMenu) {
    btnTodoMenu.onclick = (e) => {
        e.stopPropagation();
        todoDropdown.classList.toggle('hidden');
    };
}

if (optAddTodo) {
    optAddTodo.onclick = (e) => {
        e.stopPropagation();
        modoEdicionTodo = true;
        todoDropdown.classList.add('hidden');
        const container = document.getElementById('input-container-todo');
        const input = document.getElementById('input-nueva-tarea');
        if(container) container.classList.remove('hidden');
        if(input) {
            input.value = "";
            input.placeholder = "Escribe y pulsa Enter...";
            input.focus();
        }
        cargarTareas();
    };
}

const optClearTodo = document.getElementById('opt-clear-todo');
if (optClearTodo) {
    optClearTodo.onclick = () => {
        limpiarTareasCompletadas();
        todoDropdown.classList.add('hidden');
    };
}

const inputTarea = document.getElementById('input-nueva-tarea');
if (inputTarea) {
    inputTarea.onkeydown = (e) => {
        if (e.key === 'Enter') {
            // Enter guarda y permite seguir añadiendo
            guardarTarea(e.target.value.trim(), false);
        }
        if (e.key === 'Escape') {
            modoEdicionTodo = false;
            cargarTareas();
        }
    };
}

// Carga inicial
cargarTareas();

    /* --- ESCUCHADORES AGENDA --- */
const btnAgendaMenu = document.getElementById('btn-agenda-menu');
const agendaDropdown = document.getElementById('agenda-dropdown');

if (btnAgendaMenu) {
    btnAgendaMenu.onclick = (e) => {
        e.stopPropagation();
        agendaDropdown.classList.toggle('hidden');
    };
}

// Opción Editar Agenda
document.getElementById('opt-edit-agenda').onclick = () => {
    modoEdicionAgenda = !modoEdicionAgenda;
    agendaDropdown.classList.add('hidden');
    renderizarSemana();
};

document.getElementById('opt-limpiar-completados-agenda').onclick = () => {
    limpiarAgendaCompletada();
    agendaDropdown.classList.add('hidden');
};

// Guardar cambios con el botón
document.getElementById('btn-save-agenda').onclick = guardarEventoAgenda;

// Cerrar todo al hacer clic en cualquier espacio vacío
document.addEventListener('click', (e) => {
    // Cerrar menú dropdown
    if (agendaDropdown && !agendaDropdown.contains(e.target) && e.target !== btnAgendaMenu) {
        agendaDropdown.classList.add('hidden');
    }
    // Cerrar modo edición si se clica fuera de la cuadrícula o botones
    const grid = document.getElementById('semana-container');
    const form = document.getElementById('agenda-form-popup');
    if (modoEdicionAgenda && !grid.contains(e.target) && !btnAgendaMenu.contains(e.target) && !agendaDropdown.contains(e.target)) {
        // Solo cerramos si no estamos tocando el formulario de input
        if (!document.getElementById('input-container-agenda').contains(e.target)) {
            modoEdicionAgenda = false;
            cerrarEditorAgenda();
            renderizarSemana();
        }
    }
});

// Navegación
document.getElementById('btn-semana-prev').onclick = () => navegarSemana(-7);
document.getElementById('btn-semana-next').onclick = () => navegarSemana(7);

// Teclas rápidas en el formulario
document.getElementById('input-container-agenda').onkeydown = (e) => {
    if (e.key === 'Escape') cerrarEditorAgenda();
};

// Carga inicial
renderizarSemana();


/* --- ESCUCHADORES DEL CICLO LUNAR --- */
const btnCicloMenu = document.getElementById('btn-ciclo-menu');
const cicloDropdown = document.getElementById('ciclo-dropdown');
const modalRegistro = document.getElementById('modal-registro');

document.addEventListener('click', (e) => {
    // 1. Cerrar Dropdown si clicas fuera
    if (cicloDropdown && !cicloDropdown.contains(e.target) && e.target !== btnCicloMenu) {
        cicloDropdown.classList.add('hidden');
    }

    // 2. Cerrar Modal al presionar el fondo oscuro (el espacio en blanco)
    if (e.target === modalRegistro) {
        modalRegistro.classList.add('hidden');
    }
});

if(btnCicloMenu) {
    btnCicloMenu.onclick = (e) => {
        e.stopPropagation();
        cicloDropdown.classList.toggle('hidden');
    };
}

// Opción Registrar desde el menú
const optAddReg = document.getElementById('opt-add-registro');
if(optAddReg) {
    optAddReg.onclick = () => {
        abrirRegistro(new Date().toISOString().split('T')[0]);
        cicloDropdown.classList.add('hidden');
    };
}

// Botones del modal
const btnSaveReg = document.getElementById('btn-guardar-reg');
if(btnSaveReg) btnSaveReg.onclick = guardarRegistro;

const btnCancelReg = document.getElementById('btn-cancelar-reg');
if(btnCancelReg) btnCancelReg.onclick = () => modalRegistro.classList.add('hidden');

// Carga inicial
dibujarRueda();

})



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
        pinIngresado = ""; // Limpiar para seguridad
    } else {
        alert("PIN Incorrecto. Intenta de nuevo.");
        pinIngresado = "";
        actualizarInterfazPin();
    }
}

/* --- NAVEGACIÓN POR GESTOS (SISTEMA DE ANCLAS NATIVAS) --- */

// 1. Escuchar los cambios en la URL (cuando cambia el #)
window.addEventListener('hashchange', () => {
    // Leemos qué hay después del # (si no hay nada, vamos al menú)
    const pantalla = location.hash.replace('#', '') || 'menu';
    ejecutarCambioVisual(pantalla);
});

// 2. Función navegar: Ahora solo cambia el # de la URL
function navegar(pantalla) {
    location.hash = pantalla;
}

// 3. Función visual: Solo se encarga de mostrar/ocultar
function ejecutarCambioVisual(pantalla) {
    // Ocultar todas las vistas
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    
    // Mostrar la seleccionada
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

// 4. Al cargar la app, forzar que empiece en el menú si no hay hash
if (!location.hash) {
    location.hash = 'menu';
} else {
    // Si recargas y ya hay un hash (ej. #habitos), que lo muestre
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

// 1. Cambiar color de acento
function cambiarColorAcento(e) {
    const color = e.target.value;
    document.documentElement.style.setProperty('--accent-color', color);
    localStorage.setItem('journalAccentColor', color);
}

// Cargar el color guardado al iniciar
const colorGuardado = localStorage.getItem('journalAccentColor');
if (colorGuardado) {
    document.documentElement.style.setProperty('--accent-color', colorGuardado);
    setTimeout(() => { if(document.getElementById('color-picker')) document.getElementById('color-picker').value = colorGuardado; }, 100);
}

// 2. Cambiar PIN
function cambiarPinAction() {
    const nuevoPin = prompt("Introduce tu nuevo PIN de 4 dígitos:");
    if (nuevoPin && nuevoPin.length === 4 && !isNaN(nuevoPin)) {
        localStorage.setItem('journalPin', nuevoPin);
        alert("PIN actualizado correctamente.");
    } else {
        alert("PIN no válido. Debe ser de 4 números.");
    }
}

// 3. Backup: Exportar
function exportarDatos() {
    const datos = JSON.stringify(localStorage);
    const blob = new Blob([datos], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_journal_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
}

// 4. Backup: Importar
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

/* --- LÓGICA DE METAS: FUNCIONES --- */
// Definir al inicio para que sea accesible globalmente
let modoEdicionActivo = false;
let metaEditandoIndex = null;

function cargarMetas() {
    const anio = new Date().getFullYear();
    const metas = JSON.parse(localStorage.getItem(`journal_metas_${anio}`)) || [];
    const lista = document.getElementById('lista-metas');
    const labelAnio = document.getElementById('meta-year-label');
    const btnEditarMenu = document.getElementById('opt-edit-metas');
    const inputContainer = document.getElementById('input-container-meta');
    
    if(labelAnio) labelAnio.textContent = anio;
    if(!lista) return;

    if(btnEditarMenu) {
        btnEditarMenu.textContent = modoEdicionActivo ? "✅ Finalizar Edición" : "📝 Editar Metas";
    }

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

    if (modoEdicionActivo) {
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

function prepararEdicion(index, textoActual) {
    metaEditandoIndex = index;
    const container = document.getElementById('input-container-meta');
    const input = document.getElementById('input-nueva-meta');
    if(container) container.classList.remove('hidden');
    if(input) {
        input.value = textoActual;
        input.focus();
    }
}

function activarEscrituraMeta() {
    metaEditandoIndex = null;
    const container = document.getElementById('input-container-meta');
    const input = document.getElementById('input-nueva-meta');
    if(container) container.classList.remove('hidden');
    if(input) {
        input.value = "";
        input.focus();
    }
}

function guardarMeta(texto, cerrarEditor = false) {
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
    metaEditandoIndex = null;

    if (cerrarEditor) {
        modoEdicionActivo = false;
        document.getElementById('input-container-meta').classList.add('hidden');
    }
    
    cargarMetas();
}

function borrarMetaDirecto(index) {
    const anio = new Date().getFullYear();
    let metas = JSON.parse(localStorage.getItem(`journal_metas_${anio}`)) || [];
    metas.splice(index, 1);
    localStorage.setItem(`journal_metas_${anio}`, JSON.stringify(metas));
    cargarMetas();
}

/* --- FUNCIONES DE HÁBITOS --- */
let modoEdicionHabitos = false;
let habitoEditandoId = null;

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
            const isChecked = habito.completados.includes(d) ? 'checked' : '';
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

function activarEscrituraHabito() {
    habitoEditandoId = null;
    document.getElementById('input-container-habito').classList.remove('hidden');
    const input = document.getElementById('input-nuevo-habito');
    input.value = "";
    input.focus();
}

function prepararEdicionHabito(habito) {
    habitoEditandoId = habito.id;
    document.getElementById('input-container-habito').classList.remove('hidden');
    const input = document.getElementById('input-nuevo-habito');
    input.value = habito.nombre;
    input.focus();
    cargarHabitos();
}

function guardarHabito() {
    const input = document.getElementById('input-nuevo-habito');
    const nombre = input.value.trim();
    const clave = obtenerClaveMes();
    let habitos = JSON.parse(localStorage.getItem(clave)) || [];

    if (nombre !== "") {
        if (habitoEditandoId) {
            const index = habitos.findIndex(h => h.id === habitoEditandoId);
            if (index !== -1) habitos[index].nombre = nombre;
        } else {
            habitos.push({ id: 'h-' + Date.now(), nombre: nombre, completados: [] });
        }
        localStorage.setItem(clave, JSON.stringify(habitos));
    }

    habitoEditandoId = null;
    modoEdicionHabitos = false;
    input.value = "";
    document.getElementById('input-container-habito').classList.add('hidden');
    cargarHabitos();
}

function borrarHabito(id) {
    if(confirm("¿Eliminar este hábito?")) {
        const clave = obtenerClaveMes();
        let habitos = JSON.parse(localStorage.getItem(clave)) || [];
        habitos = habitos.filter(h => h.id !== id);
        localStorage.setItem(clave, JSON.stringify(habitos));
        cargarHabitos();
    }
}

function alternarDiaHabito(id, dia) {
    if(modoEdicionHabitos) return;
    const clave = obtenerClaveMes();
    let habitos = JSON.parse(localStorage.getItem(clave));
    const habito = habitos.find(h => h.id === id);
    if (habito.completados.includes(dia)) {
        habito.completados = habito.completados.filter(d => d !== dia);
    } else {
        habito.completados.push(dia);
    }
    localStorage.setItem(clave, JSON.stringify(habitos));
    cargarHabitos();
}

function toggleHistorialHabitos() {
    const contenedor = document.getElementById('historial-habitos-container');
    const btn = document.getElementById('opt-historial-habitos');
    contenedor.classList.toggle('hidden');
    if(!contenedor.classList.contains('hidden')) {
        btn.textContent = "📜 Ocultar Historial";
        contenedor.innerHTML = "<p style='text-align:center; opacity:0.5; padding:10px;'>Historial de meses anteriores</p>";
    } else {
        btn.textContent = "📜 Ver Historial";
    }
}


/* --- FUNCIONES TO-DO LIST --- */
let todoEditandoIndex = null;
let modoEdicionTodo = false; 

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
            e.stopPropagation(); // Evita que el clic fuera cierre el modo
            if (modoEdicionTodo) {
                prepararEdicionTodo(index, tarea.texto);
            } else {
                alternarTarea(index);
            }
        };
        lista.appendChild(li);
    });

    // Solo ocultar si el modo edición está apagado
    if (!modoEdicionTodo) {
        const containerInput = document.getElementById('input-container-todo');
        if(containerInput) containerInput.classList.add('hidden');
        todoEditandoIndex = null;
    }
}

function alternarTarea(index) {
    const tareas = JSON.parse(localStorage.getItem('journal_todo'));
    tareas[index].completada = !tareas[index].completada;
    localStorage.setItem('journal_todo', JSON.stringify(tareas));
    cargarTareas();
}

function prepararEdicionTodo(index, texto) {
    todoEditandoIndex = index;
    const input = document.getElementById('input-nueva-tarea');
    const container = document.getElementById('input-container-todo');
    if(container) container.classList.remove('hidden');
    if(input) {
        input.value = texto;
        input.placeholder = "Borra todo para eliminar...";
        input.focus();
    }
}

function guardarTarea(texto, cerrarEditor = false) {
    let tareas = JSON.parse(localStorage.getItem('journal_todo')) || [];

    if (todoEditandoIndex !== null) {
        if (texto === "") {
            if (confirm("¿Eliminar esta tarea?")) {
                tareas.splice(todoEditandoIndex, 1);
            }
        } else {
            tareas[todoEditandoIndex].texto = texto;
        }
    } else {
        if (!texto) return;
        tareas.push({ texto: texto, completada: false });
    }

    localStorage.setItem('journal_todo', JSON.stringify(tareas));
    document.getElementById('input-nueva-tarea').value = "";
    
    if (cerrarEditor) {
        modoEdicionTodo = false;
        todoEditandoIndex = null;
    }
    
    cargarTareas();
}

function limpiarTareasCompletadas() {
    let tareas = JSON.parse(localStorage.getItem('journal_todo')) || [];
    const terminadas = tareas.filter(t => t.completada);

    if (terminadas.length === 0) {
        alert("No hay tareas terminadas para borrar.");
        return;
    }

    if (confirm(`¿Borrar ${terminadas.length} tareas completadas?`)) {
        tareas = tareas.filter(t => !t.completada);
        localStorage.setItem('journal_todo', JSON.stringify(tareas));
        cargarTareas();
    }
}


/* --- LÓGICA DE LA AGENDA --- */
let fechaReferenciaAgenda = new Date(); 
let eventoEditando = null; 
let modoEdicionAgenda = false;

function navegarSemana(dias) {
    fechaReferenciaAgenda.setDate(fechaReferenciaAgenda.getDate() + dias);
    renderizarSemana();
}

function renderizarSemana() {
    const cont = document.getElementById('semana-container');
    if (!cont) return;
    cont.innerHTML = "";
    
    // Si estamos en modo edición, añadimos una clase al contenedor
    cont.className = `semana-grid ${modoEdicionAgenda ? 'modo-edicion-agenda' : ''}`;

    let lunes = new Date(fechaReferenciaAgenda);
    const diaSemana = lunes.getDay();
    const diferencia = (diaSemana === 0 ? -6 : 1 - diaSemana);
    lunes.setDate(lunes.getDate() + diferencia);

    const labelRango = document.getElementById('rango-semana-label');
    if (labelRango) {
        const opciones = { month: 'long', year: 'numeric' };
        labelRango.textContent = lunes.toLocaleDateString('es-ES', opciones).toUpperCase();
    }

    const nombresDias = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

    for (let i = 0; i < 7; i++) {
        let d = new Date(lunes);
        d.setDate(lunes.getDate() + i);
        const iso = d.toISOString().split('T')[0];
        const evs = JSON.parse(localStorage.getItem(`agenda_${iso}`)) || [];
        
        const fila = document.createElement('div');
        fila.className = `dia-fila ${i === 6 ? 'domingo' : ''}`;
        
        fila.innerHTML = `
            <div class="dia-info">
                <span class="dia-nombre">${nombresDias[i]}</span>
                <span class="dia-numero">${d.getDate()}</span>
                <span class="dia-luna">${obtenerIconoLuna(d)}</span>
            </div>
            <div class="dia-eventos">
                ${evs.sort((a, b) => a.hora.localeCompare(b.hora)).map((e, idx) => `
                    <div class="evento-item ${e.done ? 'done' : ''}">
                        <div class="evento-click-area" style="flex:1; display:flex; align-items:center; gap:10px; cursor:pointer;" onclick="clickTacharEvento('${iso}', ${idx})">
                            <span class="evento-hora">${e.hora || '--:--'}</span>
                            <span class="evento-texto">${e.tarea}</span>
                        </div>
                        ${modoEdicionAgenda ? `
                        <div class="agenda-actions">
                            <button class="btn-reprogramar" onclick="prepararReprogramar('${iso}', ${idx})">📅</button>
                            <button class="btn-borrar-evento" onclick="borrarEventoDirecto('${iso}', ${idx})">🗑️</button>
                        </div>` : ''}
                    </div>
                `).join('')}
                ${modoEdicionAgenda ? `<div class="add-evento-inline" onclick="abrirEditorNuevo('${iso}')" style="font-size:0.8rem; opacity:0.5; cursor:pointer;">+ Añadir...</div>` : ''}
            </div>
        `;
        cont.appendChild(fila);
    }
}

function clickTacharEvento(fecha, index) {
    if (modoEdicionAgenda) return;
    const evs = JSON.parse(localStorage.getItem(`agenda_${fecha}`));
    evs[index].done = !evs[index].done;
    localStorage.setItem(`agenda_${fecha}`, JSON.stringify(evs));
    renderizarSemana();
}

function abrirEditorNuevo(fecha) {
    eventoEditando = null;
    document.getElementById('input-container-agenda').classList.remove('hidden');
    document.getElementById('agenda-fecha').value = fecha;
    document.getElementById('agenda-tarea').value = "";
    document.getElementById('agenda-tarea').focus();
}

function prepararReprogramar(fecha, index) {
    const evs = JSON.parse(localStorage.getItem(`agenda_${fecha}`));
    eventoEditando = { fecha, index };
    document.getElementById('input-container-agenda').classList.remove('hidden');
    document.getElementById('agenda-tarea').value = evs[index].tarea;
    document.getElementById('agenda-fecha').value = fecha;
    document.getElementById('agenda-hora').value = evs[index].hora;
    document.getElementById('agenda-tarea').focus();
}

function borrarEventoDirecto(fecha, index) {
    let evs = JSON.parse(localStorage.getItem(`agenda_${fecha}`));
    evs.splice(index, 1);
    localStorage.setItem(`agenda_${fecha}`, JSON.stringify(evs));
    renderizarSemana();
}

function guardarEventoAgenda() {
    const tarea = document.getElementById('agenda-tarea').value.trim();
    const fecha = document.getElementById('agenda-fecha').value;
    const hora = document.getElementById('agenda-hora').value;

    if (tarea && fecha) {
        // Si estábamos editando uno existente, lo borramos de su posición vieja
        if (eventoEditando) {
            let evsViejos = JSON.parse(localStorage.getItem(`agenda_${eventoEditando.fecha}`));
            evsViejos.splice(eventoEditando.index, 1);
            localStorage.setItem(`agenda_${eventoEditando.fecha}`, JSON.stringify(evsViejos));
        }
        
        // Guardamos el nuevo o actualizado
        const evsDestino = JSON.parse(localStorage.getItem(`agenda_${fecha}`)) || [];
        evsDestino.push({ tarea, hora, done: false });
        localStorage.setItem(`agenda_${fecha}`, JSON.stringify(evsDestino));
        
        cerrarEditorAgenda();
        renderizarSemana();
    }
}

function cerrarEditorAgenda() {
    document.getElementById('input-container-agenda').classList.add('hidden');
    eventoEditando = null;
}

function limpiarAgendaCompletada() {
    if (!confirm("¿Borrar actividades tachadas de esta semana?")) return;
    let lunes = new Date(fechaReferenciaAgenda);
    const diaSemana = lunes.getDay();
    lunes.setDate(lunes.getDate() + (diaSemana === 0 ? -6 : 1 - diaSemana));

    for (let i = 0; i < 7; i++) {
        let d = new Date(lunes);
        d.setDate(lunes.getDate() + i);
        const iso = d.toISOString().split('T')[0];
        let evs = JSON.parse(localStorage.getItem(`agenda_${iso}`));
        if (evs) {
            evs = evs.filter(e => !e.done);
            localStorage.setItem(`agenda_${iso}`, JSON.stringify(evs));
        }
    }
    renderizarSemana();
}

function obtenerIconoLuna(f) {
    const lunas = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
    const ciclo = 29.53;
    const base = new Date("2024-01-11");
    const diff = (f - base) / 86400000;
    const pos = (diff % ciclo + ciclo) % ciclo;
    return lunas[Math.floor((pos / ciclo) * 8)] || "🌙";
}



/* --- FUNCIONES DEL CICLO LUNAR --- */

// Función matemática para calcular el inicio del bloque de 28 días actual
function obtenerFechaInicioCiclo(registros, hoyStr) {
    // FECHA BASE REAL: El punto de partida de tus ciclos de 28 días
    const fechaBase = new Date("2026-04-30T00:00:00");
    const hoy = new Date(hoyStr + "T00:00:00");
    
    // Si por alguna razón la fecha actual es menor a la base, usamos la base
    if (hoy < fechaBase) {
        return fechaBase;
    }
    
    // Calcular cuántos días exactos han pasado desde el 30 de abril de 2026
    const diferenciaMilisegundos = hoy - fechaBase;
    const diasTranscurridos = Math.floor(diferenciaMilisegundos / (1000 * 60 * 60 * 24));
    
    // Averiguar cuántos ciclos completos de 28 días han pasado
    const ciclosCompletos = Math.floor(diasTranscurridos / 28);
    
    // El inicio del ciclo actual es: Fecha Base + (Ciclos Completos * 28 días)
    let inicioCicloActual = new Date(fechaBase);
    inicioCicloActual.setDate(fechaBase.getDate() + (ciclosCompletos * 28));
    
    return inicioCicloActual;
}

function dibujarRueda() {
    const contenedor = document.getElementById('canvas-rueda');
    if (!contenedor) return;

    // Limpiar rueda de renders anteriores
    contenedor.querySelectorAll('.punto-dia').forEach(p => p.remove());

    const registros = JSON.parse(localStorage.getItem('ciclo_logs')) || {};
    
    // Obtener la fecha de hoy normalizada
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    const hoyStr = hoy.toISOString().split('T')[0];
    
    // El inicio se mueve estrictamente en bloques fijos de 28 días
    const inicioCiclo = obtenerFechaInicioCiclo(registros, hoyStr);
    
    // Actualizar la etiqueta superior en el encabezado
    const labelInicio = document.getElementById('txt-inicio-ciclo-label');
    if (labelInicio) {
        labelInicio.textContent = `Ciclo iniciado el: ${inicioCiclo.getDate()}/${inicioCiclo.getMonth() + 1}/${inicioCiclo.getFullYear()}`;
    }

    const radio = 130;

    // Dibujar el bloque exacto de 28 días en círculo
    for (let i = 0; i < 28; i++) {
        let fechaActual = new Date(inicioCiclo);
        fechaActual.setDate(inicioCiclo.getDate() + i);
        let iso = fechaActual.toISOString().split('T')[0];
        let reg = registros[iso];

        const div = document.createElement('div');
        div.className = 'punto-dia';
        
        // Distribución angular matemática perfecta para los 28 botones
        let angulo = (i * (360 / 28) - 90) * (Math.PI / 180);
        let x = radio * Math.cos(angulo);
        let y = radio * Math.sin(angulo);
        div.style.left = `calc(50% + ${x}px - 21px)`;
        div.style.top = `calc(50% + ${y}px - 21px)`;

        let iconoLuna = typeof obtenerIconoLuna === 'function' ? obtenerIconoLuna(fechaActual) : "🌙";
        div.innerHTML = `<span>${iconoLuna}</span><small>${fechaActual.getDate()}</small>`;
        
        // Contenedor de puntos indicadores
        const dotContainer = document.createElement('div');
        dotContainer.className = 'dot-container';

        // Puntito rojo si hay sangrado guardado
        if (reg && reg.sangrado && reg.sangrado !== "") {
            const dotSangre = document.createElement('div');
            dotSangre.className = 'indicador-sangre';
            dotContainer.appendChild(dotSangre);
        }

        // Puntito de color acento si es el día de HOY
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
            abrirRegistro(iso);
        };
        contenedor.appendChild(div);
    }
}

function abrirRegistro(fecha) {
    const modal = document.getElementById('modal-registro');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    
    const d = new Date(fecha + "T00:00:00");
    const labelFecha = document.getElementById('label-fecha-modal');
    if (labelFecha) labelFecha.textContent = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
    
    const inputFecha = document.getElementById('reg-fecha');
    if (inputFecha) inputFecha.value = fecha;

    const registros = JSON.parse(localStorage.getItem('ciclo_logs')) || {};
    const datos = registros[fecha] || {};

    // Asignar valores de forma segura
    const elSangrado = document.getElementById('reg-sangrado');
    const elDolor = document.getElementById('reg-dolor');
    const elEnergia = document.getElementById('reg-energia');
    const elAnimo = document.getElementById('reg-animo');
    const elObs = document.getElementById('reg-observaciones');

    if (elSangrado) elSangrado.value = datos.sangrado || "";
    if (elDolor) elDolor.value = datos.dolor || "";
    if (elEnergia) elEnergia.value = datos.energia || "media";
    if (elAnimo) elAnimo.value = datos.animo || "calma";
    if (elObs) elObs.value = datos.observaciones || "";
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