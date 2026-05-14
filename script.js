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
        btnMetasMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            metasDropdown.classList.toggle('hidden');
        });
    }

    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', () => {
        if (metasDropdown) metasDropdown.classList.add('hidden');
    });

    // Opciones del menú
    document.getElementById('opt-add-meta').addEventListener('click', activarEscrituraMeta);
    document.getElementById('opt-historial-metas').addEventListener('click', toggleHistorialMetas);

    // Carga inicial
    cargarMetas();


    // Escuchadores para Hábitos
    document.getElementById('btn-add-habito').addEventListener('click', agregarHabito);
    document.getElementById('btn-ver-historial-habitos').addEventListener('click', toggleHistorialHabitos);
    
    // Cargar hábitos al iniciar
    cargarHabitos();

    // Escuchadores para To-Do List
    document.getElementById('btn-add-tarea').addEventListener('click', agregarTarea);
    document.getElementById('btn-limpiar-completadas').addEventListener('click', limpiarTareasCompletadas);
    
    // Cargar tareas al iniciar
    cargarTareas();

    // --- Listeners de la Agenda ---
    const btnAddEvento = document.getElementById('btn-add-evento');
    if (btnAddEvento) btnAddEvento.addEventListener('click', agregarEvento);

    const btnPrev = document.getElementById('btn-semana-prev');
    if (btnPrev) btnPrev.addEventListener('click', () => navegarSemana(-7));

    const btnNext = document.getElementById('btn-semana-next');
    if (btnNext) btnNext.addEventListener('click', () => navegarSemana(7));


    // --- Listener Ciclo Menstrual ---
    const btnGuardarCiclo = document.getElementById('btn-guardar-ciclo');
    if (btnGuardarCiclo) btnGuardarCiclo.addEventListener('click', guardarDatosCiclo);
    
    // Poner fecha de hoy por defecto
    const inputFecha = document.getElementById('ciclo-fecha');
    if(inputFecha) inputFecha.value = new Date().toISOString().split('T')[0];
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

/* --- LÓGICA DE METAS --- */

function cargarMetas() {
    const anio = new Date().getFullYear();
    const labelAnio = document.getElementById('meta-year-label');
    if(labelAnio) labelAnio.textContent = anio;
    
    const metas = JSON.parse(localStorage.getItem(`journal_metas_${anio}`)) || [];
    const lista = document.getElementById('lista-metas');
    if(!lista) return;

    lista.innerHTML = "";
    metas.forEach((m, index) => {
        const li = document.createElement('li');
        li.className = `meta-item ${m.completada ? 'completed' : ''}`;
        li.textContent = m.texto;
        li.onclick = () => {
            m.completada = !m.completada;
            localStorage.setItem(`journal_metas_${anio}`, JSON.stringify(metas));
            cargarMetas();
        };
        lista.appendChild(li);
    });

    // Asegurar que el input esté oculto al recargar la vista
    document.getElementById('input-container-meta').classList.add('hidden');
}

function activarEscrituraMeta() {
    const container = document.getElementById('input-container-meta');
    const input = document.getElementById('input-nueva-meta');
    const anio = new Date().getFullYear();
    const metas = JSON.parse(localStorage.getItem(`journal_metas_${anio}`)) || [];

    container.classList.remove('hidden');
    document.getElementById('next-number-meta').textContent = (metas.length + 1) + ".";
    input.focus();

    input.onkeydown = (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
            metas.push({ texto: input.value.trim(), completada: false });
            localStorage.setItem(`journal_metas_${anio}`, JSON.stringify(metas));
            input.value = "";
            cargarMetas(); // Esto actualiza la lista y oculta el input
        }
        if (e.key === 'Escape') {
            container.classList.add('hidden');
        }
    };
}

function toggleHistorialMetas() {
    const container = document.getElementById('historial-metas-container');
    container.classList.toggle('hidden');
    if (!container.classList.contains('hidden')) {
        container.innerHTML = "<h3 style='font-size:1rem; opacity:0.7;'>Historial cargado</h3>";
        // Aquí puedes expandir la lógica para leer otros años de LocalStorage
    }
}

/* --- FUNCIONES DE HÁBITOS --- */

function obtenerClaveMes() {
    const fecha = new Date();
    // Crea una clave como "2026-05" (Año-Mes)
    return `journal_habits_${fecha.getFullYear()}_${fecha.getMonth() + 1}`;
}

function cargarHabitos() {
    const clave = obtenerClaveMes();
    const fecha = new Date();
    const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    document.getElementById('habit-month-label').textContent = nombresMeses[fecha.getMonth()];
    
    const habitos = JSON.parse(localStorage.getItem(clave)) || [];
    const contenedor = document.getElementById('contenedor-habitos');
    contenedor.innerHTML = "";

    // Calculamos cuántos días tiene el mes actual
    const diasEnMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();

    habitos.forEach((habito) => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'habit-card';
        
        let puntosHTML = "";
        for (let d = 1; d <= diasEnMes; d++) {
            const isChecked = habito.completados.includes(d) ? 'checked' : '';
            puntosHTML += `
                <div class="habit-dot-wrapper" onclick="alternarDiaHabito('${habito.id}', ${d})">
                    <div class="habit-dot ${isChecked}"></div>
                    <span class="dot-day">${d}</span>
                </div>`;
        }

        tarjeta.innerHTML = `
            <div class="habit-header">
                <span class="habit-name">${habito.nombre}</span>
                <button class="btn-delete-habit" onclick="eliminarHabito('${habito.id}')">Eliminar</button>
            </div>
            <div class="dots-container">${puntosHTML}</div>
        `;
        contenedor.appendChild(tarjeta);
    });
}

function agregarHabito() {
    const input = document.getElementById('input-nuevo-habito');
    const nombre = input.value.trim();
    if (!nombre) return;

    const clave = obtenerClaveMes();
    const habitos = JSON.parse(localStorage.getItem(clave)) || [];
    
    habitos.push({
        id: 'h-' + Date.now(),
        nombre: nombre,
        completados: [] // Guardará los números de los días marcados
    });

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

function eliminarHabito(id) {
    if (confirm("¿Seguro que quieres eliminar este hábito del mes actual?")) {
        const clave = obtenerClaveMes();
        let habitos = JSON.parse(localStorage.getItem(clave));
        habitos = habitos.filter(h => h.id !== id);
        localStorage.setItem(clave, JSON.stringify(habitos));
        cargarHabitos();
    }
}

function toggleHistorialHabitos() {
    const contenedor = document.getElementById('historial-habitos');
    contenedor.classList.toggle('hidden');
    if (!contenedor.classList.contains('hidden')) mostrarHistorialHabitos();
}

function mostrarHistorialHabitos() {
    const contenedor = document.getElementById('historial-habitos');
    contenedor.innerHTML = "";
    const claveActual = obtenerClaveMes();

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('journal_habits_') && key !== claveActual) {
            const [, , anio, mes] = key.split('_');
            const datos = JSON.parse(localStorage.getItem(key));
            
            const div = document.createElement('div');
            div.className = 'config-group';
            div.style.marginTop = "10px";
            div.innerHTML = `<h4>Mes: ${mes}/${anio}</h4>`;
            datos.forEach(h => {
                const porcentaje = Math.round((h.completados.length / 30) * 100);
                div.innerHTML += `<p>${h.nombre}: ${h.completados.length} días (${porcentaje}%)</p>`;
            });
            contenedor.appendChild(div);
        }
    }
}

/* --- FUNCIONES TO-DO LIST --- */

function cargarTareas() {
    const tareas = JSON.parse(localStorage.getItem('journal_todo')) || [];
    const lista = document.getElementById('lista-tareas');
    lista.innerHTML = "";

    tareas.forEach((tarea, index) => {
        const li = document.createElement('li');
        li.className = `todo-item ${tarea.completada ? 'done' : ''}`;
        
        li.innerHTML = `
            <div class="todo-check ${tarea.completada ? 'active' : ''}" onclick="alternarTarea(${index})"></div>
            <span onclick="alternarTarea(${index})">${tarea.texto}</span>
        `;
        lista.appendChild(li);
    });
}

function agregarTarea() {
    const input = document.getElementById('input-nueva-tarea');
    const texto = input.value.trim();
    if (!texto) return;

    const tareas = JSON.parse(localStorage.getItem('journal_todo')) || [];
    tareas.push({ texto: texto, completada: false });
    
    localStorage.setItem('journal_todo', JSON.stringify(tareas));
    input.value = "";
    cargarTareas();
}

function alternarTarea(index) {
    const tareas = JSON.parse(localStorage.getItem('journal_todo'));
    tareas[index].completada = !tareas[index].completada;
    localStorage.setItem('journal_todo', JSON.stringify(tareas));
    cargarTareas();
}

function limpiarTareasCompletadas() {
    let tareas = JSON.parse(localStorage.getItem('journal_todo')) || [];
    const antes = tareas.length;
    
    // Filtramos para quedarnos solo con las que NO están completadas
    tareas = tareas.filter(t => !t.completada);
    
    const despues = tareas.length;
    if (antes === despues) {
        alert("No hay tareas completadas para eliminar.");
        return;
    }

    if (confirm(`¿Quieres eliminar ${antes - despues} tareas terminadas?`)) {
        localStorage.setItem('journal_todo', JSON.stringify(tareas));
        cargarTareas();
    }
}

/* ============================================================
   LÓGICA DE LA AGENDA (Estilo 43586.jpg)
   ============================================================ */

// Variable global para controlar qué semana estamos viendo
let fechaReferenciaAgenda = new Date(); 

function navegarSemana(dias) {
    fechaReferenciaAgenda.setDate(fechaReferenciaAgenda.getDate() + dias);
    renderizarSemana();
}

function renderizarSemana() {
    const cont = document.getElementById('semana-container');
    if (!cont) return;
    
    cont.innerHTML = "";
    
    // Calculamos el lunes de la semana actual
    let lunes = new Date(fechaReferenciaAgenda);
    const diaSemana = lunes.getDay();
    const diferencia = (diaSemana === 0 ? -6 : 1 - diaSemana);
    lunes.setDate(lunes.getDate() + diferencia);

    // Actualizamos el título del mes/año en la cabecera
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
        
        // Creamos la fila inspirada en la imagen 43586.jpg
        const fila = document.createElement('div');
        fila.className = `dia-fila ${i === 6 ? 'domingo' : ''}`;
        
        fila.innerHTML = `
            <div class="dia-info">
                <span class="dia-nombre">${nombresDias[i]}</span>
                <span class="dia-numero">${d.getDate()}</span>
                <span class="dia-luna">${obtenerIconoLuna(d)}</span>
            </div>
            <div class="dia-eventos">
                ${evs.sort((a, b) => a.hora.localeCompare(b.hora)).map(e => `
                    <div class="evento-item">
                        ${e.hora ? `<span class="evento-hora">${e.hora}</span>` : ''}
                        <span class="evento-texto">${e.tarea}</span>
                    </div>
                `).join('')}
            </div>
        `;
        cont.appendChild(fila);
    }
}

function agregarEvento() {
    const tarea = document.getElementById('agenda-tarea').value;
    const fecha = document.getElementById('agenda-fecha').value;
    const hora = document.getElementById('agenda-hora').value;

    if (!tarea || !fecha) {
        alert("Por favor, introduce al menos la actividad y la fecha.");
        return;
    }

    const evs = JSON.parse(localStorage.getItem(`agenda_${fecha}`)) || [];
    evs.push({ tarea, hora });
    localStorage.setItem(`agenda_${fecha}`, JSON.stringify(evs));

    // Limpiar input y refrescar vista
    document.getElementById('agenda-tarea').value = "";
    renderizarSemana();
}

function obtenerIconoLuna(f) {
    const lunas = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
    const cicloSinergico = 29.53059;
    const fechaBase = new Date("2024-01-11"); // Luna nueva de referencia
    const msPorDia = 86400000;
    
    const diasTranscurridos = (f - fechaBase) / msPorDia;
    const posicionCiclo = (diasTranscurridos % cicloSinergico + cicloSinergico) % cicloSinergico;
    const index = Math.floor((posicionCiclo / cicloSinergico) * 8);
    
    return lunas[index] || "🌙";
}


function guardarDatosCiclo() {
    const fecha = document.getElementById('ciclo-fecha').value;
    const esInicio = document.getElementById('ciclo-inicio-regla').checked;
    
    if (!fecha) return alert("Selecciona una fecha");

    const registro = {
        fecha,
        regla: esInicio,
        flujo: document.getElementById('ciclo-flujo').value,
        color: document.getElementById('ciclo-color').value,
        salud: {
            pelvico: document.getElementById('check-pelvico').checked,
            migrana: document.getElementById('check-migrana').checked,
            sueno: document.getElementById('ciclo-sueno').value,
            energia: document.getElementById('ciclo-energia').value,
            digestion: document.getElementById('ciclo-digestion').value,
            sexo: document.getElementById('check-sexo').checked
        },
        animo: {
            libido: document.getElementById('check-libido').checked,
            irritabilidad: document.getElementById('check-irritabilidad').checked,
            ansiedad: document.getElementById('check-ansiedad').checked,
            paz: document.getElementById('check-paz').checked
        },
        notas: document.getElementById('ciclo-notas').value
    };

    // Obtener todos los registros y añadir el nuevo
    let todosLosRegistros = JSON.parse(localStorage.getItem('journal_ciclo_raw')) || [];
    // Evitar duplicados de fecha
    todosLosRegistros = todosLosRegistros.filter(r => r.fecha !== fecha);
    todosLosRegistros.push(registro);
    // Ordenar por fecha
    todosLosRegistros.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
    localStorage.setItem('journal_ciclo_raw', JSON.stringify(todosLosRegistros));
    alert("Día registrado");
    cargarCicloActual();
}

function cargarCicloActual() {
    const cont = document.getElementById('historial-ciclos-tablas');
    if (!cont) return;
    cont.innerHTML = "<h3>📊 Historial de Ciclos</h3>";

    const registros = JSON.parse(localStorage.getItem('journal_ciclo_raw')) || [];
    if (registros.length === 0) return;

    let ciclosAgrupados = [];
    let cicloActual = [];

    registros.forEach(r => {
        if (r.regla && cicloActual.length > 0) {
            ciclosAgrupados.push(cicloActual);
            cicloActual = [];
        }
        cicloActual.push(r);
    });
    ciclosAgrupados.push(cicloActual); // Añadir el último ciclo en curso

    // Crear tablas (de la más reciente a la más antigua)
    ciclosAgrupados.reverse().forEach((ciclo, index) => {
        const titulo = `Ciclo iniciado el ${ciclo[0].fecha}`;
        let tablaHTML = `
            <div class="tabla-ciclo-wrapper">
                <h4>${titulo}</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th><th>🩸</th><th>Salud</th><th>Ánimo</th><th>Notas</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ciclo.map(d => `
                            <tr>
                                <td>${d.fecha.split('-')[2]}</td>
                                <td>${d.flujo || '-'} ${d.color || ''}</td>
                                <td>${d.salud.pelvico?'Pélvico ':''}${d.salud.migrana?'Migraña ':''}${d.salud.energia}</td>
                                <td>${d.animo.paz?'Paz ':''}${d.animo.ansiedad?'Ansiedad ':''}</td>
                                <td>${d.notas}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>`;
        cont.innerHTML += tablaHTML;
    });
}