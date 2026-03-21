// ===================== VARIABLES GLOBALES =====================
let currentPage = 1;
const documentsPerPage = 12;
let allDocuments = [];

// ===================== INICIALIZACIÓN =====================
document.addEventListener('DOMContentLoaded', function () {
    console.log('Sistema de documentos con menú iniciado');

    // Inicializar componentes de documentos
    initFileInput();
    initUploadForm();
    initModal();

    // Cargar documentos iniciales
    loadDocuments();

});

// ===================== INPUT DE ARCHIVO =====================
function initFileInput() {
    const fileInput = document.getElementById('fileInput');
    const fileName = document.getElementById('fileName');
    const fileLabel = document.querySelector('.file-input-label');

    fileInput.addEventListener('change', function () {
        if (this.files && this.files[0]) {
            const file = this.files[0];

            // Mostrar nombre del archivo
            fileName.textContent = `Archivo seleccionado: ${file.name}`;
            fileName.classList.add('show');

            // Cambiar estilo del label
            fileLabel.style.borderColor = '#10b981';
            fileLabel.style.backgroundColor = 'rgba(16, 185, 129, 0.05)';
            fileLabel.style.color = '#10b981';

            // Actualizar texto del label
            const fileText = fileLabel.querySelector('.file-text');
            fileText.textContent = 'Archivo seleccionado ✓';

            console.log('Archivo seleccionado:', file.name);
        } else {
            // Reset si no hay archivo
            fileName.classList.remove('show');
            fileLabel.style.borderColor = '#e2e8f0';
            fileLabel.style.backgroundColor = 'white';
            fileLabel.style.color = '#64748b';

            const fileText = fileLabel.querySelector('.file-text');
            fileText.textContent = 'Seleccionar archivo';
        }
    });

    console.log('Input de archivo inicializado');
}

// ===================== FORMULARIO DE SUBIDA =====================
function initUploadForm() {
    const uploadForm = document.getElementById('uploadForm');
    const btnUpload = document.getElementById('btnUpload');

    uploadForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];

        if (!file) {
            showMessage('Por favor selecciona un archivo.', 'error');
            return;
        }

        // Validar tipo de archivo
        if (!isValidFileType(file)) {
            showMessage('Tipo de archivo no permitido. Solo se aceptan PDF, DOCX, XLSX e imágenes.', 'error');
            return;
        }

        // Validar tamaño (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
            showMessage('El archivo es demasiado grande. Máximo 10MB.', 'error');
            return;
        }

        uploadDocument(file);
    });

    console.log('Formulario de subida inicializado');
}

// ===================== VALIDACIÓN DE ARCHIVOS =====================
function isValidFileType(file) {
    const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/jpg',
        'image/png'
    ];

    const allowedExtensions = ['.pdf', '.docx', '.xlsx', '.jpg', '.jpeg', '.png'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    return allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension);
}

function getFileIcon(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();

    switch (extension) {
        case 'pdf':
            return { class: 'pdf', icon: '📄' };
        case 'docx':
        case 'doc':
            return { class: 'docx', icon: '📃' };
        case 'xlsx':
        case 'xls':
            return { class: 'xlsx', icon: '📊' };
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
            return { class: 'image', icon: '🖼️' };
        default:
            return { class: 'default', icon: '📎' };
    }
}

// ===================== SUBIDA DE DOCUMENTO =====================
function uploadDocument(file) {
    const formData = new FormData();
    formData.append('archivo', file);

    // Mostrar spinner de carga
    showLoadingSpinner(true);

    // Deshabilitar botón
    const btnUpload = document.getElementById('btnUpload');
    btnUpload.disabled = true;
    btnUpload.innerHTML = '<span class="upload-icon">⏳</span>Subiendo...';

    fetch('php/Documentos.php', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            console.log('Respuesta del servidor:', data);

            if (data.success) {
                showMessage('Documento subido correctamente.', 'success');
                resetForm();
                loadDocuments(); // Recargar lista de documentos
            } else {
                showMessage(data.message || 'Error al subir el documento.', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('Error de conexión. Inténtalo de nuevo.', 'error');
        })
        .finally(() => {
            showLoadingSpinner(false);

            // Restaurar botón
            btnUpload.disabled = false;
            btnUpload.innerHTML = '<span class="upload-icon">⬆️</span>Subir Documento';
        });
}


// ===================== CARGA DE DOCUMENTOS =====================
function loadDocuments() {
    fetch('php/Documentos.php')
        .then(response => response.text())
        .then(html => {
            const documentsGrid = document.getElementById('documentsGrid');

            if (html.trim()) {
                documentsGrid.innerHTML = html;

                // Contar documentos
                const documentCards = documentsGrid.querySelectorAll('.document-card');
                updateDocumentsCount(documentCards.length);

                // Inicializar eventos de los botones
                initDocumentButtons();
            } else {
                showNoDocuments();
            }
        })
        .catch(error => {
            console.error('Error cargando documentos:', error);
            showMessage('Error al cargar los documentos.', 'error');
        });
}

function showNoDocuments() {
    const documentsGrid = document.getElementById('documentsGrid');
    documentsGrid.innerHTML = `
        <div class="no-documents">
            <h3>No hay documentos disponibles</h3>
            <p>Sube tu primer documento usando el formulario de arriba.</p>
        </div>
    `;
    updateDocumentsCount(0);
}

function updateDocumentsCount(count) {
    const countNumber = document.querySelector('.count-number');
    const countText = document.querySelector('.count-text');

    if (countNumber && countText) {
        countNumber.textContent = count;
        countText.textContent = count === 1 ? 'documento' : 'documentos';
    }
}

// ===================== EVENTOS DE BOTONES DE DOCUMENTO =====================
function initDocumentButtons() {
    // Botones "Ver en el sitio"
    const viewButtons = document.querySelectorAll('.btn-view');
    viewButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            const url = this.dataset.url;
            const name = this.dataset.name;
            openDocumentModal(url, name);
        });
    });

    // Botones "Abrir archivo"
    const openButtons = document.querySelectorAll('.btn-open');
    openButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            const url = this.dataset.url;
            window.open(url, '_blank');
        });
    });

    console.log('Eventos de botones inicializados');
}

// ===================== MODAL DE DOCUMENTOS =====================
function initModal() {
    const modal = document.getElementById('documentModal');
    const closeBtn = document.getElementById('closeModal');

    // Cerrar modal con X
    closeBtn.addEventListener('click', closeDocumentModal);

    // Cerrar modal con clic fuera
    modal.addEventListener('click', function (e) {
        if (e.target === this) {
            closeDocumentModal();
        }
    });

    // Cerrar modal con ESC
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeDocumentModal();
        }
    });

    console.log('Modal inicializado');
}

function openDocumentModal(url, name) {
    const modal = document.getElementById('documentModal');
    const modalTitle = document.getElementById('modalTitle');
    const documentViewer = document.getElementById('documentViewer');

    modalTitle.textContent = name || 'Documento';

    // Detectar extensión
    const ext = url.split('.').pop().toLowerCase();

    // Limpiar el iframe
    documentViewer.style.display = 'none';
    documentViewer.src = '';

    // Eliminar previsualización previa si existe
    let preview = document.getElementById('docPreview');
    if (preview) preview.remove();

    // Crear previsualización según tipo
    if (['png', 'jpg', 'jpeg'].includes(ext)) {
        preview = document.createElement('img');
        preview.id = 'docPreview';
        preview.src = url;
        preview.alt = name;
        preview.style.maxWidth = '100%';
        preview.style.maxHeight = '80vh';
        preview.style.display = 'block';
        preview.style.margin = '0 auto';
        documentViewer.parentNode.insertBefore(preview, documentViewer);
    } else if (ext === 'pdf') {
        documentViewer.src = url;
        documentViewer.style.display = 'block';
    } else {
        // No preview, solo mensaje
        preview = document.createElement('div');
        preview.id = 'docPreview';
        preview.innerHTML = `<p style="text-align:center;margin:2em 0;">No se puede previsualizar este tipo de archivo.<br>Puedes descargarlo abajo.</p>`;
        documentViewer.parentNode.insertBefore(preview, documentViewer);
    }

    // Botón de descarga
    let downloadBtn = document.getElementById('downloadDocBtn');
    if (!downloadBtn) {
        downloadBtn = document.createElement('a');
        downloadBtn.id = 'downloadDocBtn';
        downloadBtn.className = 'btn-upload';
        downloadBtn.style.margin = '20px auto 0 auto';
        downloadBtn.style.display = 'block';
        downloadBtn.innerHTML = '⬇️ Descargar';
        documentViewer.parentNode.appendChild(downloadBtn);
    }
    downloadBtn.href = url;
    downloadBtn.download = name || 'documento';

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    console.log('Modal abierto para:', name);
}

function closeDocumentModal() {
    const modal = document.getElementById('documentModal');
    const documentViewer = document.getElementById('documentViewer');
    let preview = document.getElementById('docPreview');
    let downloadBtn = document.getElementById('downloadDocBtn');

    modal.style.display = 'none';
    documentViewer.src = '';
    documentViewer.style.display = 'none';
    if (preview) preview.remove();
    if (downloadBtn) downloadBtn.remove();
    document.body.style.overflow = 'auto';

    console.log('Modal cerrado');
}

// ===================== UTILIDADES =====================
function resetForm() {
    const uploadForm = document.getElementById('uploadForm');
    const fileName = document.getElementById('fileName');
    const fileLabel = document.querySelector('.file-input-label');
    const fileText = fileLabel.querySelector('.file-text');

    uploadForm.reset();
    fileName.classList.remove('show');

    // Reset estilo del label
    fileLabel.style.borderColor = '#e2e8f0';
    fileLabel.style.backgroundColor = 'white';
    fileLabel.style.color = '#64748b';
    fileText.textContent = 'Seleccionar archivo';
}

function showMessage(message, type = 'info') {
    // Remover mensajes existentes
    const existingMessages = document.querySelectorAll('.error-message, .success-message');
    existingMessages.forEach(msg => msg.remove());

    // Crear nuevo mensaje
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'error' ? 'error-message' : 'success-message';
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';

    // Insertar después del header
    const uploadContainer = document.querySelector('.upload-container');
    uploadContainer.parentNode.insertBefore(messageDiv, uploadContainer);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);

    console.log(`Mensaje ${type}:`, message);
}

function showLoadingSpinner(show) {
    const spinner = document.getElementById('loadingSpinner');
    spinner.style.display = show ? 'block' : 'none';
}

// ===================== FUNCIONES GLOBALES =====================
function cerrarSesion() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        // Limpiar localStorage si es necesario
        localStorage.removeItem('user_session');
        localStorage.removeItem('rol');

        // Redireccionar al login
        window.location.href = 'login.html';
    }
}


// ===================== UTILIDADES ADICIONALES =====================
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ===================== MANEJO DE ERRORES GLOBALES =====================
window.addEventListener('error', function (e) {
    console.error('Error global:', e.error);
    showMessage('Ha ocurrido un error inesperado.', 'error');
});

window.addEventListener('unhandledrejection', function (e) {
    console.error('Promesa rechazada:', e.reason);
    showMessage('Error de conexión. Verifica tu conexión a internet.', 'error');
});


console.log('Sistema de documentos con menú extraíble inicializado correctamente');