console.log("Header y Menú script cargado (fusionado en Registrar_estudiante.js)");

// ------------------------------------------------------------
// A PARTIR DE AQUÍ: FUNCIONALIDAD ORIGINAL DE REGISTRAR ESTUDIANTE
// (Se mantiene la mayor parte del código original, adaptado
//  para coexistir con la sección del menú)
// ------------------------------------------------------------

console.log("Script de Registrar Estudiante cargado con funcionalidad de menú integrada");

// Variables globales del formulario / flujo
let currentStep = 1;
const totalSteps = 12;
let estudianteRegistradoId = null;
let estudianteRegistradoNombre = '';
let isPhase1Complete = false;
let madreSkipped = false;
let padreSkipped = false;

// Inicialización cuando se carga la página (parte del flujo de registrar)
window.onload = function () {
    cargarGrupos();
    updateButtons();
    setupEventListeners();

    // Configurar required attributes desde el inicio
    manageRequiredAttributes();
    updateProgressBar();

    // Agregar novalidate al formulario para evitar validación automática del navegador
    const formulario = document.getElementById('formulario-completo');
    if (formulario) {
        formulario.setAttribute('novalidate', '');
    }
};

// ==================== FUNCIONES PARA MANEJO DE SKIP ====================

function showSkipOptions(type) {
    const options = document.getElementById(type + '-skip-options');
    if (options) options.classList.add('active');
}

function cancelSkip(type) {
    const options = document.getElementById(type + '-skip-options');
    if (options) options.classList.remove('active');
    // Limpiar radio buttons
    const radios = document.querySelectorAll(`input[name="${type}_skip_reason"]`);
    radios.forEach(radio => radio.checked = false);
}

function confirmSkip(type) {
    const selectedReason = document.querySelector(`input[name="${type}_skip_reason"]:checked`);

    if (!selectedReason) {
        alert('Por favor seleccione una razón para omitir el registro.');
        return;
    }

    const reason = selectedReason.value;
    const reasonText = selectedReason.nextElementSibling ? selectedReason.nextElementSibling.textContent : reason;

    // Validación mejorada: permitir que ambos padres no estén presentes, pero asegurar acudiente
    if (type === 'madre' && padreSkipped) {
        const padreReason = document.getElementById('padre_skip_reason_value') ? document.getElementById('padre_skip_reason_value').value : '';
        if (reason === 'no_presente' && padreReason === 'no_presente') {
            // Ambos padres no presentes es válido, pero recordar sobre el acudiente
            showAlert('Ambos padres marcados como no presentes. Asegúrese de registrar correctamente los datos del acudiente en el paso 3.', 'warning');
        }
    }

    if (type === 'padre' && madreSkipped) {
        const madreReason = document.getElementById('madre_skip_reason_value') ? document.getElementById('madre_skip_reason_value').value : '';
        if (reason === 'no_presente' && madreReason === 'no_presente') {
            showAlert('Ambos padres marcados como no presentes. Asegúrese de registrar correctamente los datos del acudiente en el paso 3.', 'warning');
        }
    }

    // Validación para evitar contradicciones: si un padre es "es_acudiente" y el otro también
    if (type === 'madre' && padreSkipped) {
        const padreReason = document.getElementById('padre_skip_reason_value') ? document.getElementById('padre_skip_reason_value').value : '';
        if (reason === 'es_acudiente' && padreReason === 'es_acudiente') {
            alert('No puede marcar ambos padres como acudientes. Solo uno puede ser el acudiente principal.');
            return;
        }
    }

    if (type === 'padre' && madreSkipped) {
        const madreReason = document.getElementById('madre_skip_reason_value') ? document.getElementById('madre_skip_reason_value').value : '';
        if (reason === 'es_acudiente' && madreReason === 'es_acudiente') {
            alert('No puede marcar ambos padres como acudientes. Solo uno puede ser el acudiente principal.');
            return;
        }
    }

    // Marcar como omitido
    if (type === 'madre') {
        madreSkipped = true;
    } else {
        padreSkipped = true;
    }

    // Actualizar UI
    const skipOptions = document.getElementById(type + '-skip-options');
    if (skipOptions) skipOptions.classList.remove('active');

    const skippedInfo = document.getElementById(type + '-skipped-info');
    if (skippedInfo) skippedInfo.style.display = 'block';

    const skipReasonText = document.getElementById(type + '-skip-reason-text');
    if (skipReasonText) skipReasonText.textContent = reasonText;

    const formFields = document.getElementById(type + '-form-fields');
    if (formFields) formFields.classList.add('form-disabled');

    // Actualizar campos ocultos
    const skippedInput = document.getElementById(type + '_skipped');
    if (skippedInput) skippedInput.value = 'true';

    const skipReasonValue = document.getElementById(type + '_skip_reason_value');
    if (skipReasonValue) skipReasonValue.value = reason;

    // Remover required de campos del formulario
    if (formFields) {
        const requiredFields = formFields.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            field.removeAttribute('required');
            field.setAttribute('data-was-required', 'true');
        });
    }

    // Mostrar mensaje informativo según la razón
    let infoMessage = '';
    if (reason === 'no_presente') {
        infoMessage = `Se registrará un placeholder indicando que ${type} no está presente.`;
    } else if (reason === 'es_acudiente') {
        infoMessage = `Se marcará que ${type} será registrado como acudiente. Los datos se registrarán en el paso 3.`;
        // Pre-llenar algunos campos del acudiente si es posible
        prefillCuidadorFields(type);
    }

    if (infoMessage) {
        showAlert(infoMessage, 'warning');
    }
}

// Validación específica para el paso 5 (Entorno Educativo)
function validateStep5() {
    const ultimoGrado = document.getElementById('ultimo_grado_cursado').value;
    const vinculadoOtra = document.getElementById('vinculado_otra_inst').value;
    const informePedagogico = document.getElementById('informe_pedagogico').value;
    const asistenProgramas = document.getElementById('asiste_programas_complementarios').value;
    
    // Validar campos obligatorios básicos
    if (!ultimoGrado || !vinculadoOtra || !informePedagogico || !asistenProgramas) {
        showAlert('Por favor complete todos los campos obligatorios del entorno educativo.', 'error');
        return false;
    }
    
    // Validar campo condicional de institución anterior
    if (vinculadoOtra === 'Si') {
        const nombreInstitucion = document.getElementById('nombre_institucion_anterior').value;
        if (!nombreInstitucion.trim()) {
            showAlert('Por favor especifique el nombre de la institución educativa anterior.', 'error');
            document.getElementById('nombre_institucion_anterior').focus();
            return false;
        }
    }
    
    // Validar campo condicional de programas complementarios
    if (asistenProgramas === 'Si') {
        const detallesProgramas = document.getElementById('detalle_programas_complementarios').value;
        if (!detallesProgramas.trim()) {
            showAlert('Por favor especifique los programas complementarios a los que asiste.', 'error');
            document.getElementById('detalle_programas_complementarios').focus();
            return false;
        }
    }
    
    return true;
}

function prefillCuidadorFields(parentType) {
    // Esta función se ejecuta cuando un padre será el acudiente
    const parentNameEl = document.getElementById(`${parentType}_nombre`);
    const parentEducationEl = document.getElementById(`${parentType}_educacion`);
    const parentEmailEl = document.getElementById(`${parentType}_email`);
    const parentPhoneEl = document.getElementById(`${parentType}_telefono`);
    const parentPasswordEl = document.getElementById(`${parentType}_contrasena`);

    const parentName = parentNameEl ? parentNameEl.value : '';
    const parentEducation = parentEducationEl ? parentEducationEl.value : '';
    const parentEmail = parentEmailEl ? parentEmailEl.value : '';
    const parentPhone = parentPhoneEl ? parentPhoneEl.value : '';
    const parentPassword = parentPasswordEl ? parentPasswordEl.value : '';

    // Solo pre-llenar si hay datos disponibles
    if (parentName) {
        // Marcar que estos campos serán pre-llenados en el paso 3
        sessionStorage.setItem('prefill_cuidador_nombre', parentName);
        sessionStorage.setItem('prefill_cuidador_educacion', parentEducation);
        sessionStorage.setItem('prefill_cuidador_email', parentEmail);
        sessionStorage.setItem('prefill_cuidador_telefono', parentPhone);
        sessionStorage.setItem('prefill_cuidador_contrasena', parentPassword);
        sessionStorage.setItem('prefill_cuidador_parentesco', parentType === 'madre' ? 'Madre' : 'Padre');
    }
}

function applyCuidadorPrefill() {
    // Aplicar pre-llenado si está disponible
    const nombre = sessionStorage.getItem('prefill_cuidador_nombre');
    if (nombre) {
        const nombreEl = document.getElementById('cuidador_nombre');
        const educacionEl = document.getElementById('cuidador_educacion');
        const emailEl = document.getElementById('cuidador_email');
        const telefonoEl = document.getElementById('cuidador_telefono');
        const contrasenaEl = document.getElementById('cuidador_contrasena');
        const parentescoEl = document.getElementById('cuidador_parentesco');

        if (nombreEl) nombreEl.value = nombre;
        if (educacionEl) educacionEl.value = sessionStorage.getItem('prefill_cuidador_educacion') || '';
        if (emailEl) emailEl.value = sessionStorage.getItem('prefill_cuidador_email') || '';
        if (telefonoEl) telefonoEl.value = sessionStorage.getItem('prefill_cuidador_telefono') || '';
        if (contrasenaEl) contrasenaEl.value = sessionStorage.getItem('prefill_cuidador_contrasena') || '';
        if (parentescoEl) parentescoEl.value = sessionStorage.getItem('prefill_cuidador_parentesco') || '';

        // Limpiar datos de sesión
        sessionStorage.removeItem('prefill_cuidador_nombre');
        sessionStorage.removeItem('prefill_cuidador_educacion');
        sessionStorage.removeItem('prefill_cuidador_email');
        sessionStorage.removeItem('prefill_cuidador_telefono');
        sessionStorage.removeItem('prefill_cuidador_contrasena');
        sessionStorage.removeItem('prefill_cuidador_parentesco');

        showAlert('Datos pre-llenados basados en la información del padre/madre. Verifique y complete según sea necesario.', 'success');
    }
}

function undoSkip(type) {
    // Restaurar estado
    if (type === 'madre') {
        madreSkipped = false;
    } else {
        padreSkipped = false;
    }

    // Actualizar UI
    const skippedInfo = document.getElementById(type + '-skipped-info');
    if (skippedInfo) skippedInfo.style.display = 'none';

    const formFields = document.getElementById(type + '-form-fields');
    if (formFields) formFields.classList.remove('form-disabled');

    // Limpiar campos ocultos
    const skippedInput = document.getElementById(type + '_skipped');
    if (skippedInput) skippedInput.value = 'false';

    const skipReasonValue = document.getElementById(type + '_skip_reason_value');
    if (skipReasonValue) skipReasonValue.value = '';

    // Restaurar required en campos del formulario
    if (formFields) {
        const wasRequiredFields = formFields.querySelectorAll('[data-was-required]');
        wasRequiredFields.forEach(field => {
            field.setAttribute('required', '');
            field.removeAttribute('data-was-required');
        });
    }

    // Limpiar radio buttons
    const radios = document.querySelectorAll(`input[name="${type}_skip_reason"]`);
    radios.forEach(radio => radio.checked = false);

    showAlert(`Registro de ${type} restaurado. Debe completar los campos requeridos.`, 'success');
}

// ==================== CONFIGURACIÓN DE EVENT LISTENERS ====================
function setupEventListeners() {
    // Campos condicionales (si existen los elementos)
    const victimaEl = document.getElementById('victima_conflicto');
    if (victimaEl) victimaEl.addEventListener('change', handleVictimaConflicto);

    const etnicoEl = document.getElementById('grupo_etnico');
    if (etnicoEl) etnicoEl.addEventListener('change', handleGrupoEtnico);

    // Prevenir envío accidental con Enter
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA' && event.target.type !== 'submit') {
            event.preventDefault();
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') {
                nextStep();
            }
        }
    });

    // Auto-resize para textareas
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });

        textarea.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' && event.ctrlKey) {
                event.preventDefault();
                nextStep();
            }
        });
    });

    // Validación en tiempo real
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', function () {
            validateField(this);
        });

        input.addEventListener('input', function () {
            if (this.classList.contains('invalid')) {
                validateField(this);
            }
        });
    });

    setupEntornoEducativoEventListeners();
    // Navegación con teclado
    document.addEventListener('keydown', handleKeyNavigation);
}

// ==================== FUNCIONES DE VALIDACIÓN ====================
function validateField(field) {
    const isRequired = field.hasAttribute('required') || field.hasAttribute('data-originally-required');
    const isEmpty = !field.value.trim();

    if (isRequired && isEmpty) {
        field.classList.add('invalid');
        field.classList.remove('valid');
        field.style.borderColor = '#dc3545';
    } else {
        field.classList.remove('invalid');
        field.classList.add('valid');
        field.style.borderColor = '#28a745';
    }
}

function manageRequiredAttributes() {
    const allSteps = document.querySelectorAll('.form-step');

    allSteps.forEach((step, index) => {
        const stepNumber = index + 1;
        const fields = step.querySelectorAll('input, select, textarea');

        fields.forEach(field => {
            if (stepNumber === currentStep) {
                // Paso activo: restaurar required original
                if (field.hasAttribute('data-originally-required')) {
                    field.setAttribute('required', '');
                }
            } else {
                // Paso inactivo: guardar y remover required
                if (field.hasAttribute('required')) {
                    field.setAttribute('data-originally-required', 'true');
                    field.removeAttribute('required');
                }
            }
        });
    });
}

function validateCurrentStep() {
    const currentForm = document.getElementById('form-step-' + currentStep);
    if (!currentForm) return true; // si no existe, no bloquear

    const requiredFields = currentForm.querySelectorAll('[required]');
    let isValid = true;
    let firstInvalidField = null;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('invalid');
            field.style.borderColor = '#dc3545';
            if (!firstInvalidField) {
                firstInvalidField = field;
            }
            isValid = false;
        } else {
            field.classList.remove('invalid');
            field.classList.add('valid');
            field.style.borderColor = '#28a745';
        }
    });

    // Validar foto si estamos en el paso 4
    if (currentStep === 4) {
        const photoValidation = validatePhoto();
        if (!photoValidation.valid) {
            showAlert(photoValidation.message, 'error');
            return false;
        }
    }

    if (!isValid) {
        showAlert('Por favor complete todos los campos obligatorios del paso actual.', 'error');
        if (firstInvalidField) {
            firstInvalidField.focus();
        }
        return false;
    }

    // Validaciones específicas por paso
    if (currentStep === 4) {
        return validateStep4();
    } else if (currentStep === 5) {
        return validateStep5(); 
    }

    return true;
}

function validateStep4() {
    // Validar documento único
    const docEl = document.getElementById('no_documento');
    const documento = docEl ? docEl.value : '';
    if (documento && documento.length < 6) {
        showAlert('El número de documento debe tener al menos 6 caracteres.', 'error');
        if (docEl) docEl.focus();
        return false;
    }

    // Validar fecha de nacimiento
    const fechaEl = document.getElementById('fecha_nacimiento');
    if (fechaEl && fechaEl.value) {
        const fechaNac = new Date(fechaEl.value);
        const hoy = new Date();
        let edad = hoy.getFullYear() - fechaNac.getFullYear();
        // Ajuste por mes/día
        const m = hoy.getMonth() - fechaNac.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < fechaNac.getDate())) {
            edad--;
        }

        if (edad < 5 || edad > 25) {
            showAlert('La edad del estudiante debe estar entre 5 y 25 años.', 'error');
            fechaEl.focus();
            return false;
        }
    }

    return true;
}

function validateSteps1to5() {
    let isValid = true;
    let firstInvalidStep = null;

    for (let step = 1; step <= 5; step++) {
        const stepElement = document.getElementById('form-step-' + step);
        if (!stepElement) continue;

        // Skip validation for skipped parents
        if ((step === 1 && madreSkipped) || (step === 2 && padreSkipped)) {
            continue;
        }

        const fields = stepElement.querySelectorAll('[data-originally-required], [required]');

        for (let field of fields) {
            if (!field.value.trim()) {
                if (!firstInvalidStep) {
                    firstInvalidStep = step;
                }
                isValid = false;
                break;
            }
        }
    }

    if (!isValid && firstInvalidStep) {
        goToStep(firstInvalidStep);
        showAlert(`Por favor complete todos los campos obligatorios en el paso ${firstInvalidStep}.`, 'error');
    }

    return isValid;
}

function validateAllDescriptionSteps() {
    let isValid = true;
    let firstInvalidStep = null;

    for (let step = 5; step <= totalSteps; step++) {
        const stepElement = document.getElementById('form-step-' + step);
        if (!stepElement) continue;

        const fields = stepElement.querySelectorAll('[data-originally-required], [required]');

        for (let field of fields) {
            if (!field.value.trim()) {
                if (!firstInvalidStep) {
                    firstInvalidStep = step;
                }
                isValid = false;
                break;
            }
        }
    }

    if (!isValid && firstInvalidStep) {
        goToStep(firstInvalidStep);
        showAlert(`Por favor complete todos los campos obligatorios en el paso ${firstInvalidStep}.`, 'error');
    }

    return isValid;
}

// ==================== MANEJO DE CAMPOS CONDICIONALES ====================
function handleVictimaConflicto() {
    const container = document.getElementById('victima_tipo_container');
    const campo = document.getElementById('victima_tipo');

    const value = this && this.value ? this.value : (document.getElementById('victima_conflicto') ? document.getElementById('victima_conflicto').value : '');
    if (value === 'Si') {
        if (container) container.style.display = 'block';
        if (campo) campo.setAttribute('required', 'required');
    } else {
        if (container) container.style.display = 'none';
        if (campo) {
            campo.removeAttribute('required');
            campo.removeAttribute('data-originally-required');
            campo.value = '';
        }
    }
}

function handleGrupoEtnico() {
    const container = document.getElementById('etnico_tipo_container');
    const campo = document.getElementById('etnico_tipo');

    const value = this && this.value ? this.value : (document.getElementById('grupo_etnico') ? document.getElementById('grupo_etnico').value : '');
    if (value === 'Si') {
        if (container) container.style.display = 'block';
        if (campo) campo.setAttribute('required', 'required');
    } else {
        if (container) container.style.display = 'none';
        if (campo) {
            campo.removeAttribute('required');
            campo.removeAttribute('data-originally-required');
            campo.value = '';
        }
    }
}

// ==================== CARGA DE DATOS ====================
function cargarGrupos() {
    // Cargar select de grupos desde PHP
    fetch('php/Cargar_grupos.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json();
        })
        .then(data => {
            const select = document.getElementById('id_grupo');
            if (!select) return;
            select.innerHTML = '<option value="">Seleccione un grupo</option>';

            if (data.error) {
                showAlert('Error al cargar grupos: ' + data.message, 'error');
                return;
            }

            if (data.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No hay grupos disponibles';
                option.disabled = true;
                select.appendChild(option);
                return;
            }

            data.forEach(grupo => {
                const option = document.createElement('option');
                option.value = grupo.id_grupo;
                option.textContent = grupo.grupo + ' - ' + grupo.grado;
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error cargando grupos:', error);
            showAlert('Error de conexión al cargar la lista de grupos', 'error');
        });
}

// ==================== NAVEGACIÓN ENTRE PASOS ====================
function nextStep() {
    if (validateCurrentStep()) {
        // Si estamos en el paso 5 (entorno educativo) y aún no se ha completado la fase 1, registrar estudiante
        if (currentStep === 5 && !isPhase1Complete) {
            registerStudentPhase1();
            return;
        }

        if (currentStep < totalSteps) {
            // Ocultar paso actual
            const currentFormStep = document.getElementById('form-step-' + currentStep);
            if (currentFormStep) currentFormStep.classList.remove('active');
            const currentStepIndicator = document.getElementById('step' + currentStep);
            if (currentStepIndicator) {
                currentStepIndicator.classList.remove('active');
                currentStepIndicator.classList.add('completed');
            }

            // Mostrar siguiente paso
            currentStep++;
            const nextFormStep = document.getElementById('form-step-' + currentStep);
            if (nextFormStep) nextFormStep.classList.add('active');
            const nextStepIndicator = document.getElementById('step' + currentStep);
            if (nextStepIndicator) nextStepIndicator.classList.add('active');

            // Si llegamos al paso 3 (acudiente), verificar y mostrar mensaje adecuado
            if (currentStep === 3) {
                updateCuidadorStepMessage();
            }

            // Gestionar atributos required
            manageRequiredAttributes();
            updateButtons();
            updateProgressBar();

            // Scroll suave hacia arriba
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Si llegamos al paso 6 (antes era 5), configurar la descripción
            if (currentStep === 6) {
                setupDescripcionStep();
            }
        }
    }
}

function updateCuidadorStepMessage() {
    const warningDiv = document.querySelector('#form-step-3 .warning-text');
    const madreReason = document.getElementById('madre_skip_reason_value') ? document.getElementById('madre_skip_reason_value').value : '';
    const padreReason = document.getElementById('padre_skip_reason_value') ? document.getElementById('padre_skip_reason_value').value : '';

    let message = '<strong>Nota:</strong> ';

    if (madreSkipped && padreSkipped) {
        if (madreReason === 'no_presente' && padreReason === 'no_presente') {
            message += 'Ambos padres no están presentes. Es OBLIGATORIO registrar aquí los datos del acudiente responsable del menor (abuelo/a, tío/a, hermano/a mayor, tutor legal, etc.).';
            if (warningDiv) {
                warningDiv.style.backgroundColor = '#fff3cd';
                warningDiv.style.borderColor = '#ffc107';
                warningDiv.style.color = '#856404';
            }
        } else if ((madreReason === 'es_acudiente' && padreReason === 'no_presente') ||
            (madreReason === 'no_presente' && padreReason === 'es_acudiente')) {
            const parenteAcudiente = madreReason === 'es_acudiente' ? 'madre' : 'padre';
            message += `La ${parenteAcudiente} actuará como acudiente. Registre aquí los datos de la ${parenteAcudiente}.`;
            if (warningDiv) {
                warningDiv.style.backgroundColor = '#d1ecf1';
                warningDiv.style.borderColor = '#bee5eb';
                warningDiv.style.color = '#0c5460';
            }

            // Aplicar pre-llenado si está disponible
            applyCuidadorPrefill();
        }
    } else if (madreSkipped) {
        if (madreReason === 'es_acudiente') {
            message += 'La madre actuará como acudiente. Registre aquí los datos de la madre.';
            applyCuidadorPrefill();
        } else {
            message += 'La madre no está presente. Registre aquí los datos del acudiente principal del estudiante.';
        }
    } else if (padreSkipped) {
        if (padreReason === 'es_acudiente') {
            message += 'El padre actuará como acudiente. Registre aquí los datos del padre.';
            applyCuidadorPrefill();
        } else {
            message += 'El padre no está presente. Registre aquí los datos del acudiente principal del estudiante.';
        }
    } else {
        message += 'Este registro es obligatorio. Si la madre o el padre es el acudiente principal, registre aquí esa información.';
    }

    if (warningDiv) warningDiv.innerHTML = message;
}

function previousStep() {
    if (currentStep > 1) {
        // No permitir retroceder más allá del paso 5 si ya se completó la fase 1
        if (isPhase1Complete && currentStep <= 5) {
            showAlert('No puede retroceder una vez que el estudiante ha sido registrado en la base de datos.', 'warning');
            return;
        }

        // Ocultar paso actual
        const currentFormStep = document.getElementById('form-step-' + currentStep);
        if (currentFormStep) currentFormStep.classList.remove('active');
        const currentStepIndicator = document.getElementById('step' + currentStep);
        if (currentStepIndicator) currentStepIndicator.classList.remove('active');

        // Mostrar paso anterior
        currentStep--;
        const prevFormStep = document.getElementById('form-step-' + currentStep);
        if (prevFormStep) prevFormStep.classList.add('active');
        const prevStepIndicator = document.getElementById('step' + currentStep);
        if (prevStepIndicator) {
            prevStepIndicator.classList.remove('completed');
            prevStepIndicator.classList.add('active');
        }

        // Gestionar atributos required
        manageRequiredAttributes();
        updateButtons();
        updateProgressBar();

        // Scroll suave hacia arriba
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function goToStep(targetStep) {
    if (targetStep < 1 || targetStep > totalSteps) return;

    // No permitir ir a pasos anteriores si ya se completó la fase 1
    if (isPhase1Complete && targetStep < 5) {
        showAlert('No puede retroceder una vez que el estudiante ha sido registrado en la base de datos.', 'warning');
        return;
    }

    // Ocultar paso actual
    const currentFormStep = document.getElementById('form-step-' + currentStep);
    if (currentFormStep) currentFormStep.classList.remove('active');
    const currentStepIndicator = document.getElementById('step' + currentStep);
    if (currentStepIndicator) currentStepIndicator.classList.remove('active');

    // Mostrar paso objetivo
    currentStep = targetStep;
    const targetFormStep = document.getElementById('form-step-' + currentStep);
    if (targetFormStep) targetFormStep.classList.add('active');
    const targetStepIndicator = document.getElementById('step' + currentStep);
    if (targetStepIndicator) targetStepIndicator.classList.add('active');

    // Gestionar required attributes
    manageRequiredAttributes();
    updateButtons();
    updateProgressBar();

    // Scroll suave hacia arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== REGISTRO DE ESTUDIANTE (FASE 1) ====================
function registerStudentPhase1() {
    showLoadingOverlay();

    // Restaurar todos los required para validación (pasos 1-5)
    restoreAllRequiredAttributesForPhase1();

    if (!validateSteps1to5()) {
        hideLoadingOverlay();
        return;
    }

    const form = document.getElementById('formulario-completo');
    if (!form) {
        hideLoadingOverlay();
        showAlert('Formulario no encontrado en la página.', 'error');
        return;
    }

    const formData = new FormData(form);
    formData.set('phase', '1');

    fetch('php/Registrar_estudiante.php', {
        method: 'POST',
        body: formData
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                isPhase1Complete = true;
                estudianteRegistradoId = data.id_estudiante;
                estudianteRegistradoNombre = data.data && data.data.nombre_completo ? data.data.nombre_completo : '';

                let message = `¡Estudiante registrado exitosamente! ID: ${data.id_estudiante}. `;

                // Agregar información sobre foto si se subió
                if (data.photo_info) {
                    message += `Foto guardada: ${data.photo_info}. `;
                }

                // Agregar información sobre skips si hay
                if (data.skip_info) {
                    if (data.skip_info.madre) {
                        message += `Madre: ${data.skip_info.madre}. `;
                    }
                    if (data.skip_info.padre) {
                        message += `Padre: ${data.skip_info.padre}. `;
                    }
                }

                message += 'Ahora puede proceder con la descripción general.';

                showAlert(message, 'success');

                // Avanzar al paso 6
                const currentFormStep = document.getElementById('form-step-' + currentStep);
                if (currentFormStep) currentFormStep.classList.remove('active');
                const currentStepIndicator = document.getElementById('step' + currentStep);
                if (currentStepIndicator) currentStepIndicator.classList.remove('active');
                if (currentStepIndicator) currentStepIndicator.classList.add('completed');

                currentStep = 6;
                const newFormStep = document.getElementById('form-step-' + currentStep);
                if (newFormStep) newFormStep.classList.add('active');
                const newStepIndicator = document.getElementById('step' + currentStep);
                if (newStepIndicator) newStepIndicator.classList.add('active');

                setupDescripcionStep();
                manageRequiredAttributes();
                updateButtons();
                updateProgressBar();

                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                showAlert('Error en Fase 1: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('Error de conexión al registrar el estudiante', 'error');
        })
        .finally(() => {
            hideLoadingOverlay();
            // Restaurar gestión de required
            manageRequiredAttributes();
        });
}

function setupDescripcionStep() {
    const selectEstudiante = document.getElementById('id_estudiante_descripcion');
    if (!selectEstudiante) return;

    if (isPhase1Complete && estudianteRegistradoNombre) {
        selectEstudiante.innerHTML = `<option value="${estudianteRegistradoId}">${estudianteRegistradoNombre} (Recién registrado)</option>`;
        selectEstudiante.value = estudianteRegistradoId;
    } else {
        const nombreEstudianteEl = document.getElementById('estudiante_nombre');
        const apellidosEstudianteEl = document.getElementById('estudiante_apellidos');
        const nombreEstudiante = nombreEstudianteEl ? nombreEstudianteEl.value : '';
        const apellidosEstudiante = apellidosEstudianteEl ? apellidosEstudianteEl.value : '';
        selectEstudiante.innerHTML = `<option value="nuevo_estudiante">${nombreEstudiante} ${apellidosEstudiante} (Debe completar registro primero)</option>`;
    }
}

function restoreAllRequiredAttributesForPhase1() {
    for (let step = 1; step <= 5; step++) {
        const stepElement = document.getElementById('form-step-' + step);
        if (!stepElement) continue;
        const fields = stepElement.querySelectorAll('[data-originally-required]');
        fields.forEach(field => {
            field.setAttribute('required', '');
        });
    }
}

// ==================== REGISTRO DE DESCRIPCIÓN (FASE 2) ====================
function handleFormSubmit(event) {
    event.preventDefault();

    if (!isPhase1Complete) {
        showAlert('Debe completar el registro del estudiante antes de enviar la descripción general.', 'error');
        return;
    }

    // Mostrar loading
    showLoadingOverlay();

    // Restaurar todos los required de la fase 2
    for (let step = 6; step <= totalSteps; step++) {
        const stepElement = document.getElementById('form-step-' + step);
        if (!stepElement) continue;
        const fields = stepElement.querySelectorAll('[data-originally-required]');
        fields.forEach(field => {
            field.setAttribute('required', '');
        });
    }

    if (!validateAllDescriptionSteps()) {
        hideLoadingOverlay();
        return;
    }

    const form = document.getElementById('formulario-completo');
    if (!form) {
        hideLoadingOverlay();
        showAlert('Formulario no encontrado en la página.', 'error');
        return;
    }

    const formData = new FormData(form);
    formData.set('phase', '2');
    formData.set('id_estudiante', estudianteRegistradoId);

    fetch('php/Registrar_estudiante.php', {
        method: 'POST',
        body: formData
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                showAlert(`¡Registro completo exitoso! Descripción general creada para ${data.student_name}`, 'success');
                setTimeout(() => {
                    resetForm();
                }, 3000);
            } else {
                showAlert('Error en Fase 2: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('Error de conexión al procesar la descripción general', 'error');
        })
        .finally(() => {
            hideLoadingOverlay();
            manageRequiredAttributes();
        });
}

// ==================== FUNCIONES DE UI ====================
function updateButtons() {
    const btnAnterior = document.getElementById('btnAnterior');
    const btnSiguiente = document.getElementById('btnSiguiente');
    const btnRegistrar = document.getElementById('btnRegistrar');

    // Mostrar/ocultar botón anterior
    btnAnterior.style.display = currentStep > 1 ? 'inline-block' : 'none';

    // Mostrar/ocultar botones siguiente y registrar
    if (currentStep === totalSteps) {
        btnSiguiente.style.display = 'none';
        btnRegistrar.style.display = 'inline-block';
        btnRegistrar.textContent = 'Completar Descripción General';
    } else if (currentStep === 5 && !isPhase1Complete) {
        btnSiguiente.textContent = 'Registrar Estudiante';
    } else {
        btnSiguiente.style.display = 'inline-block';
        btnRegistrar.style.display = 'none';
        btnSiguiente.textContent = 'Siguiente';
    }
}

function updateProgressBar() {
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        const progress = (currentStep / totalSteps) * 100;
        progressBar.style.width = progress + '%';
    }
}

function showAlert(message, type = 'success') {
    // Remover alertas existentes
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());

    // Crear nueva alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    // Insertar después del título si existe, si no, al principio del body
    const title = document.querySelector('.section h1');
    if (title && title.parentNode) {
        title.parentNode.insertBefore(alertDiv, title.nextSibling);
    } else {
        document.body.insertBefore(alertDiv, document.body.firstChild);
    }

    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);

    // Scroll suave hacia la alerta
    alertDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showLoadingOverlay() {
    let overlay = document.getElementById('formLoading');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'formLoading';
        overlay.className = 'form-loading';
        overlay.innerHTML = `
            <div class="spinner"></div>
            <div class="loading-text">Procesando registro...</div>
        `;
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('formLoading');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

function resetForm() {
    const form = document.getElementById('formulario-completo');
    if (form) form.reset();

    currentStep = 1;
    estudianteRegistradoId = null;
    estudianteRegistradoNombre = '';
    isPhase1Complete = false;
    madreSkipped = false;
    padreSkipped = false;

    // Limpiar foto
    removePhoto();

    // Limpiar sessionStorage de pre-llenado
    sessionStorage.removeItem('prefill_cuidador_nombre');
    sessionStorage.removeItem('prefill_cuidador_educacion');
    sessionStorage.removeItem('prefill_cuidador_email');
    sessionStorage.removeItem('prefill_cuidador_telefono');
    sessionStorage.removeItem('prefill_cuidador_contrasena');
    sessionStorage.removeItem('prefill_cuidador_parentesco');

    // Ocultar todos los pasos excepto el primero
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });
    const firstStep = document.getElementById('form-step-1');
    if (firstStep) firstStep.classList.add('active');

    // Reiniciar indicadores de progreso
    document.querySelectorAll('.step-indicator').forEach(indicator => {
        indicator.classList.remove('active', 'completed');
    });
    const step1Indicator = document.getElementById('step1');
    if (step1Indicator) step1Indicator.classList.add('active');

    // Limpiar atributos data-originally-required
    document.querySelectorAll('[data-originally-required]').forEach(field => {
        field.removeAttribute('data-originally-required');
        field.classList.remove('valid', 'invalid');
        field.style.borderColor = '#e9ecef';
    });

    // Ocultar campos condicionales si existen
    const victContainer = document.getElementById('victima_tipo_container');
    if (victContainer) victContainer.style.display = 'none';
    const etnContainer = document.getElementById('etnico_tipo_container');
    if (etnContainer) etnContainer.style.display = 'none';

    // Reset skip states UI si existen
    const madreSkippedInfo = document.getElementById('madre-skipped-info');
    if (madreSkippedInfo) madreSkippedInfo.style.display = 'none';
    const padreSkippedInfo = document.getElementById('padre-skipped-info');
    if (padreSkippedInfo) padreSkippedInfo.style.display = 'none';
    const madreFormFields = document.getElementById('madre-form-fields');
    if (madreFormFields) madreFormFields.classList.remove('form-disabled');
    const padreFormFields = document.getElementById('padre-form-fields');
    if (padreFormFields) padreFormFields.classList.remove('form-disabled');

    // Restaurar mensaje original del cuidador
    const warningDiv = document.querySelector('#form-step-3 .warning-text');
    if (warningDiv) {
        warningDiv.innerHTML = '<strong>Nota:</strong> Este registro es obligatorio. Si la madre o el padre es el acudiente principal, registre aquí esa información.';
        warningDiv.style.backgroundColor = '';
        warningDiv.style.borderColor = '';
        warningDiv.style.color = '#856404';
    }

    // Reconfigurar required attributes
    manageRequiredAttributes();
    updateButtons();
    updateProgressBar();

    // Scroll hacia arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== NAVEGACIÓN CON TECLADO ====================
function handleKeyNavigation(event) {
    if (event.ctrlKey) {
        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                if (currentStep > 1) {
                    previousStep();
                }
                break;
            case 'ArrowRight':
                event.preventDefault();
                if (currentStep < totalSteps) {
                    nextStep();
                }
                break;
        }
    }
}

// ==================== FUNCIONES DE UTILIDAD ====================
function goBackOrRedirect(ruta) {
    if (ruta && ruta.trim() !== '') {
        window.location.href = ruta;
    } else {
        window.history.back();
    }
}

function debugInfo() {
    console.log('Estado actual del formulario:');
    console.log('Paso actual:', currentStep);
    console.log('Total de pasos:', totalSteps);
    console.log('ID estudiante registrado:', estudianteRegistradoId);
    console.log('Fase 1 completa:', isPhase1Complete);
    console.log('Madre omitida:', madreSkipped);
    console.log('Padre omitido:', padreSkipped);

    const gruposSelect = document.getElementById('id_grupo');
    console.log('Grupos cargados:', gruposSelect ? gruposSelect.options.length - 1 : 0);

    const requiredFields = document.querySelectorAll('[required]');
    console.log('Campos required activos:', requiredFields.length);

    const originallyRequired = document.querySelectorAll('[data-originally-required]');
    console.log('Campos originally required:', originallyRequired.length);
}

// ==================== INICIALIZACIÓN ADICIONAL AL DOM CONTENT LOADED ====================
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('formulario-completo');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    // Ejecutar verificación de rol (ya se hace arriba, llamada de seguridad)
    verificarYAplicarRestricciones();
});

// ---------------------------
// CONFIGURACIÓN DEL MENÚ AL CARGAR EL DOM
// ---------------------------
document.addEventListener('DOMContentLoaded', function () {

    // Inicializar funcionalidad de foto
    initPhotoUpload();
});

// ==================== FUNCIONALIDAD DE FOTO ====================
function initPhotoUpload() {
    const photoInput = document.getElementById('student_photo');
    const removePhotoBtn = document.getElementById('removePhotoBtn');

    if (photoInput) {
        photoInput.addEventListener('change', handlePhotoChange);
    }

    if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', removePhoto);
    }
}

function handlePhotoChange(event) {
    const file = event.target.files[0];
    const photoPreview = document.getElementById('photoPreview');
    const removePhotoBtn = document.getElementById('removePhotoBtn');
    const photoError = document.getElementById('photoError');

    // Limpiar errores previos
    hidePhotoError();

    if (!file) {
        return;
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        showPhotoError('Por favor seleccione un archivo de imagen válido (JPG, PNG, GIF)');
        event.target.value = '';
        return;
    }

    // Validar tamaño (2MB máximo)
    const maxSize = 2 * 1024 * 1024; // 2MB en bytes
    if (file.size > maxSize) {
        showPhotoError('La imagen es demasiado grande. El tamaño máximo es 2MB');
        event.target.value = '';
        return;
    }

    // Validar dimensiones mínimas (opcional)
    const img = new Image();
    img.onload = function() {
        if (this.width < 100 || this.height < 100) {
            showPhotoError('La imagen es demasiado pequeña. Mínimo 100x100 píxeles');
            event.target.value = '';
            return;
        }

        // Si todo está bien, mostrar preview
        displayPhotoPreview(file);
    };
    img.src = URL.createObjectURL(file);
}

function displayPhotoPreview(file) {
    const photoPreview = document.getElementById('photoPreview');
    const removePhotoBtn = document.getElementById('removePhotoBtn');

    const reader = new FileReader();
    reader.onload = function(e) {
        photoPreview.innerHTML = `<img src="${e.target.result}" alt="Foto del estudiante">`;
        removePhotoBtn.style.display = 'inline-block';
        
        // Mostrar mensaje de éxito
        showPhotoSuccess('Foto cargada correctamente');
    };
    reader.readAsDataURL(file);
}

function removePhoto() {
    const photoInput = document.getElementById('student_photo');
    const photoPreview = document.getElementById('photoPreview');
    const removePhotoBtn = document.getElementById('removePhotoBtn');

    photoInput.value = '';
    photoPreview.innerHTML = '<div class="photo-placeholder">📷</div>';
    removePhotoBtn.style.display = 'none';
    hidePhotoError();
}

function showPhotoError(message) {
    const photoError = document.getElementById('photoError');
    if (photoError) {
        photoError.textContent = message;
        photoError.style.display = 'block';
        photoError.className = 'photo-upload-error';
    }
}

function showPhotoSuccess(message) {
    const photoError = document.getElementById('photoError');
    if (photoError) {
        photoError.textContent = message;
        photoError.style.display = 'block';
        photoError.className = 'photo-upload-success';
        photoError.style.color = '#28a745';
        
        // Ocultar mensaje después de 3 segundos
        setTimeout(hidePhotoError, 3000);
    }
}

function hidePhotoError() {
    const photoError = document.getElementById('photoError');
    if (photoError) {
        photoError.style.display = 'none';
        photoError.textContent = '';
        photoError.className = 'photo-upload-error';
        photoError.style.color = '#dc3545';
    }
}

// Función para validar foto antes del envío
function validatePhoto() {
    const photoInput = document.getElementById('student_photo');
    if (photoInput && photoInput.files.length > 0) {
        const file = photoInput.files[0];
        
        // Validaciones finales antes del envío
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return { valid: false, message: 'Tipo de archivo no válido para la foto' };
        }
        
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            return { valid: false, message: 'La foto es demasiado grande (máximo 2MB)' };
        }
        
        return { valid: true };
    }
    
    // Foto es opcional, así que es válido si no hay foto
    return { valid: true };
}

// Función para manejar campos condicionales del entorno educativo
function setupEntornoEducativoEventListeners() {
    // Campo condicional para institución anterior
    document.getElementById('vinculado_otra_inst').addEventListener('change', handleVinculadoOtraInst);
    
    // Campo condicional para programas complementarios
    document.getElementById('asiste_programas_complementarios').addEventListener('change', handleProgramasComplementarios);
}

function handleVinculadoOtraInst() {
    const container = document.getElementById('institucion_anterior_container');
    const campo = document.getElementById('nombre_institucion_anterior');
    
    if (this.value === 'Si') {
        container.style.display = 'block';
        campo.setAttribute('required', 'required');
    } else {
        container.style.display = 'none';
        campo.removeAttribute('required');
        campo.removeAttribute('data-originally-required');
        campo.value = '';
    }
}

function handleProgramasComplementarios() {
    const container = document.getElementById('programas_complementarios_container');
    const campo = document.getElementById('detalle_programas_complementarios');
    
    if (this.value === 'Si') {
        container.style.display = 'block';
        campo.setAttribute('required', 'required');
    } else {
        container.style.display = 'none';
        campo.removeAttribute('required');
        campo.removeAttribute('data-originally-required');
        campo.value = '';
    }
}
