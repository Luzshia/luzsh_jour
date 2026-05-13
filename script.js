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

/* --- NAVEGACIÓN POR GESTOS (CORREGIDA) --- */

// Detecta el gesto de atrás del teléfono
window.onpopstate = function(event) {
    // Si hay un estado guardado, navegamos a él, si no, por defecto al menú
    const destino = (event.state && event.state.page) ? event.state.page : 'menu';
    ejecutarCambioVisual(destino);
};

function navegar(pantalla) {
    // Guardamos la nueva página en el historial
    history.pushState({ page: pantalla }, "", `#${pantalla}`);
    ejecutarCambioVisual(pantalla);
}

function ejecutarCambioVisual(pantalla) {
    // Ocultar todo
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    
    // Mostrar la sección correspondiente
    const vistaDestino = document.getElementById(`view-${pantalla}`);
    if (vistaDestino) {
        vistaDestino.classList.add('active');
        // Si volvemos al menú, nos aseguramos que el año se actualice si es necesario
        if (pantalla === 'menu') {
            const labelAnio = document.getElementById('year-label');
            if (labelAnio) labelAnio.textContent = new Date().getFullYear();
        }
    }
    // Scroll al inicio para que la nueva pantalla no aparezca a mitad de página
    window.scrollTo(0, 0);
}

/* --- MODO OSCURO --- */
function cambiarTema() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('journalDarkMode', document.body.classList.contains('dark-mode'));
}

if (localStorage.getItem('journalDarkMode') === 'true') {
    document.body.classList.add('dark-mode');
}