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