/* --- SISTEMA GLOBAL DE GESTIÓN DIARIO --- */
document.addEventListener('DOMContentLoaded', () => {
    
    // Configuración Inicial y PIN
    let pinIngresado = "";
    const PIN_CORRECTO = localStorage.getItem('journalPin') || "1707";
    let pinProteccionActiva = localStorage.getItem('journalPinActivo') !== "false";

    if (!pinProteccionActiva) {
        document.getElementById('lock-screen').classList.add('hidden');
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
    const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    document.getElementById('title-metas').textContent = `Mis metas (${anioActual})`;
    document.getElementById('title-habitos').textContent = `Mis hábitos de (${nombresMeses[mesActualId - 1]})`;

    // Comprobación de cambio de ciclo temporal para archivado automático
    verificarTraspasoTemporalHistorico();

    /* --- NAVEGACIÓN --- */
    function irA(vistaId) {
        vistaActual = vistaId;
        modoEdicionActivo = false;
        globalFab.classList.remove('active-editing');
        
        // Controlar visibilidad del FAB flotante según pantalla
        if (vistaId === "menu" || vistaId === "config") {
            globalFab.classList.add('hidden');
        } else {
            globalFab.classList.remove('hidden');
        }

        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`view-${vistaId}`).classList.add('active');

        // Renderizadores específicos de carga
        if (vistaId === "metas") cargarMetas();
        if (vistaId === "habitos") cargarHabitos();
        if (vistaId === "todo") cargarTareasTodo();
        if (vistaId === "agenda") renderizarSemanaHobonichi();
        if (vistaId === "ciclo") renderizarRuedaCiclo28();
    }

    // Eventos de Navegación del Menú Columna
    document.getElementById('nav-metas').onclick = () => irA('metas');
    document.getElementById('nav-habitos').onclick = () => irA('habitos');
    document.getElementById('nav-todo').onclick = () => irA('todo');
    document.getElementById('nav-agenda').onclick = () => irA('agenda');
    document.getElementById('nav-ciclo').onclick = () => irA('ciclo');
    document.getElementById('nav-config').onclick = () => irA('config');
    
    document.querySelectorAll('.back-menu-btn').forEach(btn => {
        btn.onclick = () => irA('menu');
    });

    /* --- GESTIÓN INTERACTIVA DE TECLADO PIN --- */
    document.querySelectorAll('.num-btn[data-val]').forEach(btn => {
        btn.onclick = () => {
            if (pinIngresado.length < 4) {
                pinIngresado += btn.getAttribute('data-val');
                actualizarPuntosPin();
            }
        };
    });
    document.getElementById('btn-clear').onclick = () => { pinIngresado = ""; actualizarPuntosPin(); };
    document.getElementById('btn-enter').onclick = comprobarCredencialesPin;

    function actualizarPuntosPin() {
        for (let i = 1; i <= 4; i++) {
            const slot = document.getElementById(`slot-${i}`);
            if (i <= pinIngresado.length) slot.classList.add('filled');
            else slot.classList.remove('filled');
        }
    }

    function comprobarCredencialesPin() {
        if (pinIngresado === PIN_CORRECTO) {
            document.getElementById('lock-screen').classList.add('hidden');
        } else {
            alert("Código de acceso incorrecto");
            pinIngresado = "";
            actualizarPuntosPin();
        }
    }

    /* --- DETECTOR DE EVENTOS GLOBAL: CIERRE AL TOCAR ESPACIO VACÍO --- */
    appZone.addEventListener('click', (e) => {
        // Ignorar si el clic viene del propio botón flotante o de dentro del modal abierto
        if (e.target.closest('#global-fab-add') || e.target.closest('#notebook-global-modal')) return;
        
        // Si hay menús en línea de la agenda abiertos, tampoco cerrar súbitamente
        if (e.target.closest('.agenda-event-inline-actions')) return;

        // Comprobación si se presionó en zona vacía o contenedores sin ítems activos
        if (modoEdicionActivo) {
            modoEdicionActivo = false;
            globalFab.classList.remove('active-editing');
            refrescarVistaActivaAislada();
        }
    });

    // Acción del botón flotante global (+ / Editar)
    globalFab.onclick = (e) => {
        e.stopPropagation();
        modoEdicionActivo = !modoEdicionActivo;
        
        if (modoEdicionActivo) {
            globalFab.classList.add('active-editing');
            abrirFormularioModalInyectado();
        } else {
            globalFab.classList.remove('active-editing');
            modalGlobal.classList.add('hidden');
        }
        refrescarVistaActivaAislada();
    };

    function refrescarVistaActivaAislada() {
        if (vistaActual === "metas") cargarMetas();
        if (vistaActual === "habitos") cargarHabitos();
        if (vistaActual === "todo") cargarTareasTodo();
        if (vistaActual === "agenda") renderizarSemanaHobonichi();
    }

    /* ==========================================
       SECCIÓN: METAS ANUALES
       ========================================== */
    function cargarMetas() {
        const metas = JSON.parse(localStorage.getItem(`j_metas_${anioActual}`)) || [];
        const lista = document.getElementById('lista-metas');
        lista.innerHTML = "";

        if (metas.length === 0) {
            lista.innerHTML = `<li class="notebook-placeholder-text">No hay metas para este año. Presiona +</li>`;
            return;
        }

        metas.forEach((meta, idx) => {
            const li = document.createElement('li');
            li.className = `notebook-item ${meta.done ? 'completed' : ''}`;
            li.innerHTML = `<div class="notebook-item-text">${meta.text}</div>`;
            
            if (modoEdicionActivo) {
                const btnDel = document.createElement('button');
                btnDel.className = "btn-delete-item-cross";
                btnDel.textContent = "×";
                btnDel.onclick = (e) => { e.stopPropagation(); borrarMetaIndex(idx); };
                li.appendChild(btnDel);

                // Modificar texto al presionar encima
                li.onclick = (e) => {
                    e.stopPropagation();
                    const nuevoTexto = prompt("Modificar meta:", meta.text);
                    if (nuevoTexto && nuevoTexto.trim() !== "") {
                        metas[idx].text = nuevoTexto.trim();
                        localStorage.setItem(`j_metas_${anioActual}`, JSON.stringify(metas));
                        cargarMetas();
                    }
                };
            } else {
                li.onclick = () => {
                    meta.done = !meta.done;
                    localStorage.setItem(`j_metas_${anioActual}`, JSON.stringify(metas));
                    cargarMetas();
                };
            }
            lista.appendChild(li);
        });
    }

    function borrarMetaIndex(idx) {
        let metas = JSON.parse(localStorage.getItem(`j_metas_${anioActual}`)) || [];
        metas.splice(idx, 1);
        localStorage.setItem(`j_metas_${anioActual}`, JSON.stringify(metas));
        cargarMetas();
    }

    /* ==========================================
       SECCIÓN: TRACKER DE HÁBITOS
       ========================================== */
    function cargarHabitos() {
        const llaveMes = `j_habits_${anioActual}_${mesActualId}`;
        const habitos = JSON.parse(localStorage.getItem(llaveMes)) || [];
        const matrix = document.getElementById('matrix-habitos');
        matrix.innerHTML = "";

        if (habitos.length === 0) {
            matrix.innerHTML = `<p class="notebook-placeholder-text">Sin hábitos registrados. Presiona +</p>`;
            return;
        }

        const diasEnMes = new Date(anioActual, mesActualId, 0).getDate();
        const diasSemanaCorta = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

        habitos.forEach((hab, habIdx) => {
            const row = document.createElement('div');
            row.className = "habit-row";
            
            const header = document.createElement('div');
            header.className = "habit-row-header";
            header.innerHTML = `<span>${hab.name}</span>`;

            if (modoEdicionActivo) {
                const btnDel = document.createElement('button');
                btnDel.className = "btn-delete-item-cross";
                btnDel.style.position = "static";
                btnDel.textContent = "×";
                btnDel.onclick = (e) => { e.stopPropagation(); borrarHabitoIndex(habIdx); };
                header.appendChild(btnDel);

                header.style.cursor = "pointer";
                header.onclick = (e) => {
                    e.stopPropagation();
                    const nuevoNombre = prompt("Modificar hábito:", hab.name);
                    if (nuevoNombre && nuevoNombre.trim() !== "") {
                        habitos[habIdx].name = nuevoNombre.trim();
                        localStorage.setItem(llaveMes, JSON.stringify(habitos));
                        cargarHabitos();
                    }
                };
            }

            const gridDias = document.createElement('div');
            gridDias.className = "habit-days-grid";

            for (let d = 1; d <= diasEnMes; d++) {
                const diaSemanaNombre = diasSemanaCorta[new Date(anioActual, mesActualId - 1, d).getDay()];
                const celda = document.createElement('div');
                celda.className = `habit-day-cell ${hab.history.includes(d) ? 'checked' : ''}`;
                celda.innerHTML = `${d}<span class="day-name-sub">${diaSemanaNombre}</span>`;
                
                if (!modoEdicionActivo) {
                    celda.onclick = (e) => {
                        e.stopPropagation();
                        if (hab.history.includes(d)) {
                            hab.history = hab.history.filter(i => i !== d);
                        } else {
                            hab.history.push(d);
                        }
                        localStorage.setItem(llaveMes, JSON.stringify(habitos));
                        cargarHabitos();
                    };
                }
                gridDias.appendChild(celda);
            }

            row.appendChild(header);
            row.appendChild(gridDias);
            matrix.appendChild(row);
        });
    }

    function borrarHabitoIndex(idx) {
        const llaveMes = `j_habits_${anioActual}_${mesActualId}`;
        let habitos = JSON.parse(localStorage.getItem(llaveMes)) || [];
        habitos.splice(idx, 1);
        localStorage.setItem(llaveMes, JSON.stringify(habitos));
        cargarHabitos();
    }

    /* ==========================================
       SECCIÓN: TO-DO LIST
       ========================================== */
    function cargarTareasTodo() {
        const tareas = JSON.parse(localStorage.getItem('j_todo_list')) || [];
        const lista = document.getElementById('lista-todo');
        lista.innerHTML = "";

        if (tareas.length === 0) {
            lista.innerHTML = `<li class="notebook-placeholder-text">Lista vacía. Presiona +</li>`;
            return;
        }

        tareas.forEach((tarea, idx) => {
            const li = document.createElement('li');
            li.className = `notebook-item ${tarea.done ? 'completed' : ''}`;
            li.innerHTML = `
                <div class="todo-bullet-box"></div>
                <div class="notebook-item-text">${tarea.text}</div>
            `;

            if (modoEdicionActivo) {
                const btnDel = document.createElement('button');
                btnDel.className = "btn-delete-item-cross";
                btnDel.textContent = "×";
                btnDel.onclick = (e) => { e.stopPropagation(); borrarTareaTodoIndex(idx); };
                li.appendChild(btnDel);

                li.onclick = (e) => {
                    e.stopPropagation();
                    const nuevoTxt = prompt("Modificar tarea:", tarea.text);
                    if (nuevoTxt && nuevoTxt.trim() !== "") {
                        tareas[idx].text = nuevoTxt.trim();
                        localStorage.setItem('j_todo_list', JSON.stringify(tareas));
                        cargarTareasTodo();
                    }
                };
            } else {
                li.onclick = () => {
                    tarea.done = !tarea.done;
                    localStorage.setItem('j_todo_list', JSON.stringify(tareas));
                    cargarTareasTodo();
                };
            }
            lista.appendChild(li);
        });
    }

    function borrarTareaTodoIndex(idx) {
        let tareas = JSON.parse(localStorage.getItem('j_todo_list')) || [];
        tareas.splice(idx, 1);
        localStorage.setItem('j_todo_list', JSON.stringify(tareas));
        cargarTareasTodo();
    }

    document.getElementById('btn-clear-completed-todo').onclick = () => {
        let tareas = JSON.parse(localStorage.getItem('j_todo_list')) || [];
        tareas = tareas.filter(t => !t.done);
        localStorage.setItem('j_todo_list', JSON.stringify(tareas));
        cargarTareasTodo();
    };

    /* ==========================================
       SECCIÓN: AGENDA HOBONICHI (CON SWIPE REAL)
       ========================================== */
    function obtenerLunesDeSemana(d) {
        d = new Date(d);
        let day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    function renderizarSemanaHobonichi() {
        const grid = document.getElementById('grid-agenda-semana');
        grid.innerHTML = "";

        const lunes = obtenerLunesDeSemana(fechaSemanaAgenda);
        const nombresDias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
        
        // Formatear etiqueta de cabecera de la semana
        const finSemana = new Date(lunes);
        finSemana.setDate(lunes.getDate() + 6);
        document.getElementById('agenda-week-label').textContent = `${lunes.getDate()}/${lunes.getMonth()+1} al ${finSemana.getDate()}/${finSemana.getMonth()+1} (${lunes.getFullYear()})`;

        for (let i = 0; i < 7; i++) {
            let diaBucle = new Date(lunes);
            diaBucle.setDate(lunes.getDate() + i);
            let llaveFechaStr = diaBucle.toISOString().split('T')[0];
            
            const eventos = JSON.parse(localStorage.getItem(`j_agenda_${llaveFechaStr}`)) || [];

            let htmlEventos = "";
            eventos.forEach((ev, evIdx) => {
                htmlEventos += `
                    <div class="agenda-event-item ${ev.done ? 'completed' : ''}" data-date="${llaveFechaStr}" data-idx="${evIdx}">
                        <span class="agenda-event-time">${ev.time}</span>
                        <span>${ev.title}</span>
                        ${modoEdicionActivo ? `
                            <div class="agenda-event-inline-actions">
                                <button type="button" class="agenda-inline-btn action-mod-date">📅 Fecha</button>
                                <button type="button" class="agenda-inline-btn action-del-event" style="color:#e74c3c">× Eliminar</button>
                            </div>
                        ` : ''}
                    </div>
                `;
            });

            const col = document.createElement('div');
            col.className = "agenda-day-column";
            col.innerHTML = `
                <div class="agenda-day-header">
                    <span class="day-number">${diaBucle.getDate()}</span>
                    <span>${nombresDias[i]}</span>
                </div>
                <div class="agenda-events-stack">
                    ${htmlEventos}
                </div>
            `;
            grid.appendChild(col);
        }

        // Eventos internos de los elementos de la agenda
        grid.querySelectorAll('.agenda-event-item').forEach(el => {
            const dateStr = el.getAttribute('data-date');
            const idx = parseInt(el.getAttribute('data-idx'));
            let evs = JSON.parse(localStorage.getItem(`j_agenda_${dateStr}`)) || [];

            if (modoEdicionActivo) {
                el.querySelector('.action-del-event').onclick = (e) => {
                    e.stopPropagation();
                    evs.splice(idx, 1);
                    localStorage.setItem(`j_agenda_${dateStr}`, JSON.stringify(evs));
                    renderizarSemanaHobonichi();
                };
                el.querySelector('.action-mod-date').onclick = (e) => {
                    e.stopPropagation();
                    const nuevaFecha = prompt("Escribe la nueva fecha (AAAA-MM-DD):", dateStr);
                    if (nuevaFecha && nuevaFecha.trim() !== "") {
                        const unEv = evs.splice(idx, 1)[0];
                        localStorage.setItem(`j_agenda_${dateStr}`, JSON.stringify(evs));
                        
                        let targetEvs = JSON.parse(localStorage.getItem(`j_agenda_${nuevaFecha}`)) || [];
                        targetEvs.push(unEv);
                        localStorage.setItem(`j_agenda_${nuevaFecha}`, JSON.stringify(targetEvs));
                        renderizarSemanaHobonichi();
                    }
                };
            } else {
                el.onclick = () => {
                    evs[idx].done = !evs[idx].done;
                    localStorage.setItem(`j_agenda_${dateStr}`, JSON.stringify(evs));
                    renderizarSemanaHobonichi();
                };
            }
        });
    }

    // Soporte de Swipe dactilar para Agenda
    let touchstartX = 0;
    let touchendX = 0;
    const swipeArea = document.getElementById('swipe-area-agenda');
    
    swipeArea.addEventListener('touchstart', e => { touchstartX = e.changedTouches[0].screenX; });
    swipeArea.addEventListener('touchend', e => {
        touchendX = e.changedTouches[0].screenX;
        evaluarGestoSwipe();
    });
    
    function evaluarGestoSwipe() {
        if (touchstartX - touchendX > 60) { // Izquierda -> Siguiente Semana
            fechaSemanaAgenda.setDate(fechaSemanaAgenda.getDate() + 7);
            renderizarSemanaHobonichi();
        }
        if (touchendX - touchstartX > 60) { // Derecha -> Anterior Semana
            fechaSemanaAgenda.setDate(fechaSemanaAgenda.getDate() - 7);
            renderizarSemanaHobonichi();
        }
    }

    document.getElementById('btn-clear-done-events').onclick = () => {
        const lunes = obtenerLunesDeSemana(fechaSemanaAgenda);
        for (let i = 0; i < 7; i++) {
            let dia = new Date(lunes);
            dia.setDate(lunes.getDate() + i);
            let llave = dia.toISOString().split('T')[0];
            let evs = JSON.parse(localStorage.getItem(`j_agenda_${llave}`)) || [];
            evs = evs.filter(e => !e.done);
            localStorage.setItem(`j_agenda_${llave}`, JSON.stringify(evs));
        }
        renderizarSemanaHobonichi();
    };

    /* ==========================================
       SECCIÓN: CICLO MENSTRUAL LUNAR DE 28 DÍAS
       ========================================== */
    function renderizarRuedaCiclo28() {
        const anillo = document.getElementById('anillo-ciclo-28');
        anillo.innerHTML = "";

        const logsCiclo = JSON.parse(localStorage.getItem('j_ciclo_logs')) || {};
        
        // Referencia estricta: Último ciclo inició el 30 de Abril de 2026
        const fechaBaseCiclo = new Date("2026-04-30T00:00:00");
        const hoy = new Date(); hoy.setHours(0,0,0,0);
        
        document.getElementById('lunar-center-date').textContent = `${hoy.getDate()}/${hoy.getMonth()+1}`;
        
        // Cálculo matemático del día del ciclo actual dentro de la matriz fija de 28 días
        const diffTiempo = Math.abs(hoy - fechaBaseCiclo);
        const diffDias = Math.floor(diffTiempo / (1000 * 60 * 60 * 24));
        const diaCicloActualCalculado = (diffDias % 28) + 1;
        
        document.getElementById('lunar-center-day').textContent = `Día ${diaCicloActualCalculado}`;

        const radio = 115; // Ajuste dentro del radio contenedor de 260px
        const centroX = 130;
        const centroY = 130;

        for (let i = 1; i <= 28; i++) {
            // Distribución trigonométrica en círculo perfecto
            const angulo = (i * 2 * Math.PI / 28) - Math.PI / 2;
            const x = centroX + radio * Math.cos(angulo);
            const y = centroY + radio * Math.sin(angulo);

            // Encontrar si este nodo específico tiene datos de sangrado históricos
            let nodoSangrado = false;
            
            // Evaluamos logs para pintar puntitos de sangrado
            Object.keys(logsCiclo).forEach(fechaKey => {
                const diffBucle = Math.floor(Math.abs(new Date(fechaKey + "T00:00:00") - fechaBaseCiclo) / (1000 * 60 * 60 * 24));
                const diaCalculadoBucle = (diffBucle % 28) + 1;
                if (diaCalculadoBucle === i && logsCiclo[fechaKey].sangrado === "si") {
                    nodoSangrado = true;
                }
            });

            const dot = document.createElement('div');
            dot.className = `lunar-dot-node ${nodoSangrado ? 'bleeding' : ''}`;
            dot.style.left = `${x}px`;
            dot.style.top = `${y}px`;
            dot.textContent = i;

            dot.onclick = (e) => {
                e.stopPropagation();
                anillo.querySelectorAll('.lunar-dot-node').forEach(n => n.classList.remove('selected'));
                dot.classList.add('selected');
                mostrarInformacionConsolidadaCiclo(i, fechaBaseCiclo, logsCiclo);
            };

            anillo.appendChild(dot);
        }
    }

    function mostrarInformacionConsolidadaCiclo(diaFijo, fechaBase, logs) {
        const contenedorText = document.getElementById('ciclo-day-details');
        let htmlAcumulado = `<h4>Registros históricos del Día ${diaFijo} del Ciclo:</h4>`;
        let hallado = false;

        Object.keys(logs).forEach(fechaKey => {
            const diff = Math.floor(Math.abs(new Date(fechaKey + "T00:00:00") - fechaBase) / (1000 * 60 * 60 * 24));
            const diaCalculado = (diff % 28) + 1;

            if (diaCalculado === diaFijo) {
                hallado = true;
                const r = logs[fechaKey];
                htmlAcumulado += `
                    <p style="margin:4px 0; font-size:13px; border-bottom:1px dashed var(--line-dashed)">
                        <b>Fecha ${fechaKey}:</b> Sangrado: ${r.sangrado.toUpperCase()} | Sueño: ${r.sueno}h | Energía: ${r.energia} | Ánimo: ${r.animo}<br>
                        <span class="notebook-placeholder-text">Notas: ${r.notas || 'Ninguna'}</span>
                    </p>
                `;
            }
        });

        if (!hallado) {
            contenedorText.innerHTML = `<p class="notebook-placeholder-text">No hay nada registrado para el día ${diaFijo} del ciclo aún.</p>`;
        } else {
            contenedorText.innerHTML = htmlAcumulado;
        }
    }

    /* ==========================================
       MODAL DE INYECCIÓN DE FORMULARIOS MINIMALISTAS
       ========================================== */
    function abrirFormularioModalInyectado() {
        modalGlobal.classList.remove('hidden');
        injectorCampos.innerHTML = "";

        const form = document.createElement('form');
        form.id = "clean-inner-form";
        form.onsubmit = (e) => { e.preventDefault(); procesarGuardadoFormularioInyectado(); };

        if (vistaActual === "metas") {
            form.innerHTML = `
                <label>NUEVA META ANUAL</label>
                <input type="text" id="f-meta-text" placeholder="Escribe tu meta aquí..." required autofocus autocomplete="off">
                <button type="submit" class="modal-save-btn">Añadir Meta</button>
            `;
        } else if (vistaActual === "habitos") {
            form.innerHTML = `
                <label>NUEVO HÁBITO PARA ESTE MES</label>
                <input type="text" id="f-habit-name" placeholder="Nombre del hábito..." required autofocus autocomplete="off">
                <button type="submit" class="modal-save-btn">Añadir Hábito</button>
            `;
        } else if (vistaActual === "todo") {
            form.innerHTML = `
                <label>NUEVA TAREA GENERAL</label>
                <input type="text" id="f-todo-text" placeholder="¿Qué hay por hacer?..." required autofocus autocomplete="off">
                <button type="submit" class="modal-save-btn">Añadir Tarea</button>
            `;
        } else if (vistaActual === "agenda") {
            form.innerHTML = `
                <label>NUEVO EVENTO</label>
                <input type="text" id="f-agenda-title" placeholder="Nombre del evento..." required autofocus autocomplete="off">
                <label>FECHA DE REGISTRO</label>
                <input type="date" id="f-agenda-date" required>
                <label>HORA DE INICIO</label>
                <input type="time" id="f-agenda-time" required>
                <button type="submit" class="modal-save-btn">Agendar Evento</button>
            `;
            document.getElementById('f-agenda-date').value = new Date().toISOString().split('T')[0];
        } else if (vistaActual === "ciclo") {
            form.innerHTML = `
                <label>REGISTRO DE SÍNTOMAS DEL DÍA</label>
                <input type="date" id="f-ciclo-date" required>
                <label>¿PRESENTA SANGRADO / FLUJO?</label>
                <select id="f-ciclo-sangrado">
                    <option value="no">No</option>
                    <option value="si">Sí</option>
                </select>
                <label>HORAS DE SUEÑO</label>
                <input type="number" id="f-ciclo-sueno" min="0" max="24" value="8" style="background:transparent; border:none; border-bottom:1px solid var(--text-color); color:var(--text-color); width:100%;">
                <label>NIVEL DE ENERGÍA</label>
                <select id="f-ciclo-energia">
                    <option value="alta">Alta</option>
                    <option value="media" selected>Media</option>
                    <option value="baja">Baja</option>
                </select>
                <label>ESTADO DE ÁNIMO</label>
                <select id="f-ciclo-animo">
                    <option value="calma" selected>Calma</option>
                    <option value="feliz">Feliz / Activa</option>
                    <option value="sensible">Sensible</option>
                    <option value="cansada">Cansada</option>
                </select>
                <label>OBSERVACIONES / DIARIO</label>
                <textarea id="f-ciclo-notas" rows="2" placeholder="Escribe cómo te sientes..."></textarea>
                <button type="submit" class="modal-save-btn">Guardar Estado</button>
            `;
            document.getElementById('f-ciclo-date').value = diaSeleccionadoCiclo;
        }

        injectorCampos.appendChild(form);
    }

    function procesarGuardadoFormularioInyectado() {
        if (vistaActual === "metas") {
            const txt = document.getElementById('f-meta-text').value.trim();
            if(txt) {
                let metas = JSON.parse(localStorage.getItem(`j_metas_${anioActual}`)) || [];
                metas.push({ text: txt, done: false });
                localStorage.setItem(`j_metas_${anioActual}`, JSON.stringify(metas));
            }
        } else if (vistaActual === "habitos") {
            const name = document.getElementById('f-habit-name').value.trim();
            if (name) {
                const llaveMes = `j_habits_${anioActual}_${mesActualId}`;
                let habitos = JSON.parse(localStorage.getItem(llaveMes)) || [];
                habitos.push({ name: name, history: [] });
                localStorage.setItem(llaveMes, JSON.stringify(habitos));
            }
        } else if (vistaActual === "todo") {
            const txt = document.getElementById('f-todo-text').value.trim();
            if (txt) {
                let tareas = JSON.parse(localStorage.getItem('j_todo_list')) || [];
                tareas.push({ text: txt, done: false });
                localStorage.setItem('j_todo_list', JSON.stringify(tareas));
            }
        } else if (vistaActual === "agenda") {
            const title = document.getElementById('f-agenda-title').value.trim();
            const date = document.getElementById('f-agenda-date').value;
            const time = document.getElementById('f-agenda-time').value;
            
            if (title && date) {
                let evs = JSON.parse(localStorage.getItem(`j_agenda_${date}`)) || [];
                evs.push({ title, time, done: false });
                // Ordenar por hora automáticamente
                evs.sort((a,b) => a.time.localeCompare(b.time));
                localStorage.setItem(`j_agenda_${date}`, JSON.stringify(evs));
                fechaSemanaAgenda = new Date(date + "T00:00:00");
            }
        } else if (vistaActual === "ciclo") {
            const date = document.getElementById('f-ciclo-date').value;
            if (date) {
                let logs = JSON.parse(localStorage.getItem('j_ciclo_logs')) || {};
                logs[date] = {
                    sangrado: document.getElementById('f-ciclo-sangrado').value,
                    sueno: document.getElementById('f-ciclo-sueno').value,
                    energia: document.getElementById('f-ciclo-energia').value,
                    animo: document.getElementById('f-ciclo-animo').value,
                    notas: document.getElementById('f-ciclo-notas').value.trim()
                };
                localStorage.setItem('j_ciclo_logs', JSON.stringify(logs));
                diaSeleccionadoCiclo = date;
            }
        }

        modoEdicionActivo = false;
        globalFab.classList.remove('active-editing');
        modalGlobal.classList.add('hidden');
        refrescarVistaActivaAislada();
        if (vistaActual === "ciclo") renderizarRuedaCiclo28();
    }

    // Cerrar modal si hacen click en el fondo sutil del mismo
    modalGlobal.onclick = (e) => {
        if (e.target === modalGlobal) {
            modoEdicionActivo = false;
            globalFab.classList.remove('active-editing');
            modalGlobal.classList.add('hidden');
            refrescarVistaActivaAislada();
        }
    };

    /* ==========================================
       HISTORIAL AUTOMÁTICO CRONOLÓGICO Y CONTROL
       ========================================== */
    function verificarTraspasoTemporalHistorico() {
        const ultimaRevisionAnio = localStorage.getItem('j_sys_last_year');
        const ultimaRevisionMes = localStorage.getItem('j_sys_last_month');

        if (ultimaRevisionAnio && parseInt(ultimaRevisionAnio) < anioActual) {
            // Guardar automáticamente en el vector de historial
            let historialMetas = JSON.parse(localStorage.getItem('j_history_metas')) || {};
            let metasViejas = JSON.parse(localStorage.getItem(`j_metas_${ultimaRevisionAnio}`)) || [];
            if(metasViejas.length > 0) {
                historialMetas[ultimaRevisionAnio] = metasViejas;
                localStorage.setItem('j_history_metas', JSON.stringify(historialMetas));
            }
        }
        localStorage.setItem('j_sys_last_year', anioActual);

        if (ultimaRevisionMes && (parseInt(ultimaRevisionMes) !== mesActualId)) {
            let historialHabitos = JSON.parse(localStorage.getItem('j_history_habitos')) || {};
            const anioEvaluado = ultimaRevisionMes > mesActualId ? anioActual - 1 : anioActual;
            let claveVieja = `j_habits_${anioEvaluado}_${ultimaRevisionMes}`;
            let habsViejos = JSON.parse(localStorage.getItem(claveVieja)) || [];
            
            if(habsViejos.length > 0) {
                historialHabitos[`${anioEvaluado}-${ultimaRevisionMes}`] = habsViejos;
                localStorage.setItem('j_history_habitos', JSON.stringify(historialHabitos));
            }
        }
        localStorage.setItem('j_sys_last_month', mesActualId);
    }

    // Eventos visualizadores de Historiales pasados
    document.getElementById('btn-historial-metas').onclick = () => {
        const hist = JSON.parse(localStorage.getItem('j_history_metas')) || {};
        if (Object.keys(hist).length === 0) return alert("No hay registros de años anteriores.");
        alert("Historial de Metas:\n" + JSON.stringify(hist, null, 2));
    };

    document.getElementById('btn-historial-habitos').onclick = () => {
        const hist = JSON.parse(localStorage.getItem('j_history_habitos')) || {};
        if (Object.keys(hist).length === 0) return alert("No hay registros de meses anteriores.");
        alert("Historial de Hábitos:\n" + JSON.stringify(hist, null, 2));
    };

    document.getElementById('btn-historial-ciclo').onclick = () => {
        const logs = JSON.parse(localStorage.getItem('j_ciclo_logs')) || {};
        if (Object.keys(logs).length === 0) return alert("No hay registros guardados en el ciclo.");
        alert("Todos los ciclos registrados:\n" + JSON.stringify(logs, null, 2));
    };

    /* ==========================================
       SECCIÓN: CONFIGURACIÓN GENERAL Y CONFIGS
       ========================================== */
    // Tema Oscuro / Claro alternador
    if (localStorage.getItem('journalDarkTheme') === 'true') {
        document.body.classList.add('dark-mode');
    }
    document.getElementById('cfg-toggle-theme').onclick = () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('journalDarkTheme', document.body.classList.contains('dark-mode'));
    };

    // Color de Acento Dinámico sutil
    const colorGuardado = localStorage.getItem('journalAccentColor');
    if (colorGuardado) {
        document.documentElement.style.setProperty('--accent-color', colorGuardado);
        document.getElementById('cfg-color-picker').value = colorGuardado;
    }
    document.getElementById('cfg-color-picker').oninput = (e) => {
        document.documentElement.style.setProperty('--accent-color', e.target.value);
        localStorage.setItem('journalAccentColor', e.target.value);
    };

    // Config Status PIN
    document.getElementById('cfg-toggle-pin-status').textContent = pinProteccionActiva ? "Activo" : "Inactivo";
    document.getElementById('cfg-toggle-pin-status').onclick = () => {
        pinProteccionActiva = !pinProteccionActiva;
        localStorage.setItem('journalPinActivo', pinProteccionActiva);
        document.getElementById('cfg-toggle-pin-status').textContent = pinProteccionActiva ? "Activo" : "Inactivo";
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
            } catch(err) {
                alert("Archivo JSON no válido.");
            }
        };
        reader.readAsText(file);
    };

});