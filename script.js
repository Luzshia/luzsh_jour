/* --- CONFIGURACIÓN INICIAL --- */
let pinIngresado = "";
const PIN_CORRECTO = localStorage.getItem('journalPin') || "1707"; // PIN por defecto
const anioActual = new Date().getFullYear();

/* --- AL CARGAR EL DOCUMENTO --- */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inyectar el año dinámico
    document.getElementById('year-label').textContent = anioActual;

    // 2. Configurar el Teclado Numérico
    document.querySelectorAll('.num-btn[data-val]').forEach(boton => {
        boton.addEventListener('click', () => {
            if (pinIngresado.length < 4) {
                pinIngresado += boton.getAttribute('data-val');
                actualizarInterfazPin();
            }
        });
    });

    // 3. Botón Borrar (C)
    document.getElementById('btn-clear').addEventListener('click', () => {
        pinIngresado = "";
        actualizarInterfazPin();
    });

    // 4. Botón Enter (✔)
    document.getElementById('btn-enter').addEventListener('click', validarPin);

    // 5. Configurar Navegación del Menú
    document.getElementById('go-metas').addEventListener('click', () => navegar('metas'));
    document.getElementById('go-habitos').addEventListener('click', () => navegar('habitos'));
    document.getElementById('go-todo').addEventListener('click', () => navegar('todo'));
    document.getElementById('go-agenda').addEventListener('click', () => navegar('agenda'));
    document.getElementById('go-ciclo').addEventListener('click', () => navegar('ciclo'));
    document.getElementById('go-config').addEventListener('click', () => navegar('config'));
});

/* --- FUNCIONES DE SEGURIDAD --- */
function actualizarInterfazPin() {
    // Llenar o vaciar los circulitos según el PIN ingresado
    for (let i = 1; i <= 4; i++) {
        const slot = document.getElementById(`slot-${i}`);
        if (i <= pinIngresado.length) {
            slot.classList.add('filled');
        } else {
            slot.classList.remove('filled');
        }
    }
}

function validarPin() {
    if (pinIngresado === PIN_CORRECTO) {
        document.getElementById('lock-screen').style.display = 'none';
    } else {
        alert("PIN Incorrecto. Intenta de nuevo.");
        pinIngresado = "";
        actualizarInterfazPin();
    }
}

/* --- FUNCIÓN DE NAVEGACIÓN --- */
function navegar(pantalla) {
    // Ocultar todas las vistas
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    
    // Mostrar la seleccionada
    const vistaDestino = document.getElementById(`view-${pantalla}`);
    if (vistaDestino) {
        vistaDestino.classList.add('active');
    }
}

/* --- FUNCIÓN PARA EL MODO OSCURO (Para usar después en Ajustes) --- */
function cambiarTema() {
    document.body.classList.toggle('dark-mode');
    const esOscuro = document.body.classList.contains('dark-mode');
    localStorage.setItem('journalDarkMode', esOscuro);
}

// Mantener el tema elegido al recargar
if (localStorage.getItem('journalDarkMode') === 'true') {
    document.body.classList.add('dark-mode');
}