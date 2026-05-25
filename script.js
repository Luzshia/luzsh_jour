/* --- SISTEMA CORE DEL DIARIO CON METAS, HÁBITOS, TO-DO, AGENDA Y CICLO MENSTRUAL --- */
document.addEventListener('DOMContentLoaded', () => {
    
    const NOMBRES_MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const DIAS_SEMANA = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

    // Estado global de la aplicación
    let JournalState = {
        vistaActual: 'menu',
        // --- PROPIEDAD NUEVA: CONFIGURACIÓN DEL SISTEMA ---
        
        
        // Estado Metas
        modoEdicionMetas: false,
        anioSeleccionado: new Date().getFullYear(),
        metasCache: JSON.parse(localStorage.getItem('journal_metas_db')) || {},

        // Estado Hábitos
        modoEdicionHabitos: false,
        mesSeleccionado: new Date().getMonth(),      
        anioHabitosSeleccionado: new Date().getFullYear(),
        habitosCache: JSON.parse(localStorage.getItem('journal_habitos_db')) || {},

        // Estado To-Do List
        modoEdicionTodo: false,
        todoCache: JSON.parse(localStorage.getItem('journal_todo_db')) || [],

        // Estado Agenda Semanal
        modoEdicionAgenda: false,
        fechaPivoteAgenda: obtenerLunesSemanaActual(new Date()),
        agendaCache: JSON.parse(localStorage.getItem('journal_agenda_db')) || {},

        // Estado Ciclo Menstrual
        modoEdicionCiclo: false,
        ciclosHistorial: JSON.parse(localStorage.getItem('journal_ciclos_v1')) || [], 
        // Estructura: [ { fechaInicio: '2026-04-30', registros: { '2026-04-30': { bleed:'medium', sleep:8, energy:'Normal', mood:'Feliz', notes:'' } } } ]
        indiceCicloVisible: 0,

        // --- PROPIEDAD NUEVA: CONFIGURACIÓN DEL SISTEMA ---
        config: JSON.parse(localStorage.getItem('journal_config_db')) || {
            theme: 'light',
            accent: '#556b2f',
            pinEnabled: false,
            pinCode: '0000'
        }
    };

    function inicializarNavegacion() {
        if (!window.history.state) {
            window.history.replaceState({ vista: 'menu' }, '');
        }

        window.onpopstate = function(evento) {
            if (evento.state && evento.state.vista) {
                ejecutarCambioVista(evento.state.vista, false);
            } else {
                ejecutarCambioVista('menu', false);
            }
        };

        // Enlaces menú
        document.getElementById('btn-nav-metas').onclick = () => ejecutarCambioVista('metas', true);
        document.getElementById('btn-nav-habitos').onclick = () => ejecutarCambioVista('habitos', true);
        document.getElementById('btn-nav-todo').onclick = () => ejecutarCambioVista('todo', true);
        document.getElementById('btn-nav-agenda').onclick = () => ejecutarCambioVista('agenda', true);
        document.getElementById('btn-nav-ciclo').onclick = () => ejecutarCambioVista('ciclo', true);
        
        // Eventos Metas
        document.getElementById('btn-goals-prev-year').onclick = () => cambiarAnioGoals(-1);
        document.getElementById('btn-goals-next-year').onclick = () => cambiarAnioGoals(1);
        document.getElementById('btn-goals-toggle-edit').onclick = (e) => { e.stopPropagation(); toggleModoEdicionMetas(); };
        document.getElementById('goals-blank-space').onclick = (e) => {
            if (JournalState.modoEdicionMetas && (e.target.id === 'goals-blank-space' || e.target.id === 'goals-list-container')) {
                desactivarYGuardarModoEdicionMetas();
            }
        };
        document.getElementById('input-new-goal').onkeypress = (e) => { if (e.key === 'Enter') agregarNuevaMetaDesdeInput(); };

        // Eventos Hábitos
        document.getElementById('btn-habits-prev-month').onclick = () => cambiarMesHabitos(-1);
        document.getElementById('btn-habits-next-month').onclick = () => cambiarMesHabitos(1);
        document.getElementById('btn-habits-toggle-edit').onclick = (e) => { e.stopPropagation(); toggleModoEdicionHabitos(); };
        document.getElementById('habits-blank-space').onclick = (e) => {
            if (JournalState.modoEdicionHabitos && (e.target.id === 'habits-blank-space' || e.target.id === 'habits-grid-container')) {
                desactivarYGuardarModoEdicionHabitos();
            }
        };
        document.getElementById('input-new-habit').onkeypress = (e) => { if (e.key === 'Enter') agregarNuevoHabitoDesdeInput(); };

        // Eventos To-Do
        document.getElementById('btn-todo-toggle-edit').onclick = (e) => { e.stopPropagation(); toggleModoEdicionTodo(); };
        document.getElementById('todo-blank-space').onclick = (e) => {
            if (JournalState.modoEdicionTodo && (e.target.id === 'todo-blank-space' || e.target.id === 'todo-list-container')) {
                desactivarYGuardarModoEdicionTodo();
            }
        };
        document.getElementById('input-new-todo').onkeypress = (e) => { if (e.key === 'Enter') agregarNuevaTareaDesdeInput(); };
        document.getElementById('btn-todo-clear-completed').onclick = (e) => { e.stopPropagation(); limpiarTareasCompletadas(); };

        // Eventos Agenda
        document.getElementById('btn-agenda-prev-week').onclick = () => cambiarSemanaAgenda(-7);
        document.getElementById('btn-agenda-next-week').onclick = () => cambiarSemanaAgenda(7);
        document.getElementById('btn-agenda-toggle-edit').onclick = (e) => { e.stopPropagation(); toggleModoEdicionAgenda(); };
        document.getElementById('btn-agenda-clear-completed').onclick = (e) => { e.stopPropagation(); limpiarEventosTachadosSemana(); };
        document.getElementById('btn-agenda-modal-close').onclick = () => cerrarModalAgenda();
        document.getElementById('btn-agenda-modal-save').onclick = () => guardarModalAgenda();
        document.getElementById('agenda-blank-space').onclick = (e) => {
            if (JournalState.modoEdicionAgenda && e.target.id === 'agenda-blank-space') {
                desactivarYGuardarModoEdicionAgenda();
            }
        };

        // Eventos Ciclo Menstrual
        // Cambios dentro de inicializarNavegacion() correspondientes al ciclo:
        document.getElementById('btn-cycle-prev').onclick = () => navegarCicloHistorial(-1);
        document.getElementById('btn-cycle-next').onclick = () => navegarCicloHistorial(1);
        document.getElementById('select-cycle-history').onchange = (e) => {
            JournalState.indiceCicloVisible = parseInt(e.target.value);
            renderizarCicloCompleto();
        };
        document.getElementById('btn-cycle-toggle-edit').onclick = (e) => { e.stopPropagation(); abrirModalCicloHoy(); };
        document.getElementById('btn-cycle-modal-close').onclick = () => cerrarModalCiclo();
        document.getElementById('btn-cycle-modal-save').onclick = () => guardarModalCiclo();
        document.getElementById('btn-cycle-view-close').onclick = () => cerrarModalVisorCiclo();
        document.getElementById('cycle-blank-space').onclick = (e) => {
            if (JournalState.modoEdicionCiclo) {
                desactivarModoEdicionCiclo();
            }
            cerrarModalVisorCiclo();
        };

        // Eventos Configuración
        document.getElementById('btn-nav-config').onclick = () => ejecutarCambioVista('config', true);
        
        document.getElementById('cfg-theme').onchange = (e) => guardarPreferenciaAjuste('theme', e.target.value);
        document.getElementById('cfg-accent').onchange = (e) => guardarPreferenciaAjuste('accent', e.target.value);
        document.getElementById('cfg-pin-toggle').onchange = (e) => procesarCambioEstadoPin(e.target.value === 'true');
        document.getElementById('btn-cfg-change-pin').onclick = () => invocarCambioCodigoPin();
        
        // Triggers de Backups
        document.getElementById('btn-cfg-export').onclick = () => procesarExportacionBackup();
        document.getElementById('btn-cfg-import-trigger').onclick = () => document.getElementById('cfg-file-input').click();
        document.getElementById('cfg-file-input').onchange = (e) => procesarImportacionBackup(e);

        // Aplicación inicial de estilos y verificación de seguridad inmediata
        aplicarAjustesEstiloVisual();
        evaluarBloqueoPinSeguridad();

        
    }

    function ejecutarCambioVista(proximaVista, registrarHistorial = true) {
        if (JournalState.vistaActual === 'metas') desactivarYGuardarModoEdicionMetas();
        if (JournalState.vistaActual === 'habitos') desactivarYGuardarModoEdicionHabitos();
        if (JournalState.vistaActual === 'todo') desactivarYGuardarModoEdicionTodo();
        if (JournalState.vistaActual === 'agenda') desactivarYGuardarModoEdicionAgenda();
        if (JournalState.vistaActual === 'ciclo') desactivarModoEdicionCiclo();
        if (JournalState.vistaActual === 'config') { /* No requiere limpieza especial */ }

        document.getElementById('view-menu').classList.add('hidden');
        document.getElementById('view-metas').classList.add('hidden');
        document.getElementById('view-habitos').classList.add('hidden');
        document.getElementById('view-todo').classList.add('hidden');
        document.getElementById('view-agenda').classList.add('hidden');
        document.getElementById('view-ciclo').classList.add('hidden');
        document.getElementById('view-config').classList.add('hidden');

        if (registrarHistorial && proximaVista !== JournalState.vistaActual) {
            window.history.pushState({ vista: proximaVista }, '');
        }

        JournalState.vistaActual = proximaVista;
        
        if (proximaVista === 'menu') {
            document.getElementById('view-menu').classList.remove('hidden');
        } else if (proximaVista === 'metas') {
            document.getElementById('view-metas').classList.remove('hidden');
            document.getElementById('goals-year-display').innerText = JournalState.anioSeleccionado;
            renderizarMetas();
        } else if (proximaVista === 'habitos') {
            document.getElementById('view-habitos').classList.remove('hidden');
            actualizarCabeceraMesHabitos();
            renderizarHabitos();
        } else if (proximaVista === 'todo') {
            document.getElementById('view-todo').classList.remove('hidden');
            renderizarTodo();
        } else if (proximaVista === 'agenda') {
            document.getElementById('view-agenda').classList.remove('hidden');
            actualizarCabeceraSemanaAgenda();
            renderizarAgenda();
        } else if (proximaVista === 'ciclo') {
            document.getElementById('view-ciclo').classList.remove('hidden');
            verificarYCrearCicloInicial();
            construirSelectorHistorialCiclos();
            renderizarCicloCompleto();
        } else if (proximaVista === 'config') {
         document.getElementById('view-config').classList.remove('hidden');
     }
    }

    // --- UTILS COMUNES ---
    function obtenerLunesSemanaActual(d) {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
        return new Date(date.setDate(diff));
    }

    function formatearFechaISO(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function sumarDiasFecha(fechaStr, dias) {
        const d = new Date(fechaStr + "T00:00:00");
        d.setDate(d.getDate() + dias);
        return formatearFechaISO(d);
    }

    function calcularDiferenciaDias(f1, f2) {
        const d1 = new Date(f1 + "T00:00:00");
        const d2 = new Date(f2 + "T00:00:00");
        return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
    }


    // --- SECCIÓN: METAS ---
    function cambiarAnioGoals(direccion) {
        desactivarYGuardarModoEdicionMetas();
        JournalState.anioSeleccionado += direccion;
        document.getElementById('goals-year-display').innerText = JournalState.anioSeleccionado;
        renderizarMetas();
    }

    function renderizarMetas() {
        const contenedorLista = document.getElementById('goals-list-container');
        contenedorLista.innerHTML = '';
        const anio = JournalState.anioSeleccionado;
        if (!JournalState.metasCache[anio]) JournalState.metasCache[anio] = [];
        
        if (JournalState.modoEdicionMetas) contenedorLista.classList.add('edit-mode-active');
        else contenedorLista.classList.remove('edit-mode-active');

        JournalState.metasCache[anio].forEach((meta, indice) => {
            const li = document.createElement('li');
            li.className = `goal-item ${meta.completado ? 'completed' : ''}`;
            if (JournalState.modoEdicionMetas) {
                const input = document.createElement('input');
                input.type = 'text'; input.className = 'inline-edit-input'; input.value = meta.texto;
                input.oninput = (e) => meta.texto = e.target.value;
                input.onclick = (e) => e.stopPropagation();
                li.appendChild(input);

                const btn = document.createElement('button');
                btn.type = 'button'; btn.className = 'goal-delete-btn'; btn.innerText = 'x';
                btn.onclick = (e) => { e.stopPropagation(); eliminarMeta(indice); };
                li.appendChild(btn);
            } else {
                li.innerText = meta.texto;
                li.onclick = () => { meta.completado = !meta.completado; localStorage.setItem('journal_metas_db', JSON.stringify(JournalState.metasCache)); renderizarMetas(); };
            }
            contenedorLista.appendChild(li);
        });
    }

    function toggleModoEdicionMetas() {
        if (JournalState.modoEdicionMetas) desactivarYGuardarModoEdicionMetas();
        else {
            JournalState.modoEdicionMetas = true;
            document.getElementById('btn-goals-toggle-edit').classList.add('active-edit');
            document.getElementById('new-goal-box').classList.remove('hidden');
            renderizarMetas();
        }
    }

    function desactivarYGuardarModoEdicionMetas() {
        if (!JournalState.modoEdicionMetas) return;
        agregarNuevaMetaDesdeInput();
        const anio = JournalState.anioSeleccionado;
        JournalState.metasCache[anio] = JournalState.metasCache[anio].filter(m => m.texto.trim() !== '');
        JournalState.modoEdicionMetas = false;
        document.getElementById('btn-goals-toggle-edit').classList.remove('active-edit');
        document.getElementById('new-goal-box').classList.add('hidden');
        localStorage.setItem('journal_metas_db', JSON.stringify(JournalState.metasCache));
        renderizarMetas();
    }

    function agregarNuevaMetaDesdeInput() {
        const input = document.getElementById('input-new-goal');
        const texto = input.value.trim();
        if (texto !== '') {
            JournalState.metasCache[JournalState.anioSeleccionado].push({ texto: texto, completado: false });
            input.value = '';
            renderizarMetas();
        }
    }

    function eliminarMeta(indice) {
        JournalState.metasCache[JournalState.anioSeleccionado].splice(indice, 1);
        renderizarMetas();
    }


    // --- SECCIÓN: HÁBITOS ---
    function cambiarMesHabitos(direccion) {
        desactivarYGuardarModoEdicionHabitos();
        JournalState.mesSeleccionado += direccion;
        if (JournalState.mesSeleccionado > 11) {
            JournalState.mesSeleccionado = 0; JournalState.anioHabitosSeleccionado++;
        } else if (JournalState.mesSeleccionado < 0) {
            JournalState.mesSeleccionado = 11; JournalState.anioHabitosSeleccionado--;
        }
        actualizarCabeceraMesHabitos();
        renderizarHabitos();
    }

    function actualizarCabeceraMesHabitos() {
        document.getElementById('habits-month-display').innerText = `${NOMBRES_MESES[JournalState.mesSeleccionado]} de ${JournalState.anioHabitosSeleccionado}`;
    }

    function renderizarHabitos() {
        const gridContainer = document.getElementById('habits-grid-container');
        gridContainer.innerHTML = '';
        const llaveMes = `${JournalState.anioHabitosSeleccionado}-${JournalState.mesSeleccionado}`;
        if (!JournalState.habitosCache[llaveMes]) JournalState.habitosCache[llaveMes] = [];

        if (JournalState.modoEdicionHabitos) gridContainer.classList.add('edit-mode-active');
        else gridContainer.classList.remove('edit-mode-active');

        const diasDelMes = new Date(JournalState.anioHabitosSeleccionado, JournalState.mesSeleccionado + 1, 0).getDate();
        let primerDiaSemana = new Date(JournalState.anioHabitosSeleccionado, JournalState.mesSeleccionado, 1).getDay();
        primerDiaSemana = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;

        JournalState.habitosCache[llaveMes].forEach((habito, indice) => {
            const card = document.createElement('div'); card.className = 'habit-card';
            const header = document.createElement('div'); header.className = 'habit-card-header';

            if (JournalState.modoEdicionHabitos) {
                const input = document.createElement('input'); input.type = 'text'; input.className = 'inline-edit-input'; input.value = habito.nombre;
                input.oninput = (e) => habito.nombre = e.target.value;
                input.onclick = (e) => e.stopPropagation();
                const titleWrap = document.createElement('h3'); titleWrap.className = 'habit-card-title'; titleWrap.appendChild(input);
                header.appendChild(titleWrap);
                const btnBorrar = document.createElement('button'); btnBorrar.type = 'button'; btnBorrar.className = 'habit-delete-btn'; btnBorrar.innerText = 'x';
                btnBorrar.onclick = (e) => { e.stopPropagation(); eliminarHabito(indice); };
                header.appendChild(btnBorrar);
            } else {
                const titulo = document.createElement('h3'); titulo.className = 'habit-card-title'; titulo.innerText = habito.nombre;
                header.appendChild(titulo);
            }

            card.appendChild(header);
            const divider = document.createElement('hr'); divider.className = 'habit-card-divider'; card.appendChild(divider);
            const calGrid = document.createElement('div'); calGrid.className = 'mini-calendar-grid';

            ['l', 'm', 'x', 'j', 'v', 's', 'd'].forEach(l => {
                const lbl = document.createElement('div'); lbl.className = 'calendar-day-label'; lbl.innerText = l; calGrid.appendChild(lbl);
            });

            for (let i = 0; i < primerDiaSemana; i++) {
                const emptySlot = document.createElement('div'); emptySlot.className = 'calendar-empty-slot'; calGrid.appendChild(emptySlot);
            }

            for (let dia = 1; dia <= diasDelMes; dia++) {
                const circulo = document.createElement('div');
                const estaChequeado = habito.checks.includes(dia);
                circulo.className = `calendar-circle-day ${estaChequeado ? 'checked' : ''}`; circulo.innerText = dia;
                circulo.onclick = () => {
                    if (estaChequeado) habito.checks = habito.checks.filter(d => d !== dia);
                    else habito.checks.push(dia);
                    localStorage.setItem('journal_habitos_db', JSON.stringify(JournalState.habitosCache));
                    renderizarHabitos();
                };
                calGrid.appendChild(circulo);
            }
            card.appendChild(calGrid); gridContainer.appendChild(card);
        });
    }

    function toggleModoEdicionHabitos() {
        if (JournalState.modoEdicionHabitos) desactivarYGuardarModoEdicionHabitos();
        else {
            JournalState.modoEdicionHabitos = true;
            document.getElementById('btn-habits-toggle-edit').classList.add('active-edit');
            document.getElementById('new-habit-box').classList.remove('hidden');
            renderizarHabitos();
        }
    }

    function desactivarYGuardarModoEdicionHabitos() {
        if (!JournalState.modoEdicionHabitos) return;
        agregarNuevoHabitoDesdeInput();
        const llaveMes = `${JournalState.anioHabitosSeleccionado}-${JournalState.mesSeleccionado}`;
        JournalState.habitosCache[llaveMes] = JournalState.habitosCache[llaveMes].filter(h => h.nombre.trim() !== '');
        JournalState.modoEdicionHabitos = false;
        document.getElementById('btn-habits-toggle-edit').classList.remove('active-edit');
        document.getElementById('new-habit-box').classList.add('hidden');
        localStorage.setItem('journal_habitos_db', JSON.stringify(JournalState.habitosCache));
        renderizarHabitos();
    }

    function agregarNuevoHabitoDesdeInput() {
        const input = document.getElementById('input-new-habit');
        const nombre = input.value.trim();
        if (nombre !== '') {
            const llaveMes = `${JournalState.anioHabitosSeleccionado}-${JournalState.mesSeleccionado}`;
            JournalState.habitosCache[llaveMes].push({ nombre: nombre, checks: [] });
            input.value = ''; renderizarHabitos();
        }
    }

    function eliminarHabito(indice) {
        const llaveMes = `${JournalState.anioHabitosSeleccionado}-${JournalState.mesSeleccionado}`;
        JournalState.habitosCache[llaveMes].splice(indice, 1); renderizarHabitos();
    }


    // --- SECCIÓN: TO-DO LIST ---
    function renderizarTodo() {
        const contenedorLista = document.getElementById('todo-list-container');
        contenedorLista.innerHTML = '';
        if (JournalState.modoEdicionTodo) contenedorLista.classList.add('edit-mode-active');
        else contenedorLista.classList.remove('edit-mode-active');

        JournalState.todoCache.forEach((tarea, indice) => {
            const li = document.createElement('li'); li.className = `todo-item ${tarea.completado ? 'completed' : ''}`;
            const checkbox = document.createElement('div'); checkbox.className = 'todo-checkbox'; li.appendChild(checkbox);

            if (JournalState.modoEdicionTodo) {
                const input = document.createElement('input'); input.type = 'text'; input.className = 'inline-edit-input'; input.value = tarea.texto;
                input.oninput = (e) => tarea.texto = e.target.value;
                input.onclick = (e) => e.stopPropagation(); li.appendChild(input);
                const btnBorrar = document.createElement('button'); btnBorrar.type = 'button'; btnBorrar.className = 'goal-delete-btn'; btnBorrar.innerText = 'x';
                btnBorrar.onclick = (e) => { e.stopPropagation(); eliminarTarea(indice); }; li.appendChild(btnBorrar);
            } else {
                li.appendChild(document.createTextNode(tarea.texto));
                li.onclick = () => { tarea.completado = !tarea.completado; localStorage.setItem('journal_todo_db', JSON.stringify(JournalState.todoCache)); renderizarTodo(); };
            }
            contenedorLista.appendChild(li);
        });
    }

    function toggleModoEdicionTodo() {
        if (JournalState.modoEdicionTodo) desactivarYGuardarModoEdicionTodo();
        else {
            JournalState.modoEdicionTodo = true;
            document.getElementById('btn-todo-toggle-edit').classList.add('active-edit');
            document.getElementById('new-todo-box').classList.remove('hidden');
            document.getElementById('btn-todo-clear-completed').classList.remove('hidden');
            renderizarTodo();
        }
    }

    function desactivarYGuardarModoEdicionTodo() {
        if (!JournalState.modoEdicionTodo) return;
        agregarNuevaTareaDesdeInput();
        JournalState.todoCache = JournalState.todoCache.filter(t => t.texto.trim() !== '');
        JournalState.modoEdicionTodo = false;
        document.getElementById('btn-todo-toggle-edit').classList.remove('active-edit');
        document.getElementById('new-todo-box').classList.add('hidden');
        document.getElementById('btn-todo-clear-completed').classList.add('hidden');
        localStorage.setItem('journal_todo_db', JSON.stringify(JournalState.todoCache));
        renderizarTodo();
    }

    function agregarNuevaTareaDesdeInput() {
        const input = document.getElementById('input-new-todo');
        const texto = input.value.trim();
        if (texto !== '') {
            JournalState.todoCache.push({ texto: texto, completado: false });
            input.value = ''; renderizarTodo();
        }
    }

    function eliminarTarea(indice) {
        JournalState.todoCache.splice(indice, 1); renderizarTodo();
    }

    function limpiarTareasCompletadas() {
        JournalState.todoCache = JournalState.todoCache.filter(t => !t.completado);
        localStorage.setItem('journal_todo_db', JSON.stringify(JournalState.todoCache));
        renderizarTodo();
    }


    // --- SECCIÓN: AGENDA SEMANAL ---
    function cambiarSemanaAgenda(diasDiferencia) {
        desactivarYGuardarModoEdicionAgenda();
        const copiaFecha = new Date(JournalState.fechaPivoteAgenda);
        copiaFecha.setDate(copiaFecha.getDate() + diasDiferencia);
        JournalState.fechaPivoteAgenda = copiaFecha;
        actualizarCabeceraSemanaAgenda();
        renderizarAgenda();
    }

    function actualizarCabeceraSemanaAgenda() {
        const lunes = new Date(JournalState.fechaPivoteAgenda);
        const domingo = new Date(lunes); domingo.setDate(domingo.getDate() + 6);
        let textoCabecera = "";
        if (lunes.getFullYear() === domingo.getFullYear()) {
            if (lunes.getMonth() === domingo.getMonth()) {
                textoCabecera = `${NOMBRES_MESES[lunes.getMonth()]} ${lunes.getFullYear()}`;
            } else {
                textoCabecera = `${NOMBRES_MESES[lunes.getMonth()]} - ${NOMBRES_MESES[domingo.getMonth()]} ${lunes.getFullYear()}`;
            }
        } else {
            textoCabecera = `${NOMBRES_MESES[lunes.getMonth()]} ${lunes.getFullYear()} - ${NOMBRES_MESES[domingo.getMonth()]} ${domingo.getFullYear()}`;
        }
        document.getElementById('agenda-week-display').innerText = textoCabecera;
    }

    function renderizarAgenda() {
        const contenedorSemana = document.getElementById('agenda-week-container');
        contenedorSemana.innerHTML = '';
        if (JournalState.modoEdicionAgenda) contenedorSemana.classList.add('edit-mode-active');
        else contenedorSemana.classList.remove('edit-mode-active');

        let iteradorFecha = new Date(JournalState.fechaPivoteAgenda);
        for (let i = 0; i < 7; i++) {
            const stringFechaISO = formatearFechaISO(iteradorFecha);
            const numDia = iteradorFecha.getDate();
            const nombreDiaStr = DIAS_SEMANA[i];
            const esFinDeSemana = (i === 5 || i === 6);

            const filaDia = document.createElement('div');
            filaDia.className = `agenda-day-row ${esFinDeSemana ? 'weekend' : ''}`;
            filaDia.onclick = () => { if (JournalState.modoEdicionAgenda) abrirModalAgenda(stringFechaISO); };

            const metaBox = document.createElement('div');
            metaBox.className = 'agenda-day-meta';
            const numeroNodo = document.createElement('span'); numeroNodo.className = 'agenda-day-number'; numeroNodo.innerText = numDia;
            const textoNodo = document.createElement('span'); textoNodo.className = 'agenda-day-name'; textoNodo.innerText = nombreDiaStr.substring(0, 3);
            metaBox.appendChild(numeroNodo); metaBox.appendChild(textoNodo); filaDia.appendChild(metaBox);

            const cajaEventos = document.createElement('div'); cajaEventos.className = 'agenda-day-events-box';
            const eventosDelDia = JournalState.agendaCache[stringFechaISO] || [];
            eventosDelDia.sort((a, b) => a.hora.localeCompare(b.hora));

            eventosDelDia.forEach((evento, indiceInterno) => {
                const itemEvento = document.createElement('div');
                itemEvento.className = `agenda-event-item ${evento.completado ? 'completed-task' : ''}`;
                itemEvento.onclick = (e) => {
                    e.stopPropagation();
                    if (JournalState.modoEdicionAgenda) abrirModalAgenda(stringFechaISO, indiceInterno);
                    else {
                        evento.completado = !evento.completado;
                        localStorage.setItem('journal_agenda_db', JSON.stringify(JournalState.agendaCache));
                        renderizarAgenda();
                    }
                };
                if (evento.hora) {
                    const nodoHora = document.createElement('span'); nodoHora.className = 'agenda-event-time'; nodoHora.innerText = evento.hora;
                    itemEvento.appendChild(nodoHora);
                }
                const nodoTexto = document.createElement('span'); nodoTexto.innerText = evento.texto; itemEvento.appendChild(nodoTexto);
                const btnX = document.createElement('button'); btnX.type = 'button'; btnX.className = 'event-delete-btn'; btnX.innerText = 'x';
                btnX.onclick = (e) => { e.stopPropagation(); eliminarEventoAgenda(stringFechaISO, indiceInterno); };
                itemEvento.appendChild(btnX); cajaEventos.appendChild(itemEvento);
            });
            filaDia.appendChild(cajaEventos); contenedorSemana.appendChild(filaDia);
            iteradorFecha.setDate(iteradorFecha.getDate() + 1);
        }
    }

    function toggleModoEdicionAgenda() {
        if (JournalState.modoEdicionAgenda) desactivarYGuardarModoEdicionAgenda();
        else {
            JournalState.modoEdicionAgenda = true;
            document.getElementById('btn-agenda-toggle-edit').classList.add('active-edit');
            document.getElementById('btn-agenda-clear-completed').classList.remove('hidden');
            renderizarAgenda();
        }
    }

    function desactivarYGuardarModoEdicionAgenda() {
        if (!JournalState.modoEdicionAgenda) return;
        cerrarModalAgenda(); JournalState.modoEdicionAgenda = false;
        document.getElementById('btn-agenda-toggle-edit').classList.remove('active-edit');
        document.getElementById('btn-agenda-clear-completed').classList.add('hidden');
        renderizarAgenda();
    }

    function abrirModalAgenda(fechaISO, indiceEvento = -1) {
        document.getElementById('form-agenda-date').value = fechaISO;
        document.getElementById('form-agenda-index').value = indiceEvento;
        const inputTexto = document.getElementById('form-agenda-text');
        const inputHora = document.getElementById('form-agenda-time');
        const tituloModal = document.getElementById('agenda-modal-title-text');

        if (indiceEvento > -1) {
            const ev = JournalState.agendaCache[fechaISO][indiceEvento];
            tituloModal.innerText = "Editar Evento"; inputTexto.value = ev.texto; inputHora.value = ev.hora;
        } else {
            tituloModal.innerText = "Nuevo Evento"; inputTexto.value = ""; inputHora.value = "12:00";
        }
        document.getElementById('agenda-event-modal').classList.remove('hidden');
        inputTexto.focus();
    }

    function cerrarModalAgenda() { document.getElementById('agenda-event-modal').classList.add('hidden'); }

    function guardarModalAgenda() {
        const fechaISO = document.getElementById('form-agenda-date').value;
        const indice = parseInt(document.getElementById('form-agenda-index').value);
        const texto = document.getElementById('form-agenda-text').value.trim();
        const hora = document.getElementById('form-agenda-time').value;

        if (texto === '') return;
        if (!JournalState.agendaCache[fechaISO]) JournalState.agendaCache[fechaISO] = [];

        if (indice > -1) {
            JournalState.agendaCache[fechaISO][indice].texto = texto;
            JournalState.agendaCache[fechaISO][indice].hora = hora;
        } else {
            JournalState.agendaCache[fechaISO].push({ texto: texto, hora: hora, completado: false });
        }
        localStorage.setItem('journal_agenda_db', JSON.stringify(JournalState.agendaCache));
        cerrarModalAgenda(); renderizarAgenda();
    }

    function eliminarEventoAgenda(fechaISO, indice) {
        JournalState.agendaCache[fechaISO].splice(indice, 1);
        if (JournalState.agendaCache[fechaISO].length === 0) delete JournalState.agendaCache[fechaISO];
        localStorage.setItem('journal_agenda_db', JSON.stringify(JournalState.agendaCache));
        renderizarAgenda();
    }

    function limpiarEventosTachadosSemana() {
        let iterador = new Date(JournalState.fechaPivoteAgenda);
        for (let i = 0; i < 7; i++) {
            const iso = formatearFechaISO(iterador);
            if (JournalState.agendaCache[iso]) {
                JournalState.agendaCache[iso] = JournalState.agendaCache[iso].filter(ev => !ev.completado);
                if (JournalState.agendaCache[iso].length === 0) delete JournalState.agendaCache[iso];
            }
            iterador.setDate(iterador.getDate() + 1);
        }
        localStorage.setItem('journal_agenda_db', JSON.stringify(JournalState.agendaCache));
        renderizarAgenda();
    }


    // ==========================================================================
    // --- SECCIÓN NUEVA: MOTOR MATEMÁTICO DEL CICLO MENSTRUAL DIAL ---
    // ==========================================================================

    // ==========================================================================
    // --- SECCIÓN: MOTOR MATEMÁTICO DEL CICLO MENSTRUAL DIAL ---
    // ==========================================================================

    function verificarYCrearCicloInicial() {
        if (JournalState.ciclosHistorial.length === 0) {
            JournalState.ciclosHistorial.push({
                fechaInicio: '2026-04-30',
                registros: {}
            });
            localStorage.setItem('journal_ciclos_v1', JSON.stringify(JournalState.ciclosHistorial));
        }
    }

    function construirSelectorHistorialCiclos() {
        const select = document.getElementById('select-cycle-history');
        select.innerHTML = '';
        JournalState.ciclosHistorial.forEach((ciclo, idx) => {
            const opcion = document.createElement('option');
            opcion.value = idx;
            const f = new Date(ciclo.fechaInicio + "T00:00:00");
            opcion.innerText = `Ciclo: ${f.getDate()} ${NOMBRES_MESES[f.getMonth()].substring(0,3)}`;
            select.appendChild(opcion);
        });
        select.value = JournalState.indiceCicloVisible;
    }

    function navegarCicloHistorial(direccion) {
        let nuevoIndice = JournalState.indiceCicloVisible + direccion;
        if (nuevoIndice >= 0 && nuevoIndice < JournalState.ciclosHistorial.length) {
            JournalState.indiceCicloVisible = nuevoIndice;
            document.getElementById('select-cycle-history').value = nuevoIndice;
            renderizarCicloCompleto();
        }
    }

    function renderizarCicloCompleto() {
        const wrapper = document.getElementById('cycle-wheel-svg-container');
        wrapper.innerHTML = '';

        const cicloActual = JournalState.ciclosHistorial[JournalState.indiceCicloVisible];
        const fechaHoyISO = formatearFechaISO(new Date());

        const size = 200;
        const center = size / 2;
        const radioRueda = 75; // Un poco más amplio al no tener esferas estorbando
        const totalDiasAproximados = 28;

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");

        // Dibujar los números directamente sobre la circunferencia del dial
        for (let diaId = 1; diaId <= totalDiasAproximados; diaId++) {
            const stringFechaDia = sumarDiasFecha(cicloActual.fechaInicio, diaId - 1);
            const datosAnotados = cicloActual.registros[stringFechaDia] || null;
            const tieneSangrado = (datosAnotados && datosAnotados.bleed !== 'none');
            const esElDiaDeHoy = (stringFechaDia === fechaHoyISO);

            const angulo = ((diaId - 1) * (360 / totalDiasAproximados) - 90) * (Math.PI / 180);
            const x = center + radioRueda * Math.cos(angulo);
            const y = center + radioRueda * Math.sin(angulo);

            const grupoNodo = document.createElementNS("http://www.w3.org/2000/svg", "g");
            grupoNodo.setAttribute("class", "cycle-wheel-day-node");
            
            grupoNodo.onclick = (e) => {
                e.stopPropagation();
                if (JournalState.modoEdicionCiclo) {
                    abrirModalCicloEspecifico(stringFechaDia);
                } else {
                    abrirModalVisorCiclo(stringFechaDia, diaId);
                }
            };

            // Aro de hoy sutil envolviendo el número flotante
            if (esElDiaDeHoy) {
                const aroHoy = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                aroHoy.setAttribute("cx", x); aroHoy.setAttribute("cy", y - 0.5);
                aroHoy.setAttribute("r", 9); aroHoy.setAttribute("class", "node-today-ring");
                grupoNodo.appendChild(aroHoy);
            }

            // Texto numérico tipográfico minimalista sin círculos de fondo
            const textoNumero = document.createElementNS("http://www.w3.org/2000/svg", "text");
            textoNumero.setAttribute("x", x); textoNumero.setAttribute("y", y);
            textoNumero.setAttribute("class", `node-text-day ${tieneSangrado ? 'text-has-bleed' : ''}`);
            textoNumero.textContent = diaId;
            grupoNodo.appendChild(textoNumero);

            // Micro-punto minimalista abajo del número si hay sangrado registrado
            if (tieneSangrado) {
                const puntoSangre = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                puntoSangre.setAttribute("cx", x); puntoSangre.setAttribute("cy", y + 6);
                puntoSangre.setAttribute("r", 1.2); puntoSangre.setAttribute("class", "node-bleed-dot");
                grupoNodo.appendChild(puntoSangre);
            }

            svg.appendChild(grupoNodo);
        }

        // --- BLOQUE CENTRAL: DÍA DEL CICLO + FECHA CORRESPONDIENTE ---
        const gCentro = document.createElementNS("http://www.w3.org/2000/svg", "g");
        
        const textoDiaCentro = document.createElementNS("http://www.w3.org/2000/svg", "text");
        textoDiaCentro.setAttribute("x", center);
        textoDiaCentro.setAttribute("y", center - 4);
        textoDiaCentro.setAttribute("style", "font-family:var(--font-handwritten); font-size:15px; font-weight:bold; text-anchor:middle; fill:#556b2f;");
        
        const diasTranscurridosHoy = calcularDiferenciaDias(cicloActual.fechaInicio, fechaHoyISO);
        let fechaExhibidaElemento = new Date();

        if (diasTranscurridosHoy >= 0 && diasTranscurridosHoy < 35) {
            textoDiaCentro.textContent = `Día ${diasTranscurridosHoy + 1}`;
            fechaExhibidaElemento = new Date(fechaHoyISO + "T00:00:00");
        } else {
            textoDiaCentro.textContent = `Ciclo Activo`;
            fechaExhibidaElemento = new Date(cicloActual.fechaInicio + "T00:00:00");
        }
        gCentro.appendChild(textoDiaCentro);

        // Subtexto dinámico con la fecha de hoy estilizada abajo del Día X
        const textoFechaCentro = document.createElementNS("http://www.w3.org/2000/svg", "text");
        textoFechaCentro.setAttribute("x", center);
        textoFechaCentro.setAttribute("y", center + 10);
        textoFechaCentro.setAttribute("style", "font-family:var(--font-handwritten); font-size:10px; text-anchor:middle; fill:var(--ink-color); opacity:0.5;");
        textoFechaCentro.textContent = `${fechaExhibidaElemento.getDate()} ${NOMBRES_MESES[fechaExhibidaElemento.getMonth()].substring(0,3)}`;
        gCentro.appendChild(textoFechaCentro);

        svg.appendChild(gCentro);
        wrapper.appendChild(svg);
    }

    // --- NUEVA MODAL TARJETA FLOTANTE PARA LEER REGISTROS ---
    function abrirModalVisorCiclo(fechaISO, numeroDelDia) {
        const modal = document.getElementById('cycle-view-modal');
        const titulo = document.getElementById('cycle-view-title');
        const cuerpo = document.getElementById('cycle-view-body');
        const ciclo = JournalState.ciclosHistorial[JournalState.indiceCicloVisible];
        const datos = ciclo.registros[fechaISO];

        const f = new Date(fechaISO + "T00:00:00");
        titulo.innerText = `Día ${numeroDelDia} (${f.getDate()} de ${NOMBRES_MESES[f.getMonth()]})`;

        if (!datos) {
            cuerpo.innerHTML = `<p style="text-align:center; opacity:0.5; margin-top:20px;">No hay ningún registro guardado para este día del ciclo.</p>`;
        } else {
            let htmlContent = `<div style="display:flex; flex-direction:column; gap:8px; padding-left:10px;">`;
            
            const mapaSangrado = { none: 'Ninguno', light: 'Leve 🩸', medium: 'Moderado 🩸🩸', heavy: 'Fuerte 🩸🩸🩸' };
            htmlContent += `<div><strong>Sangrado:</strong> ${mapaSangrado[datos.bleed || 'none']}</div>`;
            htmlContent += `<div><strong>Sueño:</strong> ${datos.sleep ? datos.sleep + ' horas' : 'Sin registrar'}</div>`;
            htmlContent += `<div><strong>Energía:</strong> ${datos.energy || 'Normal'}</div>`;
            htmlContent += `<div><strong>Ánimo:</strong> ${datos.mood || 'Sin registrar'}</div>`;
            htmlContent += `<div style="border-top:0.5px dashed rgba(0,0,0,0.1); margin-top:5px; padding-top:5px;"><strong>Observaciones:</strong><br><span style="font-style:italic; opacity:0.85;">${datos.notes || 'Ninguna'}</span></div>`;
            
            htmlContent += `</div>`;
            cuerpo.innerHTML = htmlContent;
        }
        modal.classList.remove('hidden');
    }

    function cerrarModalVisorCiclo() {
        document.getElementById('cycle-view-modal').classList.add('hidden');
    }

    // --- FORMULARIO EDICIÓN ---
    function abrirModalCicloHoy() {
        JournalState.modoEdicionCiclo = true;
        document.getElementById('btn-cycle-toggle-edit').classList.add('active-edit');
        abrirModalCicloEspecifico(formatearFechaISO(new Date()));
    }

    function abrirModalCicloEspecifico(fechaISO) {
        cerrarModalVisorCiclo(); // Asegurar que no se solapen
        document.getElementById('form-cycle-date').value = fechaISO;
        
        const ciclo = JournalState.ciclosHistorial[JournalState.indiceCicloVisible];
        const datosExistentes = ciclo.registros[fechaISO] || {};

        document.getElementById('form-cycle-bleed').value = datosExistentes.bleed || 'none';
        document.getElementById('form-cycle-sleep').value = datosExistentes.sleep || '';
        document.getElementById('form-cycle-energy').value = datosExistentes.energy || 'Normal';
        document.getElementById('form-cycle-mood').value = datosExistentes.mood || '';
        document.getElementById('form-cycle-notes').value = datosExistentes.notes || '';

        document.getElementById('cycle-log-modal').classList.remove('hidden');
    }

    function cerrarModalCiclo() {
        document.getElementById('cycle-log-modal').classList.add('hidden');
    }

    function desactivarModoEdicionCiclo() {
        JournalState.modoEdicionCiclo = false;
        document.getElementById('btn-cycle-toggle-edit').classList.remove('active-edit');
        cerrarModalCiclo();
    }

    function guardarModalCiclo() {
        const fechaISO = document.getElementById('form-cycle-date').value;
        const sangrado = document.getElementById('form-cycle-bleed').value;
        const sueno = parseFloat(document.getElementById('form-cycle-sleep').value) || 0;
        const energia = document.getElementById('form-cycle-energy').value;
        const animo = document.getElementById('form-cycle-mood').value.trim();
        const obs = document.getElementById('form-cycle-notes').value.trim();

        if (sangrado !== 'none') {
            const cicloActual = JournalState.ciclosHistorial[0]; 
            const diferenciaDias = calcularDiferenciaDias(cicloActual.fechaInicio, fechaISO);
            
            if (diferenciaDias >= 21) {
                JournalState.ciclosHistorial.unshift({
                    fechaInicio: fechaISO,
                    registros: {}
                });
                JournalState.indiceCicloVisible = 0;
            }
        }

        const cicloAEditar = JournalState.ciclosHistorial[JournalState.indiceCicloVisible];
        cicloAEditar.registros[fechaISO] = {
            bleed: sangrado,
            sleep: sueno,
            energy: energia,
            mood: animo,
            notes: obs
        };

        localStorage.setItem('journal_ciclos_v1', JSON.stringify(JournalState.ciclosHistorial));
        
        cerrarModalCiclo();
        desactivarModoEdicionCiclo();
        construirSelectorHistorialCiclos();
        renderizarCicloCompleto();
    }

    // ==========================================================================
    // --- NUEVO MÓDULO: CONFIGURACIÓN, CAMBIO DE ESTILOS, PIN Y COPIAS DE SEGURIDAD ---
    // ==========================================================================

    function aplicarAjustesEstiloVisual() {
        // Sincronizar elementos UI de configuración
        document.getElementById('cfg-theme').value = JournalState.config.theme;
        document.getElementById('cfg-accent').value = JournalState.config.accent;
        document.getElementById('cfg-pin-toggle').value = JournalState.config.pinEnabled.toString();

        // Control del modo oscuro en el body
        if (JournalState.config.theme === 'dark') {
            document.body.classList.add('dark-journal-mode');
        } else {
            document.body.classList.remove('dark-journal-mode');
        }

        // Inyección dinámica de la variable de acento en el CSS
        document.documentElement.style.setProperty('--accent-color', JournalState.config.accent);
        
        // Cambiar dinámicamente los trazos de los separadores SVG de todo el diario
        document.querySelectorAll('.line-separator line, .line-separator polygon').forEach(elemento => {
            if (elemento.tagName === 'line') elemento.setAttribute('stroke', JournalState.config.accent);
            if (elemento.tagName === 'polygon') elemento.setAttribute('fill', JournalState.config.accent);
        });

        // Visibilidad del botón para cambiar PIN
        const filaCambio = document.getElementById('row-change-pin');
        if (JournalState.config.pinEnabled) {
            filaCambio.classList.remove('hidden');
        } else {
            filaCambio.classList.add('hidden');
        }
    }

    function guardarPreferenciaAjuste(clave, valor) {
        JournalState.config[clave] = valor;
        localStorage.setItem('journal_config_db', JSON.stringify(JournalState.config));
        aplicarAjustesEstiloVisual();
    }

    // --- SUB-MOTOR DE SEGURIDAD (PIN) ---
    function evaluarBloqueoPinSeguridad() {
        if (JournalState.config.pinEnabled) {
            const capaBloqueo = document.getElementById('pin-lock-screen');
            capaBloqueo.classList.remove('hidden');
            document.getElementById('input-screen-pin').value = '';
            document.getElementById('pin-screen-msg').innerText = "Introduce tu código de acceso";
            
            document.getElementById('btn-screen-pin-submit').onclick = () => {
                const pinIngresado = document.getElementById('input-screen-pin').value;
                if (pinIngresado === JournalState.config.pinCode) {
                    capaBloqueo.classList.add('hidden');
                } else {
                    document.getElementById('pin-screen-msg').innerText = "❌ PIN Incorrecto. Reintenta.";
                    document.getElementById('input-screen-pin').value = '';
                }
            };
        }
    }

    function procesarCambioEstadoPin(activar) {
        if (activar && !JournalState.config.pinEnabled) {
            const nuevoPin = prompt("Define tu nuevo PIN numérico de seguridad (Mínimo 4 dígitos):");
            if (nuevoPin && nuevoPin.trim().length >= 4) {
                JournalState.config.pinCode = nuevoPin.trim();
                JournalState.config.pinEnabled = true;
                alert("🔒 PIN establecido y activado con éxito.");
            } else {
                alert("Operación cancelada o código demasiado corto.");
                document.getElementById('cfg-pin-toggle').value = "false";
                return;
            }
        } else if (!activar) {
            const confirmacion = prompt("Introduce tu PIN actual para desactivar el bloqueo:");
            if (confirmacion === JournalState.config.pinCode) {
                JournalState.config.pinEnabled = false;
                alert("🔓 El bloqueo por PIN ha sido removido.");
            } else {
                alert("PIN incorrecto. La seguridad sigue activa.");
                document.getElementById('cfg-pin-toggle').value = "true";
                return;
            }
        }
        localStorage.setItem('journal_config_db', JSON.stringify(JournalState.config));
        aplicarAjustesEstiloVisual();
    }

    function invocarCambioCodigoPin() {
        const actual = prompt("Introduce tu PIN actual:");
        if (actual !== JournalState.config.pinCode) {
            alert("El código introducido no es correcto.");
            return;
        }
        const nuevo = prompt("Introduce tu NUEVO código PIN (Mínimo 4 dígitos):");
        if (nuevo && nuevo.trim().length >= 4) {
            JournalState.config.pinCode = nuevo.trim();
            localStorage.setItem('journal_config_db', JSON.stringify(JournalState.config));
            alert("✨ PIN modificado correctamente.");
        } else {
            alert("Código inválido.");
        }
    }

    // --- SUB-MOTOR DE COPIAS DE SEGURIDAD (BACKUP COMPLETO) ---
    function procesarExportacionBackup() {
        // Recolectamos absolutamente todas las bases de datos actuales del LocalStorage
        const backupData = {
            metas: localStorage.getItem('journal_metas_db'),
            habitos: localStorage.getItem('journal_habitos_db'),
            todo: localStorage.getItem('journal_todo_db'),
            agenda: localStorage.getItem('journal_agenda_db'),
            ciclos: localStorage.getItem('journal_ciclos_v1'),
            config: localStorage.getItem('journal_config_db'),
            timestamp: new Date().toISOString()
        };

        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        // Simulación de descarga de archivo compatible con navegadores de escritorio y teléfonos móviles
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup_journal_${formatearFechaISO(new Date())}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function procesarImportacionBackup(evento) {
        const archivo = evento.target.files[0];
        if (!archivo) return;

        const lector = new FileReader();
        lector.onload = function(e) {
            try {
                const datosInyectados = JSON.parse(e.target.result);
                
                // Validación estricta para asegurar que sea un archivo legítimo del diario
                if (!datosInyectados.metas && !datosInyectados.habitos && !datosInyectados.todo && !datosInyectados.agenda) {
                    throw new Error("El archivo JSON no contiene un formato de respaldo válido para este diario.");
                }

                if (confirm("⚠️ ¿Estás seguro? Cargar esta copia de seguridad sobrescribirá por completo todos los datos actuales guardados en este teléfono.")) {
                    if (datosInyectados.metas) localStorage.setItem('journal_metas_db', datosInyectados.metas);
                    if (datosInyectados.habitos) localStorage.setItem('journal_habitos_db', datosInyectados.habitos);
                    if (datosInyectados.todo) localStorage.setItem('journal_todo_db', datosInyectados.todo);
                    if (datosInyectados.agenda) localStorage.setItem('journal_agenda_db', datosInyectados.agenda);
                    if (datosInyectados.ciclos) localStorage.setItem('journal_ciclos_v1', datosInyectados.ciclos);
                    if (datosInyectados.config) localStorage.setItem('journal_config_db', datosInyectados.config);

                    alert("🎉 Datos restaurados con éxito. La aplicación se reiniciará para aplicar los cambios.");
                    window.location.reload();
                }
            } catch (err) {
                alert("Error al procesar el archivo de copia: " + err.message);
            }
        };
        lector.readAsText(archivo);
    }

    inicializarNavegacion();
});