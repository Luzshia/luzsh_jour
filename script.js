/* --- SISTEMA GLOBAL DE GESTIÓN DIARIO --- */
document.addEventListener('DOMContentLoaded', () => {
    
    // Configuración Inicial y PIN
    let pinIngresado = "";
    const PIN_CORRECTO = localStorage.getItem('journalPin') || "1707";
    
    // CORRECCIÓN VITAL: Cambiado a "true" explícito para que por defecto arranque desactivado (false)
    let pinProteccionActiva = localStorage.getItem('journalPinActivo') === "true";

    if (!pinProteccionActiva) {
        const lockScreen = document.getElementById('lock-screen');
        if (lockScreen) lockScreen.classList.add('hidden');
    }

    // Estados de navegación y edición de vistas
    let vistaActual = "menu";
    let modoEdicionActivo = false;
    let diaSeleccionadoCiclo = new Date().toISOString().split('T')[0];
    let fechaSemanaAgenda = new Date();

    // Referencias del DOM
    const appZone = document.getElementById('main-app-zone');
    const globalFab = document.getElementById('global-fab-add');
    const modalGlobal = document.getElementById('notebook-global-modal');
    const injectorCampos = document.getElementById('modal-fields-injector');

    // Inicializar Fechas Dinámicas Automáticas
    const anioActual = new Date().getFullYear();
    const mesActualId = new Date().getMonth() + 1; // 1-12
    const nombresMeses = [Constants?.nombresMeses || "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    /* --- CORRECCIÓN: CAPTURA DE TECLADO NUMÉRICO DEL PIN --- */
    document.querySelectorAll('.num-btn[data-val]').forEach(boton => {
        boton.onclick = () => {
            if (pinIngresado.length < 4) {
                pinIngresado += boton.getAttribute('data-val');
                actualizarInterfazPin();
                
                // Validación automática estricta al completar la longitud requerida
                if (pinIngresado.length === 4) {
                    setTimeout(() => {
                        if (pinIngresado === PIN_CORRECTO) {
                            const lock = document.getElementById('lock-screen');
                            if (lock) lock.classList.add('hidden');
                            pinIngresado = "";
                            actualizarInterfazPin();
                        } else {
                            alert("PIN Incorrecto. Inténtalo de nuevo.");
                            pinIngresado = "";
                            actualizarInterfazPin();
                        }
                    }, 200);
                }
            }
        };
    });

    function actualizarInterfazPin() {
        for (let i = 1; i <= 4; i++) {
            const slot = document.getElementById(`slot-${i}`);
            if (slot) {
                if (i <= pinIngresado.length) {
                    slot.classList.add('filled');
                } else {
                    slot.classList.remove('filled');
                }
            }
        }
    }

    /* --- GESTOR DE NAVEGACIÓN SINGLE PAGE (SPA) --- */
    document.querySelectorAll('.menu-grid-card[data-target]').forEach(card => {
        card.onclick = () => {
            vistaActual = card.getAttribute('data-target');
            if (appZone) appZone.setAttribute('data-current-view', vistaActual);
            renderizarVistaActual();
        };
    });

    document.querySelectorAll('.btn-back-menu').forEach(btn => {
        btn.onclick = () => {
            vistaActual = "menu";
            if (appZone) appZone.setAttribute('data-current-view', "menu");
            renderizarVistaActual();
        };
    });

    function renderizarVistaActual() {
        // Ocultar FAB por defecto, solo visible en módulos específicos
        if (globalFab) globalFab.classList.add('hidden');

        if (vistaActual === "ciclo") {
            dibujarRueda();
        } else if (vistaActual === "habitos") {
            if (globalFab) globalFab.classList.remove('hidden');
            renderizarHabitos();
        } else if (vistaActual === "agenda") {
            if (globalFab) globalFab.classList.remove('hidden');
            renderizarAgendaSemanal();
        } else if (vistaActual === "todo") {
            if (globalFab) globalFab.classList.remove('hidden');
            renderizarTodoList();
        } else if (vistaActual === "notas") {
            if (globalFab) globalFab.classList.remove('hidden');
            renderizarNotasGrid();
        } else if (vistaActual === "config") {
            sincronizarControlesConfig();
        }
    }

    /* --- INTERFAZ DINÁMICA: MODAL GLOBAL UNIFICADO --- */
    if (globalFab) {
        globalFab.onclick = () => {
            modoEdicionActivo = false;
            abrirModalFormulario();
        };
    }

    function abrirModalFormulario(datosEdicion = null) {
        if (!modalGlobal || !injectorCampos) return;
        injectorCampos.innerHTML = "";
        modoEdicionActivo = !!datosEdicion;

        let contenidoHTML = "";

        if (vistaActual === "habitos") {
            contenidoHTML = `
                <div class="modal-form-header">
                    <h2>${modoEdicionActivo ? "📝 Editar Hábito" : "✨ Nuevo Hábito"}</h2>
                </div>
                <div class="modal-form-body">
                    <div class="clean-input-group">
                        <label>Nombre del hábito:</label>
                        <input type="text" id="habito-nombre" placeholder="Ej: Beber 2L Agua" value="${datosEdicion ? datosEdicion.nombre : ""}">
                    </div>
                    <button type="button" class="modal-save-btn" id="modal-submit-action">Guardar</button>
                    <button type="button" class="modal-save-btn" style="background:transparent; color:var(--text-color); margin-top:4px;" id="modal-cancel-action">Cancelar</button>
                </div>
            `;
        } else if (vistaActual === "agenda") {
            contenidoHTML = `
                <div class="modal-form-header">
                    <h2>${modoEdicionActivo ? "📝 Editar Evento" : "📅 Nuevo Evento"}</h2>
                </div>
                <div class="modal-form-body">
                    <div class="clean-input-group">
                        <label>Fecha:</label>
                        <input type="date" id="agenda-fecha" value="${datosEdicion ? datosEdicion.fecha : diaSeleccionadoCiclo}">
                    </div>
                    <div class="clean-input-group">
                        <label>Hora:</label>
                        <input type="time" id="agenda-hora" value="${datosEdicion ? datosEdicion.hora : "12:00"}">
                    </div>
                    <div class="clean-input-group">
                        <label>Descripción del Evento:</label>
                        <textarea id="agenda-texto" rows="3" placeholder="Escribe aquí...">${datosEdicion ? datosEdicion.texto : ""}</textarea>
                    </div>
                    <button type="button" class="modal-save-btn" id="modal-submit-action">Guardar</button>
                    <button type="button" class="modal-save-btn" style="background:transparent; color:var(--text-color); margin-top:4px;" id="modal-cancel-action">Cancelar</button>
                </div>
            `;
        } else if (vistaActual === "todo") {
            contenidoHTML = `
                <div class="modal-form-header">
                    <h2>${modoEdicionActivo ? "📝 Editar Tarea" : "✅ Nueva Tarea"}</h2>
                </div>
                <div class="modal-form-body">
                    <div class="clean-input-group">
                        <label>Tarea pendiente:</label>
                        <input type="text" id="todo-texto" placeholder="Ej: Comprar fruta" value="${datosEdicion ? datosEdicion.texto : ""}">
                    </div>
                    <div class="clean-input-group">
                        <label>Prioridad:</label>
                        <select id="todo-prioridad">
                            <option value="baja" ${datosEdicion && datosEdicion.prioridad === "baja" ? "selected" : ""}>Baja</option>
                            <option value="media" ${datosEdicion && datosEdicion.prioridad === "media" ? "selected" : (datosEdicion ? "" : "selected")}>Media</option>
                            <option value="alta" ${datosEdicion && datosEdicion.prioridad === "alta" ? "selected" : ""}>Alta</option>
                        </select>
                    </div>
                    <button type="button" class="modal-save-btn" id="modal-submit-action">Guardar</button>
                    <button type="button" class="modal-save-btn" style="background:transparent; color:var(--text-color); margin-top:4px;" id="modal-cancel-action">Cancelar</button>
                </div>
            `;
        } else if (vistaActual === "notas") {
            contenidoHTML = `
                <div class="modal-form-header">
                    <h2>${modoEdicionActivo ? "📝 Editar Nota" : "📌 Nueva Nota"}</h2>
                </div>
                <div class="modal-form-body">
                    <div class="clean-input-group">
                        <label>Título:</label>
                        <input type="text" id="nota-titulo" placeholder="Idea, pensamiento..." value="${datosEdicion ? datosEdicion.titulo : ""}">
                    </div>
                    <div class="clean-input-group">
                        <label>Contenido:</label>
                        <textarea id="nota-cuerpo" rows="6" placeholder="Desarrolla tu nota aquí...">${datosEdicion ? datosEdicion.cuerpo : ""}</textarea>
                    </div>
                    <button type="button" class="modal-save-btn" id="modal-submit-action">Guardar Nota</button>
                    <button type="button" class="modal-save-btn" style="background:transparent; color:var(--text-color); margin-top:4px;" id="modal-cancel-action">Cancelar</button>
                </div>
            `;
        }

        injectorCampos.innerHTML = contenidoHTML;
        modalGlobal.classList.remove('hidden');

        document.getElementById('modal-cancel-action').onclick = () => {
            modalGlobal.classList.add('hidden');
        };

        document.getElementById('modal-submit-action').onclick = () => {
            procesarGuardadoModalGlobal(datosEdicion?.index ?? datosEdicion?.id ?? null);
        };
    }

    function procesarGuardadoModalGlobal(identificador = null) {
        if (vistaActual === "habitos") {
            const nombre = document.getElementById('habito-nombre').value.trim();
            if (!nombre) return;
            let lista = JSON.parse(localStorage.getItem('journal_habitos')) || [];
            if (modoEdicionActivo && identificador !== null) {
                lista = lista.map(h => h.id === identificador ? { ...h, nombre } : h);
            } else {
                lista.push({ id: Date.now().toString(), nombre, historial: {} });
            }
            localStorage.setItem('journal_habitos', JSON.stringify(lista));
            renderizarHabitos();
        } else if (vistaActual === "agenda") {
            const fecha = document.getElementById('agenda-fecha').value;
            const hora = document.getElementById('agenda-hora').value;
            const texto = document.getElementById('agenda-texto').value.trim();
            if (!texto) return;
            let db = JSON.parse(localStorage.getItem('journal_agenda')) || {};
            if (!db[fecha]) db[fecha] = [];
            if (modoEdicionActivo && identificador !== null) {
                // Para simplificar la edición en agenda estructurada por fechas
                let viejos = JSON.parse(localStorage.getItem('journal_agenda')) || {};
                Object.keys(viejos).forEach(f => {
                    viejos[f] = viejos[f].filter(ev => ev.id !== identificador);
                });
                if (!viejos[fecha]) viejos[fecha] = [];
                viejos[fecha].push({ id: identificador, hora, texto });
                db = viejos;
            } else {
                db[fecha].push({ id: Date.now().toString(), hora, texto });
            }
            localStorage.setItem('journal_agenda', JSON.stringify(db));
            renderizarAgendaSemanal();
        } else if (vistaActual === "todo") {
            const texto = document.getElementById('todo-texto').value.trim();
            const prioridad = document.getElementById('todo-prioridad').value;
            if (!texto) return;
            let lista = JSON.parse(localStorage.getItem('journal_todo')) || [];
            if (modoEdicionActivo && identificador !== null) {
                lista[identificador] = { ...lista[identificador], texto, prioridad };
            } else {
                lista.push({ texto, prioridad, completado: false });
            }
            localStorage.setItem('journal_todo', JSON.stringify(lista));
            renderizarTodoList();
        } else if (vistaActual === "notas") {
            const titulo = document.getElementById('nota-titulo').value.trim() || "Sin título";
            const cuerpo = document.getElementById('nota-cuerpo').value.trim();
            if (!cuerpo) return;
            let lista = JSON.parse(localStorage.getItem('journal_notas')) || [];
            if (modoEdicionActivo && identificador !== null) {
                lista[identificador] = { titulo, cuerpo, fecha: lista[identificador].fecha };
            } else {
                lista.push({ titulo, cuerpo, fecha: new Date().toLocaleDateString() });
            }
            localStorage.setItem('journal_notas', JSON.stringify(lista));
            renderizarNotasGrid();
        }

        modalGlobal.classList.add('hidden');
    }

    /* --- MÓDULO 1: RUEDA MENSTRUAL INTELIGENTE --- */
    window.cambiarMesCiclo = (direccion) => {
        let f = new Date(diaSeleccionadoCiclo);
        f.setMonth(f.getMonth() + direccion);
        diaSeleccionadoCiclo = f.toISOString().split('T')[0];
        dibujarRueda();
    };

    function dibujarRueda() {
        const ruedaContainer = document.getElementById('rueda-render-zone');
        const displayMes = document.getElementById('ciclo-mes-display');
        if (!ruedaContainer) return;

        ruedaContainer.innerHTML = "";
        const baseDate = new Date(diaSeleccionadoCiclo);
        const año = baseDate.getFullYear();
        const mesZero = baseDate.getMonth();

        if (displayMes) displayMes.textContent = `${nombresMeses[mesZero]} ${año}`;

        const logs = JSON.parse(localStorage.getItem('journal_ciclo_logs')) || {};
        const totalDias = new Date(año, mesZero + 1, 0).getDate();

        // Configuración básica del ciclo (Promedios estándar)
        const duracionPeriodo = 5; 
        const duracionCiclo = 28;

        // Buscar el último día de sangrado registrado históricamente para la predicción
        let ultimaFechaRegla = null;
        Object.keys(logs).sort().forEach(fechaKey => {
            if (logs[fechaKey].sangrado && logs[fechaKey].sangrado !== "nada") {
                ultimaFechaRegla = new Date(fechaKey);
            }
        });

        for (let dia = 1; dia <= totalDias; dia++) {
            const stringFecha = `${año}-${String(mesZero + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            const CeldaDia = document.createElement('div');
            CeldaDia.className = "ciclo-dia-punto";

            const logHoy = logs[stringFecha];
            let claseEstado = "";

            // 1. Aplicar estados reales guardados
            if (logHoy) {
                if (logHoy.sangrado === "ligero" || logHoy.sangrado === "moderado" || logHoy.sangrado === "fuerte") {
                    claseEstado = "periodo-activo";
                } else if (logHoy.dolor === "medio" || logHoy.dolor === "alto") {
                    claseEstado = "sintoma-activo";
                } else if (logHoy.animo) {
                    claseEstado = "registro-vacio"; 
                }
            }

            // 2. Si no hay estado real, pintar la predicción matemática inteligente
            if (!claseEstado && ultimaFechaRegla) {
                const diffTime = Math.abs(new Date(stringFecha) - ultimaFechaRegla);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const posicionCiclo = diffDays % duracionCiclo;

                if (posicionCiclo < duracionPeriodo) {
                    claseEstado = "prediccion-periodo";
                } else if (posicionCiclo >= 11 && posicionCiclo <= 16) {
                    claseEstado = "prediccion-fertil";
                }
            }

            if (claseEstado) CeldaDia.classList.add(claseEstado);
            
            // Si es hoy, resaltar con un contorno especial
            if (stringFecha === new Date().toISOString().split('T')[0]) {
                CeldaDia.style.border = "1.5px solid var(--text-color)";
            }

            CeldaDia.innerHTML = `<span>${dia}</span>`;
            CeldaDia.onclick = () => abrirModalCicloDia(stringFecha);
            ruedaContainer.appendChild(CeldaDia);
        }
    }

    function abrirModalCicloDia(fecha) {
        if (!modalGlobal || !injectorCampos) return;
        const logs = JSON.parse(localStorage.getItem('journal_ciclo_logs')) || {};
        const log = logs[fecha] || { sangrado: "nada", dolor: "ninguno", energia: "media", animo: "calma", notas: "" };

        injectorCampos.innerHTML = `
            <div class="modal-form-header">
                <h2>📝 Registro: ${fecha}</h2>
            </div>
            <div class="modal-form-body">
                <div class="clean-input-group">
                    <label>Flujo / Sangrado:</label>
                    <select id="c-sangrado">
                        <option value="nada" ${log.sangrado === "nada" ? "selected" : ""}>Ninguno 🌑</option>
                        <option value="ligero" ${log.sangrado === "ligero" ? "selected" : ""}>Ligero 🩸</option>
                        <option value="moderado" ${log.sangrado === "moderado" ? "selected" : ""}>Moderado 🩸🩸</option>
                        <option value="fuerte" ${log.sangrado === "fuerte" ? "selected" : ""}>Fuerte 🩸🩸🩸</option>
                    </select>
                </div>
                <div class="clean-input-group">
                    <label>Dolor / Cólicos:</label>
                    <select id="c-dolor">
                        <option value="ninguno" ${log.dolor === "ninguno" ? "selected" : ""}>Ninguno ✨</option>
                        <option value="leve" ${log.dolor === "leve" ? "selected" : ""}>Leve ⚡</option>
                        <option value="medio" ${log.dolor === "medio" ? "selected" : ""}>Moderado ⚡⚡</option>
                        <option value="alto" ${log.dolor === "alto" ? "selected" : ""}>Intenso 💥</option>
                    </select>
                </div>
                <div class="clean-input-group">
                    <label>Nivel de Energía:</label>
                    <select id="c-energia">
                        <option value="baja" ${log.energia === "baja" ? "selected" : ""}>Baja 🥱</option>
                        <option value="media" ${log.energia === "media" ? "selected" : ""}>Normal ⚡</option>
                        <option value="alta" ${log.energia === "alta" ? "selected" : ""}>A Tope 🔥</option>
                    </select>
                </div>
                <div class="clean-input-group">
                    <label>Estado de Ánimo:</label>
                    <select id="c-animo">
                        <option value="calma" ${log.animo === "calma" ? "selected" : ""}>En Calma 🧘</option>
                        <option value="feliz" ${log.animo === "feliz" ? "selected" : ""}>Feliz / Radiante☀️</option>
                        <option value="sensible" ${log.animo === "sensible" ? "selected" : ""}>Sensible / Melancólica 🌧️</option>
                        <option value="irritable" ${log.animo === "irritable" ? "selected" : ""}>Irritable / Estresada ⚡</option>
                    </select>
                </div>
                <div class="clean-input-group">
                    <label>Notas del día:</label>
                    <textarea id="c-notas" rows="2" placeholder="Síntomas, antojos, pensamientos...">${log.notas || ""}</textarea>
                </div>
                <button type="button" class="modal-save-btn" id="btn-save-ciclo">Guardar Día</button>
                <button type="button" class="modal-save-btn" style="background:transparent; color:var(--text-color); margin-top:4px;" id="btn-cancel-ciclo">Cerrar</button>
            </div>
        `;

        modalGlobal.classList.remove('hidden');

        document.getElementById('btn-cancel-ciclo').onclick = () => modalGlobal.classList.add('hidden');
        
        document.getElementById('btn-save-ciclo').onclick = () => {
            logs[fecha] = {
                sangrado: document.getElementById('c-sangrado').value,
                dolor: document.getElementById('c-dolor').value,
                energia: document.getElementById('c-energia').value,
                animo: document.getElementById('c-animo').value,
                notas: document.getElementById('c-notas').value.trim()
            };
            localStorage.setItem('journal_ciclo_logs', JSON.stringify(logs));
            modalGlobal.classList.add('hidden');
            dibujarRueda();
        };
    }

    /* --- MÓDULO 2: SEGUIMIENTO DE HÁBITOS (TRACKER) --- */
    function renderizarHabitos() {
        const contenedor = document.getElementById('habitos-render-zone');
        if (!contenedor) return;
        contenedor.innerHTML = "";

        const lista = JSON.parse(localStorage.getItem('journal_habitos')) || [];
        if (lista.length === 0) {
            contenedor.innerHTML = `<p class="empty-state-text">No hay hábitos creados. Añade uno con el botón (+).</p>`;
            return;
        }

        // Mostrar los últimos 7 días en la cabecera horizontal de cada hábito
        const hoy = new Date();
        let headersHTML = `<div class="habitos-row-header"><span>Hábito</span><div class="habitos-days-grid">`;
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(hoy.getDate() - i);
            headersHTML += `<div class="day-lbl-col"><span>${d.toLocaleDateString('es', { weekday: 'narrow' })}</span><small>${d.getDate()}</small></div>`;
        }
        headersHTML += `</div></div>`;
        contenedor.innerHTML += headersHTML;

        lista.forEach(habito => {
            const fila = document.createElement('div');
            fila.className = "habito-item-row";

            let checkboxesHTML = `<div class="habitos-days-grid">`;
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(hoy.getDate() - i);
                const fString = d.toISOString().split('T')[0];
                const checked = habito.historial && habito.historial[fString] ? "checked" : "";
                
                checkboxesHTML += `
                    <div class="check-box-wrapper">
                        <input type="checkbox" data-habito-id="${habito.id}" data-fecha="${fString}" ${checked} class="habito-check-trigger">
                    </div>
                `;
            }
            checkboxesHTML += `</div>`;

            fila.innerHTML = `
                <div class="habito-meta-info">
                    <span class="habito-title-txt">${habito.nombre}</span>
                    <div class="habito-actions-inline">
                        <small onclick="editarHabitoInline('${habito.id}')">Editar</small>
                        <small style="color:#e74c3c; margin-left:6px;" onclick="eliminarHabitoInline('${habito.id}')">Borrar</small>
                    </div>
                </div>
                ${checkboxesHTML}
            `;
            contenedor.appendChild(fila);
        });

        // Registrar escuchadores de eventos para los cambios en los checkboxes
        document.querySelectorAll('.habito-check-trigger').forEach(chk => {
            chk.onchange = () => {
                const hId = chk.getAttribute('data-habito-id');
                const fStr = chk.getAttribute('data-fecha');
                let listaHabitos = JSON.parse(localStorage.getItem('journal_habitos')) || [];
                
                listaHabitos = listaHabitos.map(h => {
                    if (h.id === hId) {
                        if (!h.historial) h.historial = {};
                        if (chk.checked) h.historial[fStr] = true;
                        else delete h.historial[fStr];
                    }
                    return h;
                });
                localStorage.setItem('journal_habitos', JSON.stringify(listaHabitos));
            };
        });
    }

    window.editarHabitoInline = (id) => {
        const lista = JSON.parse(localStorage.getItem('journal_habitos')) || [];
        const h = lista.find(item => item.id === id);
        if (h) abrirModalFormulario(h);
    };

    window.eliminarHabitoInline = (id) => {
        if (confirm("¿Seguro que deseas eliminar este hábito por completo?")) {
            let lista = JSON.parse(localStorage.getItem('journal_habitos')) || [];
            lista = lista.filter(h => h.id !== id);
            localStorage.setItem('journal_habitos', JSON.stringify(lista));
            renderizarHabitos();
        }
    };

    /* --- MÓDULO 3: AGENDA / PLANIFICADOR SEMANAL --- */
    window.cambiarSemanaAgenda = (direccion) => {
        fechaSemanaAgenda.setDate(fechaSemanaAgenda.getDate() + (direccion * 7));
        renderizarAgendaSemanal();
    };

    function renderizarAgendaSemanal() {
        const contenedor = document.getElementById('agenda-render-zone');
        if (!contenedor) return;
        contenedor.innerHTML = "";

        // Calcular el lunes de la semana actual seleccionada
        const copia = new Date(fechaSemanaAgenda);
        const diaSemana = copia.getDay();
        const diferencia = diaSemana === 0 ? -6 : 1 - diaSemana; // Ajuste para Domingo o Lunes básico
        copia.setDate(copia.getDate() + diferencia);

        const db = JSON.parse(localStorage.getItem('journal_agenda')) || {};

        for (let i = 0; i < 7; i++) {
            const fString = copia.toISOString().split('T')[0];
            const opciones = { weekday: 'long', day: 'numeric', month: 'short' };
            const tituloDia = copia.toLocaleDateString('es', opciones);

            const bloqueDia = document.createElement('div');
            bloqueDia.className = "agenda-dia-card";

            let eventosHTML = "";
            if (db[fString] && db[fString].length > 0) {
                // Ordenar eventos cronológicamente por hora
                db[fString].sort((a, b) => a.hora.localeCompare(b.hora));
                db[fString].forEach(ev => {
                    eventosHTML += `
                        <div class="agenda-evento-row">
                            <span class="evt-hora">${ev.hora}</span>
                            <span class="evt-texto">${ev.texto}</span>
                            <div class="evt-actions">
                                <span onclick="editarEventoAgendaInline('${fString}','${ev.id}')">✏️</span>
                                <span onclick="eliminarEventoAgendaInline('${fString}','${ev.id}')" style="margin-left:4px;">❌</span>
                            </div>
                        </div>
                    `;
                });
            } else {
                eventosHTML = `<p class="evt-vacio-txt">No hay planes para hoy</p>`;
            }

            bloqueDia.innerHTML = `
                <div class="agenda-dia-title-bar">
                    <h4>${tituloDia.toUpperCase()}</h4>
                    <small onclick="agregarPlanParaFecha('${fString}')">+ Añadir</small>
                </div>
                <div class="agenda-eventos-list">${eventosHTML}</div>
            `;
            contenedor.appendChild(bloqueDia);
            copia.setDate(copia.getDate() + 1);
        }
    }

    window.agregarPlanParaFecha = (fecha) => {
        diaSeleccionadoCiclo = fecha; // Sincroniza la fecha para el formulario modal
        vistaActual = "agenda";
        abrirModalFormulario();
    };

    window.editarEventoAgendaInline = (fecha, id) => {
        const db = JSON.parse(localStorage.getItem('journal_agenda')) || {};
        if (db[fecha]) {
            const ev = db[fecha].find(e => e.id === id);
            if (ev) abrirModalFormulario({ ...ev, fecha });
        }
    };

    window.eliminarEventoAgendaInline = (fecha, id) => {
        if (confirm("¿Deseas borrar este evento?")) {
            const db = JSON.parse(localStorage.getItem('journal_agenda')) || {};
            if (db[fecha]) {
                db[fecha] = db[fecha].filter(e => e.id !== id);
                if (db[fecha].length === 0) delete db[fecha];
                localStorage.setItem('journal_agenda', JSON.stringify(db));
                renderizarAgendaSemanal();
            }
        }
    };

    /* --- MÓDULO 4: LISTA DE TAREAS (TO-DO LIST) --- */
    function renderizarTodoList() {
        const contenedor = document.getElementById('todo-render-zone');
        if (!contenedor) return;
        contenedor.innerHTML = "";

        const lista = JSON.parse(localStorage.getItem('journal_todo')) || [];
        if (lista.length === 0) {
            contenedor.innerHTML = `<p class="empty-state-text">Todo limpio. No tienes tareas pendientes.</p>`;
            return;
        }

        lista.forEach((todo, index) => {
            const item = document.createElement('div');
            item.className = `todo-item-card ${todo.completado ? "todo-completed" : ""}`;

            item.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px; width:75%;">
                    <input type="checkbox" ${todo.completado ? "checked" : ""} class="todo-check-trigger" data-index="${index}">
                    <span class="todo-text-span prio-${todo.prioridad}">${todo.texto}</span>
                </div>
                <div class="todo-item-actions">
                    <small onclick="editarTodoInline(${index})">Editar</small>
                    <small style="color:#e74c3c; margin-left:6px;" onclick="eliminarTodoInline(${index})">Borrar</small>
                </div>
            `;
            contenedor.appendChild(item);
        });

        document.querySelectorAll('.todo-check-trigger').forEach(chk => {
            chk.onchange = () => {
                const idx = chk.getAttribute('data-index');
                let listaTodo = JSON.parse(localStorage.getItem('journal_todo')) || [];
                listaTodo[idx].completado = chk.checked;
                localStorage.setItem('journal_todo', JSON.stringify(listaTodo));
                renderizarTodoList();
            };
        });
    }

    window.editarTodoInline = (index) => {
        const lista = JSON.parse(localStorage.getItem('journal_todo')) || [];
        if (lista[index]) abrirModalFormulario({ ...lista[index], index });
    };

    window.eliminarTodoInline = (index) => {
        let lista = JSON.parse(localStorage.getItem('journal_todo')) || [];
        lista.splice(index, 1);
        localStorage.setItem('journal_todo', JSON.stringify(lista));
        renderizarTodoList();
    };

    /* --- MÓDULO 5: BLOC DE NOTAS / DIARIO COMPLETO --- */
    function renderizarNotasGrid() {
        const contenedor = document.getElementById('notas-render-zone');
        if (!contenedor) return;
        contenedor.innerHTML = "";

        const lista = JSON.parse(localStorage.getItem('journal_notas')) || [];
        if (lista.length === 0) {
            contenedor.innerHTML = `<p class="empty-state-text">El bloc está vacío. Crea tu primera nota reflexiva.</p>`;
            return;
        }

        lista.forEach((nota, index) => {
            const card = document.createElement('div');
            card.className = "nota-notebook-card";

            card.innerHTML = `
                <div class="nota-card-header">
                    <h4>${nota.titulo}</h4>
                    <small>${nota.fecha}</small>
                </div>
                <p class="nota-card-body-preview">${nota.cuerpo.replace(/\n/g, '<br>')}</p>
                <div class="nota-card-actions-footer">
                    <button type="button" onclick="editarNotaInline(${index})">Editar</button>
                    <button type="button" style="color:#e74c3c;" onclick="eliminarNotaInline(${index})">Eliminar</button>
                </div>
            `;
            contenedor.appendChild(card);
        });
    }

    window.editarNotaInline = (index) => {
        const lista = JSON.parse(localStorage.getItem('journal_notas')) || [];
        if (lista[index]) abrirModalFormulario({ ...lista[index], index });
    };

    window.eliminarNotaInline = (index) => {
        if (confirm("¿Estás seguro de eliminar esta nota de tu cuaderno?")) {
            let lista = JSON.parse(localStorage.getItem('journal_notas')) || [];
            lista.splice(index, 1);
            localStorage.setItem('journal_notas', JSON.stringify(lista));
            renderizarNotasGrid();
        }
    };

    /* --- MÓDULO 6: CONFIGURACIÓN, APARIENCIA Y RESPALDOS (BACKUP ENGINE) --- */
    function sincronizarControlesConfig() {
        // Sincronizar estado del botón de Modo Oscuro
        const esOscuro = document.body.classList.contains('dark-mode');
        const btnDark = document.getElementById('btn-toggle-dark');
        if (btnDark) btnDark.textContent = esOscuro ? "Activo" : "Inactivo";

        // Sincronizar estado de la Protección por PIN
        const btnPinStatus = document.getElementById('cfg-toggle-pin-status');
        if (btnPinStatus) btnPinStatus.textContent = pinProteccionActiva ? "Activo" : "Inactivo";
    }

    document.getElementById('btn-toggle-dark').onclick = () => {
        const flag = document.body.classList.toggle('dark-mode');
        localStorage.setItem('journalDarkMode', flag ? "true" : "false");
        sincronizarControlesConfig();
    };

    // Inicializar el modo oscuro inmediatamente si ya estaba configurado previamente
    if (localStorage.getItem('journalDarkMode') === "true") {
        document.body.classList.add('dark-mode');
    }

    // Manejo interactivo del color de acento personalizado
    document.getElementById('color-picker').oninput = (e) => {
        const color = e.target.value;
        document.documentElement.style.setProperty('--accent-color', color);
        localStorage.setItem('journalAccentColor', color);
    };
    const accentGuardado = localStorage.getItem('journalAccentColor');
    if (accentGuardado) {
        document.documentElement.style.setProperty('--accent-color', accentGuardado);
        const picker = document.getElementById('color-picker');
        if (picker) picker.value = accentGuardado;
    }

    // Control dinámico de activación/desactivación del PIN de seguridad
    document.getElementById('cfg-toggle-pin-status').onclick = () => {
        pinProteccionActiva = !pinProteccionActiva;
        localStorage.setItem('journalPinActivo', pinProteccionActiva ? "true" : "false");
        sincronizarControlesConfig();
    };

    document.getElementById('cfg-change-pin').onclick = () => {
        const p = prompt("Introduce tu nuevo PIN numérico de 4 dígitos:");
        if (p && p.length === 4 && !isNaN(p)) {
            localStorage.setItem('journalPin', p);
            alert("PIN Secreto Actualizado con éxito.");
        } else {
            alert("PIN no válido.");
        }
    };

    // Respaldos de Copias de seguridad (Backup engine)
    document.getElementById('cfg-export').onclick = () => {
        const blob = new Blob([JSON.stringify(localStorage)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `journal_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    document.getElementById('cfg-import-file').onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
            try {
                const data = JSON.parse(evt.target.result);
                Object.keys(data).forEach(k => localStorage.setItem(k, data[k]));
                alert("Copia de seguridad restaurada correctamente.");
                window.location.reload();
            } catch (err) {
                alert("Error al procesar el archivo JSON de copia de seguridad.");
            }
        };
        reader.readAsText(file);
    };

});