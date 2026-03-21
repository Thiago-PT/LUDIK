// Gestion_cuentas.js - Administración de cuentas de usuarios del sistema LUDIK

console.log("Gestión de Cuentas script cargado");

// ===== VARIABLES GLOBALES =====
let tabActual = 'docentes';
let datosCargados = {
    docentes: [],
    docentes_apoyo: [],
    directivos: [],
    admins: []
};
let idEliminarActual = null;
let tipoEliminarActual = null;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function () {
    inicializarEventos();
    cargarTodosLosDatos();
});

function inicializarEventos() {
    // Modal editar
    document.getElementById('btnCerrarModalEditar')?.addEventListener('click', cerrarModalEditar);
    document.getElementById('btnCancelarEditar')?.addEventListener('click', cerrarModalEditar);
    document.getElementById('btnConfirmarEditar')?.addEventListener('click', guardarEdicion);

    // Modal eliminar
    document.getElementById('btnCerrarModalEliminar')?.addEventListener('click', cerrarModalEliminar);
    document.getElementById('btnCancelarEliminar')?.addEventListener('click', cerrarModalEliminar);
    document.getElementById('btnConfirmarEliminar')?.addEventListener('click', confirmarEliminar);

    // Cerrar modales al hacer clic fuera
    document.getElementById('modalEditar')?.addEventListener('click', function (e) {
        if (e.target === this) cerrarModalEditar();
    });
    document.getElementById('modalEliminar')?.addEventListener('click', function (e) {
        if (e.target === this) cerrarModalEliminar();
    });
}

// ===== CARGAR DATOS =====
async function cargarTodosLosDatos() {
    mostrarCargando(true);
    try {
        const response = await fetch('php/Gestion_cuentas.php?accion=listar_todos');
        const data = await response.json();

        if (data.success) {
            datosCargados = data.cuentas;
            actualizarEstadisticas();
            renderizarTablaActual();
        } else {
            mostrarMensaje(data.message || 'Error al cargar las cuentas', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error de conexión al cargar las cuentas', 'error');
    } finally {
        mostrarCargando(false);
    }
}

function actualizarEstadisticas() {
    document.getElementById('totalDocentes').textContent = datosCargados.docentes?.length || 0;
    document.getElementById('totalDocentesApoyo').textContent = datosCargados.docentes_apoyo?.length || 0;
    document.getElementById('totalDirectivos').textContent = datosCargados.directivos?.length || 0;
    document.getElementById('totalAdmins').textContent = datosCargados.admins?.length || 0;
}

// ===== CAMBIAR TAB =====
function cambiarTab(tab) {
    tabActual = tab;

    // Actualizar botones
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

    // Limpiar búsqueda
    document.getElementById('busqueda').value = '';

    renderizarTablaActual();
}

function renderizarTablaActual() {
    const datos = datosCargados[tabActual] || [];
    renderizarTabla(datos, tabActual);
}

// ===== RENDERIZAR TABLA =====
function renderizarTabla(datos, tipo) {
    const head = document.getElementById('tablaCuentasHead');
    const tbody = document.getElementById('tablaCuentasBody');
    const noData = document.getElementById('noDataTable');
    const tabla = document.getElementById('tablaCuentas');

    // Encabezados según tipo
    const encabezados = obtenerEncabezados(tipo);
    head.innerHTML = `<tr>${encabezados.map(e => `<th>${e}</th>`).join('')}</tr>`;

    if (!datos || datos.length === 0) {
        tabla.style.display = 'none';
        noData.style.display = 'flex';
        return;
    }

    tabla.style.display = 'table';
    noData.style.display = 'none';

    tbody.innerHTML = datos.map(cuenta => generarFila(cuenta, tipo)).join('');
}

function obtenerEncabezados(tipo) {
    const base = ['Usuario', 'Email', 'Teléfono'];
    switch (tipo) {
        case 'docentes':
            return [...base, 'Director', 'Acciones'];
        case 'docentes_apoyo':
            return [...base, 'Profesión', 'Acciones'];
        case 'directivos':
            return [...base, 'Cargo', 'Acciones'];
        case 'admins':
            return [...base, 'Acciones'];
        default:
            return [...base, 'Acciones'];
    }
}

function generarFila(cuenta, tipo) {
    const iniciales = getInitials(cuenta.nombre_completo || cuenta.nombre || '');
    const nombre = cuenta.nombre_completo || cuenta.nombre || 'Sin nombre';
    const email = cuenta.email || '-';
    const telefono = cuenta.telefono || '-';

    let extraCol = '';
    switch (tipo) {
        case 'docentes':
            extraCol = cuenta.es_director
                ? `<td><span class="badge-director"><i class="fas fa-star"></i> Sí</span></td>`
                : `<td><span class="badge-no">No</span></td>`;
            break;
        case 'docentes_apoyo':
            extraCol = `<td>${cuenta.profesion || '-'}</td>`;
            break;
        case 'directivos':
            extraCol = `<td>${cuenta.cargo || '-'}</td>`;
            break;
    }

    const idCampo = obtenerIdCampo(tipo);
    const idValor = cuenta[idCampo];

    return `
        <tr>
            <td>
                <div class="user-info">
                    <div class="user-avatar">${iniciales}</div>
                    <div>
                        <div class="user-name">${nombre}</div>
                        <div class="user-email">${email}</div>
                    </div>
                </div>
            </td>
            <td>${email}</td>
            <td>${telefono}</td>
            ${extraCol}
            <td>
                <div class="actions-cell">
                    <button onclick="abrirModalEditar(${idValor}, '${tipo}')" class="btn-action btn-edit" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="abrirModalEliminar(${idValor}, '${tipo}', '${escapeHtml(nombre)}', '${escapeHtml(email)}')" class="btn-action btn-delete" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

function obtenerIdCampo(tipo) {
    switch (tipo) {
        case 'docentes': return 'id_docente';
        case 'docentes_apoyo': return 'id_docente_apoyo';
        case 'directivos': return 'id_directivo';
        case 'admins': return 'id_admin';
        default: return 'id';
    }
}

// ===== FILTRAR TABLA =====
function filtrarTabla() {
    const busqueda = document.getElementById('busqueda').value.toLowerCase().trim();
    const datos = datosCargados[tabActual] || [];

    if (!busqueda) {
        renderizarTabla(datos, tabActual);
        return;
    }

    const filtrados = datos.filter(cuenta => {
        const nombre = (cuenta.nombre_completo || cuenta.nombre || '').toLowerCase();
        const email = (cuenta.email || '').toLowerCase();
        const telefono = (cuenta.telefono || '').toLowerCase();
        return nombre.includes(busqueda) || email.includes(busqueda) || telefono.includes(busqueda);
    });

    renderizarTabla(filtrados, tabActual);
}

// ===== MODAL EDITAR =====
function abrirModalEditar(id, tipo) {
    const datos = datosCargados[tipo] || [];
    const idCampo = obtenerIdCampo(tipo);
    const cuenta = datos.find(c => c[idCampo] == id);

    if (!cuenta) {
        mostrarMensaje('No se encontró la cuenta', 'error');
        return;
    }

    // Título del modal
    const titulos = {
        docentes: 'Editar Docente',
        docentes_apoyo: 'Editar Docente de Apoyo',
        directivos: 'Editar Directivo',
        admins: 'Editar Administrador'
    };
    document.getElementById('tituloModalEditar').textContent = titulos[tipo] || 'Editar Cuenta';

    // Llenar campos
    document.getElementById('editId').value = id;
    document.getElementById('editTipo').value = tipo;
    document.getElementById('editNombre').value = cuenta.nombre_completo || cuenta.nombre || '';
    document.getElementById('editEmail').value = cuenta.email || '';
    document.getElementById('editTelefono').value = cuenta.telefono || '';
    document.getElementById('editContrasena').value = '';
    document.getElementById('editConfirmarContrasena').value = '';

    // Mostrar/ocultar campos extra
    document.getElementById('grupoProfesion').style.display = tipo === 'docentes_apoyo' ? 'flex' : 'none';
    document.getElementById('grupoCargo').style.display = tipo === 'directivos' ? 'flex' : 'none';
    document.getElementById('grupoDirector').style.display = tipo === 'docentes' ? 'block' : 'none';

    if (tipo === 'docentes_apoyo') {
        document.getElementById('editProfesion').value = cuenta.profesion || '';
    }
    if (tipo === 'directivos') {
        document.getElementById('editCargo').value = cuenta.cargo || '';
    }
    if (tipo === 'docentes') {
        document.getElementById('editEsDirector').checked = cuenta.es_director == 1;
    }

    document.getElementById('modalEditar').style.display = 'flex';
}

function cerrarModalEditar() {
    document.getElementById('modalEditar').style.display = 'none';
}

async function guardarEdicion() {
    const id = document.getElementById('editId').value;
    const tipo = document.getElementById('editTipo').value;
    const nombre = document.getElementById('editNombre').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const telefono = document.getElementById('editTelefono').value.trim();
    const contrasena = document.getElementById('editContrasena').value;
    const confirmar = document.getElementById('editConfirmarContrasena').value;

    // Validaciones
    if (!nombre || !email) {
        mostrarMensaje('El nombre y el email son obligatorios', 'error');
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        mostrarMensaje('El email no tiene un formato válido', 'error');
        return;
    }

    if (contrasena && contrasena !== confirmar) {
        mostrarMensaje('Las contraseñas no coinciden', 'error');
        return;
    }

    if (contrasena && contrasena.length < 6) {
        mostrarMensaje('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('accion', 'editar_cuenta');
    formData.append('id', id);
    formData.append('tipo', tipo);
    formData.append('nombre_completo', nombre);
    formData.append('email', email);
    formData.append('telefono', telefono);

    if (contrasena) formData.append('contrasena', contrasena);

    if (tipo === 'docentes_apoyo') {
        formData.append('profesion', document.getElementById('editProfesion').value.trim());
    }
    if (tipo === 'directivos') {
        formData.append('cargo', document.getElementById('editCargo').value.trim());
    }
    if (tipo === 'docentes') {
        formData.append('es_director', document.getElementById('editEsDirector').checked ? '1' : '0');
    }

    const btn = document.getElementById('btnConfirmarEditar');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    try {
        const response = await fetch('php/Gestion_cuentas.php', { method: 'POST', body: formData });
        const data = await response.json();

        if (data.success) {
            mostrarMensaje('Cuenta actualizada exitosamente', 'exito');
            cerrarModalEditar();
            await cargarTodosLosDatos();
        } else {
            mostrarMensaje(data.message || 'Error al actualizar la cuenta', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error de conexión', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
    }
}

// ===== MODAL ELIMINAR =====
function abrirModalEliminar(id, tipo, nombre, email) {
    idEliminarActual = id;
    tipoEliminarActual = tipo;

    const labels = {
        docentes: 'Docente',
        docentes_apoyo: 'Docente de Apoyo',
        directivos: 'Directivo',
        admins: 'Administrador'
    };

    document.getElementById('infoCuentaEliminar').innerHTML = `
        <p><strong>Tipo:</strong> ${labels[tipo] || tipo}</p>
        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Email:</strong> ${email}</p>
    `;

    document.getElementById('modalEliminar').style.display = 'flex';
}

function cerrarModalEliminar() {
    document.getElementById('modalEliminar').style.display = 'none';
    idEliminarActual = null;
    tipoEliminarActual = null;
}

async function confirmarEliminar() {
    if (!idEliminarActual || !tipoEliminarActual) return;

    const formData = new FormData();
    formData.append('accion', 'eliminar_cuenta');
    formData.append('id', idEliminarActual);
    formData.append('tipo', tipoEliminarActual);

    const btn = document.getElementById('btnConfirmarEliminar');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';

    try {
        const response = await fetch('php/Gestion_cuentas.php', { method: 'POST', body: formData });
        const data = await response.json();

        if (data.success) {
            mostrarMensaje('Cuenta eliminada exitosamente', 'exito');
            cerrarModalEliminar();
            await cargarTodosLosDatos();
        } else {
            mostrarMensaje(data.message || 'Error al eliminar la cuenta', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error de conexión', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-trash"></i> Eliminar';
    }
}

// ===== UTILIDADES =====
function mostrarMensaje(mensaje, tipo) {
    const container = document.getElementById('mensaje-container');
    container.innerHTML = '';

    const div = document.createElement('div');
    div.className = `mensaje ${tipo}`;
    div.textContent = mensaje;
    container.appendChild(div);

    if (tipo !== 'error') {
        setTimeout(() => div.remove(), 5000);
    }

    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function mostrarCargando(mostrar) {
    const loading = document.getElementById('loadingTable');
    const tabla = document.getElementById('tablaCuentas');
    const noData = document.getElementById('noDataTable');

    if (mostrar) {
        loading.style.display = 'flex';
        tabla.style.display = 'none';
        noData.style.display = 'none';
    } else {
        loading.style.display = 'none';
    }
}

function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

function getInitials(fullName) {
    if (!fullName) return '??';
    const names = fullName.trim().split(' ').filter(n => n.length > 0);
    if (names.length === 0) return '??';
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
}

function escapeHtml(str) {
    return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', function () {
    const btnIA = document.getElementById('btnIA');
    if (btnIA) {
        btnIA.addEventListener('click', function () {
            window.open('https://ia-ludik-1.onrender.com/', '_blank');
        });
    }
});
