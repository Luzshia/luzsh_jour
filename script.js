    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('Service Worker registrado con éxito', reg))
                .catch(err => console.error('Error al registrar el Service Worker', err));
        });
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
document.addEventListener('click', (e) => {
    const listaMetas = document.getElementById('lista-metas');
    const inputContainerMeta = document.getElementById('input-container-meta');
    const optEditMetas = document.getElementById('opt-edit-metas');

    // Al hacer clic fuera de la lista y el input, guardamos automáticamente
    if (modoEdicionActivo) {
        const clicFueraLista = listaMetas && !listaMetas.contains(e.target);
        const clicFueraInput = inputContainerMeta && !inputContainerMeta.contains(e.target);
        const clicFueraBotonEditar = optEditMetas && !optEditMetas.contains(e.target);

        if (clicFueraLista && clicFueraInput && clicFueraBotonEditar) {
            const val = document.getElementById('input-nueva-meta').value.trim();
            if (val !== "") {
                guardarMeta(val, true); // Guarda los cambios automáticamente
            } else {
                modoEdicionActivo = false;
                metaEditandoIndex = null;
                cargarMetas();
            }
        }
    }
});

// Acción del botón flotante (+) para activar/desactivar edición
const optEditMetas = document.getElementById('opt-edit-metas');
if (optEditMetas) {
    optEditMetas.onclick = (e) => {
        e.stopPropagation();
        modoEdicionActivo = !modoEdicionActivo;
        cargarMetas();
    };
}

// Historial (Mantiene su funcionamiento original)
const optHistorialMetas = document.getElementById('opt-historial-metas');
if (optHistorialMetas) {
    optHistorialMetas.onclick = (e) => {
        e.stopPropagation();
        // Aquí puedes vincular la lógica existente que abre tu historial
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
            cargarMetas();
        }
    };
}

// Inicializar
cargarMetas();

/* --- ESCUCHADORES DE HÁBITOS --- */
document.addEventListener('click', (e) => {
    const contenedorHabitos = document.getElementById('contenedor-habitos');
    const inputContainer = document.getElementById('input-container-habito');
    const optEditHab = document.getElementById('opt-edit-habitos');

    if (modoEdicionHabitos) {
        const clicFueraGrid = contenedorHabitos && !contenedorHabitos.contains(e.target);
        const clicFueraInput = inputContainer && !inputContainer.contains(e.target);
        const clicFueraBotonEditar = optEditHab && !optEditHab.contains(e.target);

        // Si se clica fuera de las cajas de hábitos y del input de texto, se guarda de inmediato
        if (clicFueraGrid && clicFueraInput && clicFueraBotonEditar) {
            const val = document.getElementById('input-nuevo-habito').value.trim();
            if (val !== "") {
                guardarHabito(); // Guarda automáticamente el texto escrito
            } else {
                modoEdicionHabitos = false;
                habitoEditandoId = null;
                if(inputContainer) inputContainer.classList.add('hidden');
                cargarHabitos();
            }
        }
    }
});

// Acción del botón flotante (+) para activar/desactivar edición
const optEditHab = document.getElementById('opt-edit-habitos');
if (optEditHab) {
    optEditHab.onclick = (e) => {
        e.stopPropagation();
        modoEdicionHabitos = !modoEdicionHabitos;
        cargarHabitos();
    };
}

// Botón de Historial Central
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

// Inicializar
cargarHabitos();


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
                prepararEdicionTodo(index, tarea.texto);
            } else {
                alternarTarea(index);
            }
        };
        lista.appendChild(li);
    });

    // Ocultar la caja si el modo edición se ha apagado por completo
    if (!modoEdicionTodo) {
        const containerInput = document.getElementById('input-container-todo');
        if(containerInput) containerInput.classList.add('hidden');
        todoEditandoIndex = null;
    }
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

        // Si se clica en cualquier espacio vacío exterior estando en modo edición
        if (clicFueraGrid && clicFueraFormulario && clicFueraBotonEdit) {
            const tareaTexto = document.getElementById('agenda-tarea').value.trim();
            
            if (tareaTexto !== "") {
                guardarEventoAgenda(); // Guarda automáticamente lo escrito
            } else {
                modoEdicionAgenda = false;
                cerrarEditorAgenda();
                renderizarSemana();
            }
        }
    }
});

// Acción del botón flotante (+) para activar/desactivar edición de agenda
if (optEditAgenda) {
    optEditAgenda.onclick = (e) => {
        e.stopPropagation();
        
        // Si ya está abierto el editor con texto, guardamos antes de salir
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

// Botón Central: Limpiar Completados
const optLimpiarAgenda = document.getElementById('opt-limpiar-completados-agenda');
if (optLimpiarAgenda) {
    optLimpiarAgenda.onclick = (e) => {
        e.stopPropagation();
        limpiarAgendaCompletada();
    };
}

// Navegación con botones laterales
document.getElementById('btn-semana-prev').onclick = () => navegarSemana(-7);
document.getElementById('btn-semana-next').onclick = () => navegarSemana(7);

// Teclas rápidas en el formulario
document.getElementById('input-container-agenda').onkeydown = (e) => {
    if (e.key === 'Escape') {
        modoEdicionAgenda = false;
        cerrarEditorAgenda();
        renderizarSemana();
    }
};

// --- GESTOS DESLIZAR (SWIPE) SIN DESBORDAMIENTOS ---
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
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
    }
    if (touchStartX - touchEndX > umbral) {
        navegarSemana(7);
    } else if (touchEndX - touchStartX > umbral) {
        navegarSemana(-7);
    }
}

// Carga inicial
renderizarSemana();



/* --- ESCUCHADORES DEL CICLO LUNAR --- */
const modalRegistro = document.getElementById('modal-registro');
const optAddReg = document.getElementById('opt-add-registro');
const optVerCiclos = document.getElementById('opt-ver-ciclos');
const btnModificarReg = document.getElementById('btn-modificar-reg');
const regFechaInput = document.getElementById('reg-fecha');

document.addEventListener('click', (e) => {
    // Cerrar Tarjeta si se toca el fondo exterior vacío
    if (e.target === modalRegistro) {
        modalRegistro.classList.add('hidden');
    }
});

// Botón Flotante (+) Abre buscador/registro para la fecha de hoy por defecto
if(optAddReg) {
    optAddReg.onclick = (e) => {
        e.stopPropagation();
        const hoyIso = new Date().toISOString().split('T')[0];
        abrirRegistro(hoyIso);
    };
}

// Botón central: Ciclos anteriores
if (optVerCiclos) {
    optVerCiclos.onclick = (e) => {
        e.stopPropagation();
        if (typeof mostrarHistorialCiclos === 'function') {
            mostrarHistorialCiclos();
        } else {
            alert("Función 'Ciclos Anteriores' en desarrollo.");
        }
    };
}

// Si cambias manualmente la fecha dentro de la tarjeta
if (regFechaInput) {
    regFechaInput.onchange = (e) => {
        abrirRegistro(e.target.value);
    };
}

// Activar edición sobre una tarjeta en modo lectura
if (btnModificarReg) {
    btnModificarReg.onclick = () => {
        alternarModoEdicionTarjeta(true);
    };
}

// Botones guardar/cancelar del modal
const btnSaveReg = document.getElementById('btn-guardar-reg');
if(btnSaveReg) btnSaveReg.onclick = guardarRegistro;

const btnCancelReg = document.getElementById('btn-cancelar-reg');
if(btnCancelReg) btnCancelReg.onclick = () => modalRegistro.classList.add('hidden');

// Carga inicial
dibujarRueda();



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
                prepararEdicionTodo(index, tarea.texto);
            } else {
                alternarTarea(index);
            }
        };
        lista.appendChild(li);
    });

    // Ocultar la caja si el modo edición se ha apagado por completo
    if (!modoEdicionTodo) {
        const containerInput = document.getElementById('input-container-todo');
        if(containerInput) containerInput.classList.add('hidden');
        todoEditandoIndex = null;
    }
}


/* Asegúrate de que tu función guardarEventoAgenda finalice llamando a estos métodos (ya incluidos en tu código original) */
function guardarEventoAgenda() {
    const tarea = document.getElementById('agenda-tarea').value.trim();
    const fecha = document.getElementById('agenda-fecha').value;
    const hora = document.getElementById('agenda-hora').value;

    if (tarea && fecha) {
        if (eventoEditando) {
            let evsViejos = JSON.parse(localStorage.getItem(`agenda_${eventoEditando.fecha}`));
            evsViejos.splice(eventoEditando.index, 1);
            localStorage.setItem(`agenda_${eventoEditando.fecha}`, JSON.stringify(evsViejos));
        }
        
        const evsDestino = JSON.parse(localStorage.getItem(`agenda_${fecha}`)) || [];
        evsDestino.push({ tarea, hora, done: false });
        localStorage.setItem(`agenda_${fecha}`, JSON.stringify(evsDestino));
        
        // Apagamos el modo de edición tras guardar para refrescar limpiamente la vista
        modoEdicionAgenda = false; 
        cerrarEditorAgenda();
        renderizarSemana();
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

    // RADIO AMPLIADO DE 130 A 145 PARA HACER EL CÍRCULO MÁS ABIERTO
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
            
            // Verificación inteligente antes de abrir la tarjeta
            if (reg) {
                // Si ya existe registro: se abre directo en modo LECTURA
                abrirRegistro(iso, false);
            } else {
                // Si no existe: lanza la alerta sutil de confirmación
                if (confirm("Aún no tienes registro de este día. ¿Deseas registrar?")) {
                    abrirRegistro(iso, true); // Abre limpio en modo EDICIÓN
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

    // Asignar los valores guardados (o por defecto si está vacío)
    document.getElementById('reg-sangrado').value = datos?.sangrado || "";
    document.getElementById('reg-dolor').value = datos?.dolor || "";
    document.getElementById('reg-energia').value = datos?.energia || "media";
    document.getElementById('reg-animo').value = datos?.animo || "calma";
    document.getElementById('reg-observaciones').value = datos?.observaciones || "";

    modal.classList.remove('hidden');

    // Controlar permisos de la tarjeta según si ya existían datos o es nuevo
    if (datos && !forzarEdicion) {
        alternarModoEdicionTarjeta(false); // Modo ver (campos bloqueados)
    } else {
        alternarModoEdicionTarjeta(true);  // Modo escribir (campos listos)
    }
}

// Función auxiliar para bloquear/desbloquear campos de la tarjeta
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