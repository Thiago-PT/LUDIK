// ========== FUNCIONALIDAD ESPECÍFICA DE AYUDA ==========

// Función para configurar las preguntas frecuentes
function configurarFAQ() {
    const questions = document.querySelectorAll(".faq-question");

    questions.forEach(question => {
        question.addEventListener("click", function () {
            // Toggle active class
            this.classList.toggle("active");

            // Get the answer element
            const answer = this.nextElementSibling;

            // Toggle max-height for smooth animation
            if (answer.style.maxHeight) {
                answer.style.maxHeight = null;
            } else {
                answer.style.maxHeight = answer.scrollHeight + "px";
            }

            // Close other questions (optional - uncomment if you want accordion behavior)
            /*
            questions.forEach(otherQuestion => {
                if (otherQuestion !== this) {
                    otherQuestion.classList.remove("active");
                    const otherAnswer = otherQuestion.nextElementSibling;
                    otherAnswer.style.maxHeight = null;
                }
            });
            */
        });
    });
}

// ======= FUNCIONES ADICIONALES PARA PERSONALIZACIÓN =======

// Función para cambiar el título del header
function cambiarTitulo(nuevoTitulo) {
    const titulo = document.querySelector('.title');
    if (titulo) {
        titulo.textContent = nuevoTitulo;
    }
}

// Función para cambiar el logo
function cambiarLogo(rutaLogo) {
    const logo = document.querySelector('.header-logo');
    if (logo) {
        logo.src = rutaLogo;
    }
}

// Función para añadir botón personalizado al menú
function añadirBotonMenu(icono, texto, callback) {
    const menuButtons = document.querySelector('.menu-buttons');
    const botonCerrarSesion = document.querySelector('.close-session');

    if (menuButtons) {
        const nuevoBoton = document.createElement('button');
        nuevoBoton.className = 'menu-button';
        nuevoBoton.innerHTML = `
            <span class="menu-icon">${icono}</span>
            ${texto}
        `;

        // Insertar antes del botón de cerrar sesión
        if (botonCerrarSesion) {
            menuButtons.insertBefore(nuevoBoton, botonCerrarSesion);
        } else {
            menuButtons.appendChild(nuevoBoton);
        }

        // Añadir evento click
        nuevoBoton.addEventListener('click', callback);

        return nuevoBoton;
    }
}

// Función para remover botón específico
function removerBotonMenu(textoBoton) {
    const botones = document.querySelectorAll('.menu-button');
    botones.forEach(boton => {
        if (boton.textContent.trim().toLowerCase().includes(textoBoton.toLowerCase())) {
            boton.remove();
        }
    });
}

// Función para cambiar el título del panel de control
function cambiarTituloPanel(nuevoTitulo) {
    const menuTitle = document.querySelector('.menu-title');
    if (menuTitle) {
        menuTitle.textContent = nuevoTitulo;
    }
}

// Función para añadir nueva pregunta al FAQ
function añadirPreguntaFAQ(pregunta, respuesta) {
    const faqContainer = document.querySelector('.faq-container');
    if (faqContainer) {
        const nuevaPregunta = document.createElement('div');
        nuevaPregunta.className = 'faq-item';
        nuevaPregunta.innerHTML = `
            <button class="faq-question">${pregunta}</button>
            <div class="faq-answer">
                <p>${respuesta}</p>
            </div>
        `;

        // Insertar antes del último elemento (que sería la sección de contacto)
        const lastFaqItem = faqContainer.querySelector('.faq-item:last-child');
        if (lastFaqItem) {
            faqContainer.insertBefore(nuevaPregunta, lastFaqItem.nextSibling);
        } else {
            faqContainer.appendChild(nuevaPregunta);
        }

        // Reconfigurar eventos para la nueva pregunta
        configurarFAQ();
    }
}



window.AyudaFunctions = {
    añadirPreguntaFAQ,
    configurarFAQ
};

console.log("Ayuda.js cargado completamente");