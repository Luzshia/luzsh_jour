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

if (btnMetasMenu) {
    btnMetasMenu.onclick = (e) => {
        e.stopPropagation();
        metasDropdown.classList.toggle('hidden');
    };
}

// Cerrar menú al hacer clic fuera
document.addEventListener('click', () => {
    if (metasDropdown) metasDropdown.classList.add('hidden');
});

// Botón Editar desde el menú
const optEdit = document.getElementById('opt-edit-metas');
if(optEdit) {
    optEdit.onclick = () => {
        modoEdicionActivo = !modoEdicionActivo;
        cargarMetas();
    };
}

// Botón Historial
const optHist = document.getElementById('opt-historial-metas');
if(optHist) {
    optHist.onclick = () => toggleHistorialMetas();
}

// Botón Guardar Cambios (Minimalista)
const btnSave = document.getElementById('btn-save-meta');
if(btnSave) {
    btnSave.onclick = () => {
        const val = document.getElementById('input-nueva-meta').value.trim();
        guardarMeta(val);
    };
}

// Guardar con Enter
const inputMeta = document.getElementById('input-nueva-meta');
if(inputMeta) {
    inputMeta.onkeydown = (e) => {
        if (e.key === 'Enter') {
            guardarMeta(e.target.value.trim());
        }
    };
}

// Carga inicial
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
    if (habitosDropdown && !habitosDropdown.contains(e.target) && e.target !== btnHabitosMenu) {
        habitosDropdown.classList.add('hidden');
    }
});

const optEditHab = document.getElementById('opt-edit-habitos');
if (optEditHab) {
    optEditHab.onclick = () => {
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
    btnSaveHabito.onclick = (e) => {
        e.preventDefault();
        guardarHabito();
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
            document.getElementById('input-container-habito').classList.add('hidden');
            modoEdicionHabitos = false;
            cargarHabitos();
        }
    };
}

// Carga inicial
cargarHabitos();



    // --- Escuchadores de To-Do List ---
    const btnTodoMenu = document.getElementById('btn-todo-menu');
    const todoDropdown = document.getElementById('todo-dropdown');

    if (btnTodoMenu) {
        btnTodoMenu.onclick = (e) => {
            e.stopPropagation();
            todoDropdown.classList.toggle('hidden');
        };
    }

    document.addEventListener('click', () => {
        if (todoDropdown) todoDropdown.classList.add('hidden');
    });

    document.getElementById('opt-add-todo').onclick = () => {
        const container = document.getElementById('input-container-todo');
        const input = document.getElementById('input-nueva-tarea');
        container.classList.remove('hidden');
        input.value = "";
        input.placeholder = "Nueva tarea o toca una para editar...";
        input.focus();
    };

    document.getElementById('opt-clear-todo').onclick = limpiarTareasCompletadas;

    document.getElementById('input-nueva-tarea').onkeydown = (e) => {
        if (e.key === 'Enter') guardarTarea(e.target.value.trim());
        if (e.key === 'Escape') cargarTareas();
    };

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
    
    // Abrir menú de tres puntos
    const btnCicloMenu = document.getElementById('btn-ciclo-menu');
    if(btnCicloMenu) {
        btnCicloMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('ciclo-dropdown').classList.toggle('hidden');
        });
    }

    // Opción Añadir Registro desde el menú
    const optAddReg = document.getElementById('opt-add-registro');
    if(optAddReg) {
        optAddReg.addEventListener('click', () => {
            abrirRegistro(new Date().toISOString().split('T')[0]);
            document.getElementById('ciclo-dropdown').classList.add('hidden');
        });
    }

    // Botones del Modal
    const btnGuardar = document.getElementById('btn-guardar-reg');
    if(btnGuardar) btnGuardar.addEventListener('click', guardarRegistro);

    const btnCancelar = document.getElementById('btn-cancelar-reg');
    if(btnCancelar) {
        btnCancelar.addEventListener('click', () => {
            document.getElementById('modal-registro').classList.add('hidden');
        });
    }

    // Inicializar la rueda al cargar
    dibujarRueda();
});



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

    // Actualizar texto del menú
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
            // Botón X para borrar
            const btnDel = document.createElement('button');
            btnDel.className = "btn-delete-meta";
            btnDel.textContent = "×";
            btnDel.onclick = (e) => {
                e.stopPropagation();
                borrarMetaDirecto(index);
            };
            li.appendChild(btnDel);
            
            // Clic para editar
            li.onclick = () => prepararEdicion(index, m.texto);
        } else {
            // Modo normal: Tachar
            li.onclick = () => {
                m.completada = !m.completada;
                localStorage.setItem(`journal_metas_${anio}`, JSON.stringify(metas));
                cargarMetas();
            };
        }
        lista.appendChild(li);
    });

    // Opción añadir nueva al final (solo en edición)
    if (modoEdicionActivo) {
        const liNueva = document.createElement('li');
        liNueva.className = "add-trigger-area";
        liNueva.textContent = "+ Añadir nueva meta...";
        liNueva.onclick = () => activarEscrituraMeta();
        lista.appendChild(liNueva);
    }

    const nextNumLabel = document.getElementById('next-number-meta');
    if(nextNumLabel) nextNumLabel.textContent = (metas.length + 1) + ".";

    // Ocultar input si no estamos editando
    if (!modoEdicionActivo && inputContainer) {
        inputContainer.classList.add('hidden');
    }
}

function prepararEdicion(index, textoActual) {
    metaEditandoIndex = index;
    const container = document.getElementById('input-container-meta');
    const input = document.getElementById('input-nueva-meta');
    const nextNumLabel = document.getElementById('next-number-meta');

    if(container) container.classList.remove('hidden');
    if(input) {
        input.value = textoActual;
        input.focus();
    }
    if(nextNumLabel) nextNumLabel.textContent = (index + 1) + ".";
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

function guardarMeta(texto) {
    const anio = new Date().getFullYear();
    let metas = JSON.parse(localStorage.getItem(`journal_metas_${anio}`)) || [];

    if (texto !== "") {
        if (metaEditandoIndex !== null) {
            metas[metaEditandoIndex].texto = texto;
        } else {
            metas.push({ texto: texto, completada: false });
        }
        localStorage.setItem(`journal_metas_${anio}`, JSON.stringify(metas));
    }

    // Salir siempre del modo edición al guardar
    metaEditandoIndex = null;
    modoEdicionActivo = false;
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

function toggleHistorialMetas() {
    const container = document.getElementById('historial-metas-container');
    const btnHistorial = document.getElementById('opt-historial-metas');
    if(!container || !btnHistorial) return;

    container.classList.toggle('hidden');
    if (!container.classList.contains('hidden')) {
        btnHistorial.textContent = "📜 Ocultar Historial";
        renderizarHistorialAnual(container);
    } else {
        btnHistorial.textContent = "📜 Ver Historial";
    }
}

function renderizarHistorialAnual(container) {
    const anioActual = new Date().getFullYear();
    container.innerHTML = "";
    let hayDatos = false;

    for(let i = 1; i <= 5; i++) {
        const anioPast = anioActual - i;
        const metasPast = JSON.parse(localStorage.getItem(`journal_metas_${anioPast}`)) || [];
        if(metasPast.length > 0) {
            hayDatos = true;
            const h3 = document.createElement('h3');
            h3.textContent = anioPast;
            h3.style.margin = "15px 0 5px 0";
            h3.style.fontSize = "1rem";
            container.appendChild(h3);
            
            const ul = document.createElement('ul');
            ul.className = "metas-list";
            metasPast.forEach(m => {
                const li = document.createElement('li');
                li.className = "meta-item";
                li.style.fontSize = "1.2rem";
                li.textContent = m.texto;
                ul.appendChild(li);
            });
            container.appendChild(ul);
        }
    }
    if(!hayDatos) container.innerHTML = "<p style='text-align:center; opacity:0.5; margin:20px;'>No hay metas de años anteriores.</p>";
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


/* --- FUNCIONES TO-DO LIST CORREGIDAS --- */
let todoEditandoIndex = null;

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
            const containerInput = document.getElementById('input-container-todo');
            // Si el modo añadir está abierto, editamos (al tocar el texto o el li)
            if (!containerInput.classList.contains('hidden')) {
                prepararEdicionTodo(index, tarea.texto);
            } else {
                // Si está cerrado, marcamos como completada
                alternarTarea(index);
            }
        };

        lista.appendChild(li);
    });

    document.getElementById('input-container-todo').classList.add('hidden');
    todoEditandoIndex = null;
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
    input.value = texto;
    input.placeholder = "Borra todo para eliminar...";
    input.focus();
    
    const items = document.querySelectorAll('.todo-item');
    items.forEach(item => item.classList.remove('editando'));
    items[index].classList.add('editando');
}

function guardarTarea(texto) {
    let tareas = JSON.parse(localStorage.getItem('journal_todo')) || [];

    if (todoEditandoIndex !== null) {
        // MODO EDICIÓN O BORRADO
        if (texto === "") {
            if (confirm("¿Eliminar esta tarea?")) {
                tareas.splice(todoEditandoIndex, 1);
            }
        } else {
            tareas[todoEditandoIndex].texto = texto;
        }
    } else {
        // MODO NUEVO
        if (!texto) return;
        tareas.push({ texto: texto, completada: false });
    }

    localStorage.setItem('journal_todo', JSON.stringify(tareas));
    document.getElementById('input-nueva-tarea').value = "";
    cargarTareas();
}

function limpiarTareasCompletadas() {
    let tareas = JSON.parse(localStorage.getItem('journal_todo')) || [];
    const inicial = tareas.length;
    tareas = tareas.filter(t => !t.completada);

    if (tareas.length === inicial) {
        alert("No hay tareas terminadas para borrar.");
        return;
    }

    if (confirm("¿Borrar todas las tareas marcadas con X?")) {
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
let inicioCiclo = new Date("2026-04-30T00:00:00");

function dibujarRueda() {
    const contenedor = document.getElementById('canvas-rueda');
    if(!contenedor) return;

    // Limpiar puntos previos
    contenedor.querySelectorAll('.punto-dia').forEach(p => p.remove());

    const registros = JSON.parse(localStorage.getItem('ciclo_logs')) || {};
    const hoyStr = new Date().toISOString().split('T')[0];
    const radio = 135;

    for (let i = 0; i < 28; i++) {
        let fechaActual = new Date(inicioCiclo);
        fechaActual.setDate(inicioCiclo.getDate() + i);
        let iso = fechaActual.toISOString().split('T')[0];
        let reg = registros[iso];

        const div = document.createElement('div');
        div.className = 'punto-dia';
        
        let angulo = (i * (360/28) - 90) * (Math.PI/180);
        let x = radio * Math.cos(angulo);
        let y = radio * Math.sin(angulo);
        div.style.left = `calc(50% + ${x}px - 20px)`;
        div.style.top = `calc(50% + ${y}px - 20px)`;

        div.innerHTML = `<span>${obtenerIconoLuna(fechaActual)}</span><small>${fechaActual.getDate()}</small>`;
        
        if(reg) {
            if(reg.sangrado) div.innerHTML += '<div class="indicador-sangre"></div>';
            if(reg.sexo) div.innerHTML += '<div class="indicador-sexo"></div>';
        }

        if(iso === hoyStr) {
            div.classList.add('hoy-marcado');
            document.getElementById('txt-dia-ciclo').textContent = `Día ${i+1}`;
            document.getElementById('txt-fecha-ciclo').textContent = `${fechaActual.getDate()}/${fechaActual.getMonth()+1}`;
        }

        div.onclick = () => abrirRegistro(iso);
        contenedor.appendChild(div);
    }
}

function abrirRegistro(fecha) {
    const modal = document.getElementById('modal-registro');
    modal.classList.remove('hidden');
    document.getElementById('reg-fecha').value = fecha;

    const registros = JSON.parse(localStorage.getItem('ciclo_logs')) || {};
    const datos = registros[fecha] || {};

    document.getElementById('reg-sangrado').value = datos.sangrado || "";
    document.getElementById('reg-dolor').value = datos.dolor || "";
    document.getElementById('reg-energia').value = datos.energia || "media";
    document.getElementById('reg-libido').value = datos.libido || "media";
    document.getElementById('reg-social').value = datos.social || "media";
    document.getElementById('reg-animo').value = datos.animo || "calma";
    document.getElementById('reg-sexo').checked = datos.sexo || false;
    document.getElementById('reg-sueno-ini').value = datos.sueno_ini || "";
    document.getElementById('reg-sueno-fin').value = datos.sueno_fin || "";
}

function guardarRegistro() {
    const fecha = document.getElementById('reg-fecha').value;
    const registros = JSON.parse(localStorage.getItem('ciclo_logs')) || {};

    registros[fecha] = {
        sangrado: document.getElementById('reg-sangrado').value,
        dolor: document.getElementById('reg-dolor').value,
        energia: document.getElementById('reg-energia').value,
        libido: document.getElementById('reg-libido').value,
        social: document.getElementById('reg-social').value,
        animo: document.getElementById('reg-animo').value,
        sexo: document.getElementById('reg-sexo').checked,
        sueno_ini: document.getElementById('reg-sueno-ini').value,
        sueno_fin: document.getElementById('reg-sueno-fin').value
    };

    localStorage.setItem('ciclo_logs', JSON.stringify(registros));
    document.getElementById('modal-registro').classList.add('hidden');
    dibujarRueda();
}