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

    // Escuchadores para Metas
    document.getElementById('btn-add-meta').addEventListener('click', agregarMeta);
    document.getElementById('btn-ver-historial').addEventListener('click', toggleHistorialMetas);
    
    // Cargar metas al iniciar
    cargarMetas();

    // Escuchadores para Hábitos
    document.getElementById('btn-add-habito').addEventListener('click', agregarHabito);
    document.getElementById('btn-ver-historial-habitos').addEventListener('click', toggleHistorialHabitos);
    
    // Cargar hábitos al iniciar
    cargarHabitos();
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

/* --- FUNCIONES DE METAS --- */

function cargarMetas() {
    const anio = new Date().getFullYear();
    document.getElementById('meta-year-label').textContent = anio;
    
    // Estructura en LocalStorage: journal_metas_2026, journal_metas_2027...
    const metasGuardadas = JSON.parse(localStorage.getItem(`journal_metas_${anio}`)) || [];
    const lista = document.getElementById('lista-metas');
    lista.innerHTML = "";

    metasGuardadas.forEach((meta, index) => {
        const li = document.createElement('li');
        li.className = `meta-item ${meta.completada ? 'completed' : ''}`;
        li.textContent = meta.texto;
        li.onclick = () => alternarMeta(index);
        lista.appendChild(li);
    });
}

function agregarMeta() {
    const input = document.getElementById('input-nueva-meta');
    const texto = input.value.trim();
    if (!texto) return;

    const anio = new Date().getFullYear();
    const metas = JSON.parse(localStorage.getItem(`journal_metas_${anio}`)) || [];
    
    metas.push({ texto: texto, completada: false });
    localStorage.setItem(`journal_metas_${anio}`, JSON.stringify(metas));
    
    input.value = "";
    cargarMetas();
}

function alternarMeta(index) {
    const anio = new Date().getFullYear();
    const metas = JSON.parse(localStorage.getItem(`journal_metas_${anio}`));
    
    metas[index].completada = !metas[index].completada;
    localStorage.setItem(`journal_metas_${anio}`, JSON.stringify(metas));
    cargarMetas();
}

function toggleHistorialMetas() {
    const contenedor = document.getElementById('historial-metas');
    if (contenedor.classList.contains('hidden')) {
        contenedor.classList.remove('hidden');
        mostrarHistorialMetas();
    } else {
        contenedor.classList.add('hidden');
    }
}

function mostrarHistorialMetas() {
    const contenedor = document.getElementById('historial-metas');
    contenedor.innerHTML = "";
    const anioActual = new Date().getFullYear();

    // Buscamos en el almacenamiento años anteriores
    for (let key in localStorage) {
        if (key.startsWith('journal_metas_')) {
            const anioMeta = key.split('_')[2];
            if (anioMeta != anioActual) {
                const metas = JSON.parse(localStorage.getItem(key));
                const divAnio = document.createElement('div');
                divAnio.innerHTML = `<h4>Año ${anioMeta}</h4>`;
                metas.forEach(m => {
                    divAnio.innerHTML += `<p style="${m.completada ? 'text-decoration:line-through' : ''}">- ${m.texto}</p>`;
                });
                contenedor.appendChild(divAnio);
            }
        }
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