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

    // --- Escuchadores de Metas ---
    const btnMetasMenu = document.getElementById('btn-metas-menu');
    const metasDropdown = document.getElementById('metas-dropdown');

    if (btnMetasMenu) {
        btnMetasMenu.onclick = (e) => {
            e.stopPropagation();
            metasDropdown.classList.toggle('hidden');
        };
    }

    document.addEventListener('click', () => {
        if (metasDropdown) metasDropdown.classList.add('hidden');
    });

    document.getElementById('opt-add-meta').onclick = () => activarEscrituraMeta();
    document.getElementById('opt-historial-metas').onclick = () => toggleHistorialMetas();

    cargarMetas();


    // --- Escuchadores de Hábitos ---
    const btnHabitosMenu = document.getElementById('btn-habitos-menu');
    const habitosDropdown = document.getElementById('habitos-dropdown');

    if (btnHabitosMenu) {
        btnHabitosMenu.onclick = (e) => {
            e.stopPropagation();
            habitosDropdown.classList.toggle('hidden');
        };
    }

    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', () => {
        if (habitosDropdown) habitosDropdown.classList.add('hidden');
    });

    document.getElementById('opt-add-habito').onclick = () => {
        const container = document.getElementById('input-container-habito');
        const input = document.getElementById('input-nuevo-habito');
        container.classList.remove('hidden');
        input.value = ""; // Limpiar por si acaso
        input.placeholder = "Escribir nuevo o toca uno para editar/borrar...";
        input.focus();
    };

    document.getElementById('opt-historial-habitos').onclick = toggleHistorialHabitos;

    // Escuchar el Enter en el input de hábitos
    document.getElementById('input-nuevo-habito').onkeydown = (e) => {
        if (e.key === 'Enter') agregarHabito();
        if (e.key === 'Escape') document.getElementById('input-container-habito').classList.add('hidden');
    };

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


    // --- Escuchadores Agenda ---
    const btnAgendaMenu = document.getElementById('btn-agenda-menu');
    const agendaDropdown = document.getElementById('agenda-dropdown');

    if (btnAgendaMenu) {
        btnAgendaMenu.onclick = (e) => {
            e.stopPropagation();
            agendaDropdown.classList.toggle('hidden');
        };
    }

    document.getElementById('opt-add-evento').onclick = () => {
        document.getElementById('input-container-agenda').classList.remove('hidden');
        document.getElementById('agenda-tarea').focus();
    };

    document.getElementById('opt-limpiar-completados-agenda').onclick = limpiarAgendaCompletada;

    // Navegación
    document.getElementById('btn-semana-prev').onclick = () => navegarSemana(-7);
    document.getElementById('btn-semana-next').onclick = () => navegarSemana(7);

    // Guardar con Enter
    document.getElementById('input-container-agenda').onkeydown = (e) => {
        if (e.key === 'Enter') agregarEvento();
        if (e.key === 'Escape') cerrarEditorAgenda();
    };

    // --- SOPORTE SWIPE (Deslizar página) ---
    let touchstartX = 0;
    let touchendX = 0;
    const swipeArea = document.getElementById('semana-container');

    swipeArea.addEventListener('touchstart', e => { touchstartX = e.changedTouches[0].screenX; });
    swipeArea.addEventListener('touchend', e => {
        touchendX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    function handleSwipe() {
        if (touchendX < touchstartX - 50) navegarSemana(7);  // Hacia la izquierda -> Siguiente
        if (touchendX > touchstartX + 50) navegarSemana(-7); // Hacia la derecha -> Anterior
    }

    renderizarSemana();



    // --- Escuchadores Ciclo ---
    document.getElementById('btn-ciclo-menu').onclick = (e) => {
        e.stopPropagation();
        document.getElementById('ciclo-dropdown').classList.toggle('hidden');
    };

    document.getElementById('opt-add-registro-ciclo').onclick = () => {
        abrirFormularioCiclo(new Date().toISOString().split('T')[0]);
    };

    document.getElementById('btn-guardar-ciclo').onclick = guardarRegistroCiclo;
    document.getElementById('btn-cerrar-ciclo').onclick = () => {
        document.getElementById('modal-registro-ciclo').classList.add('hidden');
    };

    // Al cargar la vista
    renderizarRueda();



    

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

/* --- LÓGICA DE METAS CON EDICIÓN Y BORRADO (CORREGIDO) --- */
let metaEditandoIndex = null; 

function cargarMetas() {
    const anio = new Date().getFullYear();
    const metas = JSON.parse(localStorage.getItem(`journal_metas_${anio}`)) || [];
    const lista = document.getElementById('lista-metas');
    const labelAnio = document.getElementById('meta-year-label');
    
    if(labelAnio) labelAnio.textContent = anio;
    if(!lista) return;

    lista.innerHTML = "";
    metas.forEach((m, index) => {
        const li = document.createElement('li');
        // Importante: mantenemos las clases para el tachado y la edición
        li.className = `meta-item ${m.completada ? 'completed' : ''}`;
        li.textContent = m.texto;
        
        li.onclick = () => {
            const containerInput = document.getElementById('input-container-meta');
            if (!containerInput.classList.contains('hidden')) {
                prepararEdicion(index, m.texto);
            } else {
                m.completada = !m.completada;
                localStorage.setItem(`journal_metas_${anio}`, JSON.stringify(metas));
                cargarMetas();
            }
        };
        lista.appendChild(li);
    });

    // CORRECCIÓN NUMERACIÓN: Actualiza el número que aparece al lado del input
    const nextNumLabel = document.getElementById('next-number-meta');
    if(nextNumLabel) nextNumLabel.textContent = (metas.length + 1) + ".";

    document.getElementById('input-container-meta').classList.add('hidden');
    metaEditandoIndex = null;
}

function activarEscrituraMeta() {
    const container = document.getElementById('input-container-meta');
    const input = document.getElementById('input-nueva-meta');
    
    container.classList.remove('hidden');
    input.value = ""; // Limpiamos el input al abrir
    input.placeholder = "Escribir nueva meta...";
    input.focus();

    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            guardarMeta(input.value.trim());
        }
        if (e.key === 'Escape') {
            cargarMetas(); 
        }
    };
}

function prepararEdicion(index, textoActual) {
    metaEditandoIndex = index;
    const input = document.getElementById('input-nueva-meta');
    const nextNumLabel = document.getElementById('next-number-meta');
    
    input.value = textoActual;
    input.placeholder = "Borra todo para eliminar...";
    
    // Cambia el número visual al de la meta que estás editando
    if(nextNumLabel) nextNumLabel.textContent = (index + 1) + ".";
    
    input.focus();

    const items = document.querySelectorAll('.meta-item');
    items.forEach(item => item.classList.remove('editando'));
    if(items[index]) items[index].classList.add('editando');
}

function guardarMeta(texto) {
    const anio = new Date().getFullYear();
    let metas = JSON.parse(localStorage.getItem(`journal_metas_${anio}`)) || [];

    if (metaEditandoIndex !== null) {
        // LÓGICA DE BORRADO: Si el texto está vacío, eliminamos
        if (texto === "") {
            if (confirm("¿Deseas eliminar esta meta?")) {
                metas.splice(metaEditandoIndex, 1);
            }
        } else {
            metas[metaEditandoIndex].texto = texto;
        }
    } else {
        // NUEVA META: Solo si tiene contenido
        if (!texto) return;
        metas.push({ texto: texto, completada: false });
    }

    localStorage.setItem(`journal_metas_${anio}`, JSON.stringify(metas));
    document.getElementById('input-nueva-meta').value = "";
    cargarMetas();
}

function toggleHistorialMetas() {
    const container = document.getElementById('historial-metas-container');
    container.classList.toggle('hidden');
    if (!container.classList.contains('hidden')) {
        container.innerHTML = "<p style='font-family:sans-serif; font-size:0.8rem; text-align:center; opacity:0.5; margin:15px 0;'>--- Fin del historial ---</p>";
    }
}

/* --- FUNCIONES DE HÁBITOS CORREGIDAS --- */

function obtenerClaveMes() {
    const fecha = new Date();
    return `journal_habits_${fecha.getFullYear()}_${fecha.getMonth() + 1}`;
}

let habitoEditandoId = null; 

function cargarHabitos() {
    const clave = obtenerClaveMes();
    const habitos = JSON.parse(localStorage.getItem(clave)) || [];
    const contenedor = document.getElementById('contenedor-habitos');
    if(!contenedor) return;

    contenedor.innerHTML = "";
    const diasEnMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

    habitos.forEach((habito) => {
        const item = document.createElement('div');
        item.className = 'habit-item';
        item.id = `item-${habito.id}`;
        
        let puntosHTML = "";
        for (let d = 1; d <= diasEnMes; d++) {
            const isChecked = habito.completados.includes(d) ? 'checked' : '';
            puntosHTML += `
                <div class="habit-dot-wrapper" onclick="event.stopPropagation(); alternarDiaHabito('${habito.id}', ${d})">
                    <div class="habit-dot ${isChecked}"></div>
                    <span class="dot-day">${d}</span>
                </div>`;
        }

        item.innerHTML = `
            <span class="habit-name">${habito.nombre}</span>
            <div class="dots-container">${puntosHTML}</div>
        `;

        // Al hacer clic en el nombre/área del hábito
        item.onclick = () => {
            const inputVisible = !document.getElementById('input-container-habito').classList.contains('hidden');
            if (inputVisible) {
                prepararEdicionHabito(habito);
            }
        };

        contenedor.appendChild(item);
    });
    
    document.getElementById('input-container-habito').classList.add('hidden');
    habitoEditandoId = null;
}

function prepararEdicionHabito(habito) {
    habitoEditandoId = habito.id;
    const input = document.getElementById('input-nuevo-habito');
    input.value = habito.nombre;
    input.placeholder = "Borra el nombre para eliminar hábito...";
    input.focus();
    
    // Feedback visual
    document.querySelectorAll('.habit-item').forEach(el => el.classList.remove('editando'));
    document.getElementById(`item-${habito.id}`).classList.add('editando');
}

function agregarHabito() {
    const input = document.getElementById('input-nuevo-habito');
    const nombre = input.value.trim();
    const clave = obtenerClaveMes();
    let habitos = JSON.parse(localStorage.getItem(clave)) || [];

    if (habitoEditandoId) {
        // MODO EDICIÓN O ELIMINACIÓN
        if (nombre === "") {
            if (confirm("¿Deseas eliminar este hábito por completo?")) {
                habitos = habitos.filter(h => h.id !== habitoEditandoId);
            }
        } else {
            const index = habitos.findIndex(h => h.id === habitoEditandoId);
            if (index !== -1) habitos[index].nombre = nombre;
        }
    } else {
        // MODO NUEVO
        if (!nombre) return;
        habitos.push({
            id: 'h-' + Date.now(),
            nombre: nombre,
            completados: []
        });
    }

    localStorage.setItem(clave, JSON.stringify(habitos));
    input.value = "";
    cargarHabitos();
}

function alternarDiaHabito(id, dia) {
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
    contenedor.classList.toggle('hidden');
    if (!contenedor.classList.contains('hidden')) {
        contenedor.innerHTML = "<p style='text-align:center; font-size:0.8rem; opacity:0.5; margin: 20px 0;'>--- Historial de hábitos ---</p>";
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

/* --- LÓGICA DE LA AGENDA (BLOQUE COMPLETO) --- */

// Variables globales necesarias
let fechaReferenciaAgenda = new Date(); 
let eventoEditando = null; 

// 1. Navegación entre semanas
function navegarSemana(dias) {
    fechaReferenciaAgenda.setDate(fechaReferenciaAgenda.getDate() + dias);
    renderizarSemana();
}

// 2. Dibujar la semana en pantalla
function renderizarSemana() {
    const cont = document.getElementById('semana-container');
    if (!cont) return;
    cont.innerHTML = "";
    
    // Calcular el lunes de la semana actual
    let lunes = new Date(fechaReferenciaAgenda);
    const diaSemana = lunes.getDay();
    const diferencia = (diaSemana === 0 ? -6 : 1 - diaSemana);
    lunes.setDate(lunes.getDate() + diferencia);

    const labelRango = document.getElementById('rango-semana-label');
    if (labelRango) {
        labelRango.textContent = lunes.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
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
                    <div class="evento-item ${e.done ? 'done' : ''}" onclick="clickEvento('${iso}', ${idx})">
                        <span class="evento-hora">${e.hora || '--:--'}</span>
                        <span class="evento-texto">${e.tarea}</span>
                    </div>
                `).join('')}
            </div>
        `;
        cont.appendChild(fila);
    }
}

// 3. Manejo de clicks en eventos (Tachar o Preparar Edición)
function clickEvento(fecha, index) {
    const menuAbierto = !document.getElementById('input-container-agenda').classList.contains('hidden');
    const evs = JSON.parse(localStorage.getItem(`agenda_${fecha}`));

    if (menuAbierto) {
        eventoEditando = { fecha, index };
        document.getElementById('agenda-tarea').value = evs[index].tarea;
        document.getElementById('agenda-fecha').value = fecha;
        document.getElementById('agenda-hora').value = evs[index].hora;
        document.getElementById('agenda-tarea').focus();
    } else {
        evs[index].done = !evs[index].done;
        localStorage.setItem(`agenda_${fecha}`, JSON.stringify(evs));
        renderizarSemana();
    }
}

// 4. Guardar, Editar o Borrar
function agregarEvento() {
    const tarea = document.getElementById('agenda-tarea').value.trim();
    const fecha = document.getElementById('agenda-fecha').value;
    const hora = document.getElementById('agenda-hora').value;

    if (!tarea && eventoEditando) {
        let evs = JSON.parse(localStorage.getItem(`agenda_${eventoEditando.fecha}`));
        evs.splice(eventoEditando.index, 1);
        localStorage.setItem(`agenda_${eventoEditando.fecha}`, JSON.stringify(evs));
    } else if (fecha && tarea) {
        if (eventoEditando) {
            let evsViejos = JSON.parse(localStorage.getItem(`agenda_${eventoEditando.fecha}`));
            evsViejos.splice(eventoEditando.index, 1);
            localStorage.setItem(`agenda_${eventoEditando.fecha}`, JSON.stringify(evsViejos));
        }
        const evsNuevos = JSON.parse(localStorage.getItem(`agenda_${fecha}`)) || [];
        evsNuevos.push({ tarea, hora, done: false });
        localStorage.setItem(`agenda_${fecha}`, JSON.stringify(evsNuevos));
    }

    cerrarEditorAgenda();
    renderizarSemana();
}

function cerrarEditorAgenda() {
    document.getElementById('input-container-agenda').classList.add('hidden');
    document.getElementById('agenda-tarea').value = "";
    eventoEditando = null;
}

function limpiarAgendaCompletada() {
    if (!confirm("¿Borrar actividades tachadas?")) return;
    for (let i = 0; i < 21; i++) { 
        let d = new Date(fechaReferenciaAgenda);
        d.setDate(d.getDate() - 7 + i);
        const iso = d.toISOString().split('T')[0];
        let evs = JSON.parse(localStorage.getItem(`agenda_${iso}`));
        if (evs) {
            evs = evs.filter(e => !e.done);
            localStorage.setItem(`agenda_${iso}`, JSON.stringify(evs));
        }
    }
    renderizarSemana();
}

// 5. El toque astronómico
function obtenerIconoLuna(f) {
    const lunas = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
    const cicloSinergico = 29.53059;
    const fechaBase = new Date("2024-01-11"); 
    const msPorDia = 86400000;
    const diasTranscurridos = (f - fechaBase) / msPorDia;
    const posicionCiclo = (diasTranscurridos % cicloSinergico + cicloSinergico) % cicloSinergico;
    const index = Math.floor((posicionCiclo / cicloSinergico) * 8);
    return lunas[index] || "🌙";
}



/* --- LÓGICA DEL CICLO MENSTRUAL --- */
let inicioUltimoCiclo = new Date("2026-04-30T00:00:00"); // Tu fecha base

function renderizarRueda() {
    const rueda = document.getElementById('rueda-menstrual');
    if (!rueda) return;

    // Limpiar pero mantener el centro
    const centro = rueda.querySelector('.centro-rueda');
    rueda.innerHTML = '';
    rueda.appendChild(centro);

    const registros = JSON.parse(localStorage.getItem('journal_ciclo_registros')) || {};
    const hoy = new Date();
    
    // Dibujaremos 28 días (puedes ajustarlo)
    const totalDiasRueda = 28;
    const radio = 130; // Distancia del centro

    for (let i = 0; i < totalDiasRueda; i++) {
        let fechaDia = new Date(inicioUltimoCiclo);
        fechaDia.setDate(inicioUltimoCiclo.getDate() + i);
        const iso = fechaDia.toISOString().split('T')[0];
        const reg = registros[iso];

        const div = document.createElement('div');
        div.className = 'dia-rueda';
        
        // Posicionamiento matemático circular
        const angulo = (i * (360 / totalDiasRueda) - 90) * (Math.PI / 180);
        const x = radio * Math.cos(angulo);
        const y = radio * Math.sin(angulo);
        div.style.transform = `translate(${x}px, ${y}px)`;

        // Contenido del día: Luna + Número
        const luna = obtenerIconoLuna(fechaDia);
        div.innerHTML = `<span>${luna}</span><small>${fechaDia.getDate()}</small>`;

        // Indicadores (Puntitos)
        if (reg) {
            if (reg.sangrado) div.innerHTML += '<div class="punto-menstruacion"></div>';
            if (reg.relaciones) div.innerHTML += '<div class="punto-sexo"></div>';
        }

        // Si es el día de hoy, resaltarlo
        if (iso === hoy.toISOString().split('T')[0]) {
            div.style.color = 'var(--accent-color)';
            div.style.fontWeight = 'bold';
            document.getElementById('dia-ciclo-actual').textContent = `Día ${i + 1}`;
            document.getElementById('fecha-rueda-centro').textContent = fechaDia.toLocaleDateString('es-ES', {day:'numeric', month:'short'});
        }

        div.onclick = () => abrirFormularioCiclo(iso);
        rueda.appendChild(div);
    }
}

function abrirFormularioCiclo(fechaIso) {
    document.getElementById('modal-registro-ciclo').classList.remove('hidden');
    document.getElementById('ciclo-fecha-input').value = fechaIso;
    
    // Cargar datos si ya existen
    const registros = JSON.parse(localStorage.getItem('journal_ciclo_registros')) || {};
    const reg = registros[fechaIso] || {};
    
    document.getElementById('ciclo-sangrado').value = reg.sangrado || "";
    document.getElementById('ciclo-dolor').value = reg.dolor || "";
    document.getElementById('ciclo-relaciones').checked = reg.relaciones || false;
    document.getElementById('ciclo-energia').value = reg.energia || "3";
    document.getElementById('ciclo-libido').value = reg.libido || "media";
    document.getElementById('ciclo-animo').value = reg.animo || "tranquila";
    document.getElementById('ciclo-sueno-inicio').value = reg.sueno_ini || "";
    document.getElementById('ciclo-sueno-fin').value = reg.sueno_fin || "";
}

function guardarRegistroCiclo() {
    const fecha = document.getElementById('ciclo-fecha-input').value;
    if (!fecha) return;

    const registros = JSON.parse(localStorage.getItem('journal_ciclo_registros')) || {};
    
    registros[fecha] = {
        sangrado: document.getElementById('ciclo-sangrado').value,
        dolor: document.getElementById('ciclo-dolor').value,
        relaciones: document.getElementById('ciclo-relaciones').checked,
        energia: document.getElementById('ciclo-energia').value,
        libido: document.getElementById('ciclo-libido').value,
        animo: document.getElementById('ciclo-animo').value,
        sueno_ini: document.getElementById('ciclo-sueno-inicio').value,
        sueno_fin: document.getElementById('ciclo-sueno-fin').value
    };

    localStorage.setItem('journal_ciclo_registros', JSON.stringify(registros));
    document.getElementById('modal-registro-ciclo').classList.add('hidden');
    renderizarRueda();
}