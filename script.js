// Global Configuration
//const API_BASE_URL = 'http://34.68.183.117.nip.io/public-api';
const API_BASE_URL = 'https://34.68.183.117.sslip.io/public-api'
let appData = {
    vacancies: [],
    posts: [],
    lastFetch: {
        vacancies: 0,
        posts: 0
    }
};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('es-HN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
    toast.style.zIndex = '9999';
    toast.innerHTML = `
        <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close ms-auto" onclick="this.parentElement.remove()"></button>
    `;
    document.body.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// API Functions
// REEMPLAZA LA FUNCIÓN apiCall COMPLETA CON ESTA VERSIÓN CORREGIDA
async function apiCall(endpoint, options = {}) {
    try {
        console.log(`API Call: ${API_BASE_URL}${endpoint}`);
        
        const finalOptions = { ...options };

        // Lógica clave: Solo establece Content-Type si el body NO es FormData.
        if (!(finalOptions.body instanceof FormData)) {
            finalOptions.headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...finalOptions.headers
            };
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, finalOptions);

        // Primero, verificamos si la respuesta es exitosa a nivel de HTTP
        if (!response.ok) {
            // Intentamos obtener un error específico del cuerpo de la respuesta
            let errorMsg = `Error del servidor: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.error || errorMsg;
            } catch (e) {
                // El cuerpo del error no era JSON, nos quedamos con el status
            }
            throw new Error(errorMsg);
        }

        // Si la respuesta es exitosa (ej. 200 OK), procedemos a parsear el JSON
        const data = await response.json();
        
        // Verificamos el indicador de éxito de nuestra lógica de negocio
        if (data.success === false) {
            throw new Error(data.error || `La API reportó un fallo.`);
        }

        return { success: true, data: data.data };
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        return { success: false, error: error.message };
    }
}

// Cache Management
function shouldFetchData(dataType) {
    const now = Date.now();
    const lastFetch = appData.lastFetch[dataType] || 0;
    return now - lastFetch > CACHE_DURATION;
}

function setCacheTimestamp(dataType) {
    appData.lastFetch[dataType] = Date.now();
}

// Data Loading Functions
async function loadVacancies(forceRefresh = false) {
    if (!forceRefresh && appData.vacancies.length > 0 && !shouldFetchData('vacancies')) {
        return { success: true, data: appData.vacancies };
    }

    const result = await apiCall('/vacancies');
    if (result.success) {
        appData.vacancies = result.data;
        setCacheTimestamp('vacancies');
    }
    return result;
}

// AÑADE ESTA NUEVA FUNCIÓN
async function loadPosts(forceRefresh = false) {
    if (!forceRefresh && appData.posts.length > 0 && !shouldFetchData('posts')) {
        return { success: true, data: appData.posts };
    }

    const result = await apiCall('/posts'); // Llama al nuevo endpoint público
    if (result.success) {
        appData.posts = result.data;
        setCacheTimestamp('posts');
    }
    return result;
}

// Render Functions
    function renderVacancies(vacancies, container, limit = null) {
    if (!vacancies || vacancies.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="job-icon mx-auto mb-3" style="background-color: var(--border-color); color: var(--text-light);">
                    <i class="bi bi-search"></i>
                </div>
                <h5 class="text-muted">No hay vacantes disponibles</h5>
                <p class="text-muted">¡Regresa pronto! Constantemente agregamos nuevas oportunidades.</p>
            </div>
        `;
        return;
    }

    const displayVacancies = limit ? vacancies.slice(0, limit) : vacancies;
    const isLoggedIn = !!localStorage.getItem('candidateIdentity');
    
    container.innerHTML = displayVacancies.map((vacancy, index) => `
        <div class="col-lg-4 col-md-6">
            <div class="card job-card h-100 fade-in" style="animation-delay: ${index * 0.1}s">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex align-items-start mb-3">
                        <div class="job-icon me-3">
                            <i class="bi bi-briefcase"></i>
                        </div>
                        <div class="flex-grow-1">
                            <h5 class="card-title mb-1">${vacancy.puesto || 'Puesto no especificado'}</h5>
                            <div class="d-flex align-items-center text-muted small mb-2">
                                <i class="bi bi-geo-alt me-1"></i>
                                <span>${vacancy.ciudad || 'No especificada'}</span>
                            </div>
                        </div>
                    </div>
                    <p class="card-text text-muted small flex-grow-1">${(vacancy.requisitos || '').substring(0, 120)}...</p>
                    <div class="d-flex justify-content-between mt-auto">
                        <button class="btn btn-outline-primary" onclick="showJobDetails(${JSON.stringify(vacancy).replace(/"/g, '&quot;')})">Ver Detalles</button>
                        ${isLoggedIn ? `<button class="btn btn-primary apply-button" onclick="requestApplication(${vacancy.id_vacante})">Solicitar</button>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// REEMPLAZA ESTA FUNCIÓN COMPLETA
function renderPosts(posts, container, limit = null) {
    const displayPosts = limit ? posts.slice(0, limit) : posts;
    
    container.innerHTML = displayPosts.map((post, index) => `
        <div class="col-lg-4 col-md-6">
            <div class="card h-100 fade-in" style="animation-delay: ${index * 0.1}s">
                <!-- CAMBIO CLAVE AQUÍ: Usamos post.image_url -->
                <img src="${post.image_url}" class="card-img-top" alt="${post.title}" style="height: 200px; object-fit: cover;">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${post.title}</h5>
                    <p class="card-text text-muted small flex-grow-1">${post.excerpt}</p>
                    <div class="d-flex justify-content-between align-items-center mt-auto pt-3">
                        <small class="text-muted">
                            <i class="bi bi-calendar me-1"></i>
                            <!-- CAMBIO CLAVE AQUÍ: Usamos post.fecha_publicacion -->
                            ${formatDate(post.fecha_publicacion)}
                        </small>
                        <!-- CAMBIO CLAVE AQUÍ: Pasamos el id_post de la base de datos -->
                        <button class="btn btn-outline-primary btn-sm" onclick="showPostDetails(${post.id_post})">
                            Leer más
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// REEMPLAZA ESTA FUNCIÓN COMPLETA
function renderStatusResults(result) {
    const container = document.getElementById('status-results-container');
    
    if (!result.success) {
        container.innerHTML = `<div class="alert alert-danger"><strong>Error:</strong> ${result.error}</div>`;
        return;
    }

    const data = result.data;
    
    if (data.status === 'not_registered') {
        container.innerHTML = `<div class="card"><div class="card-body text-center py-5"><h4 class="text-warning mb-3">Candidato No Encontrado</h4><p class="text-muted mb-4">No encontramos tu perfil. Verifica tu número de identidad o regístrate.</p><a href="#" class="btn btn-primary" data-page-target="page-register">Registrarme Ahora</a></div></div>`;
        return;
    }
    
    if (data.status === 'profile_found') {
        // -- Renderizar Postulaciones y Entrevistas --
        let applicationsHtml = data.applications.length > 0 ? data.applications.map(app => `
            <li class="list-group-item">
                <h6>${app.cargo_solicitado}</h6>
                <span class="badge bg-info">${app.estado}</span>
                <small class="d-block text-muted">Aplicado: ${app.fecha_aplicacion}</small>
                ${app.fecha_entrevista ? `<div class="mt-2 alert alert-success py-1"><strong>Entrevista:</strong> ${app.fecha_entrevista}</div>` : ''}
            </li>
        `).join('') : '<li class="list-group-item text-muted">No tienes postulaciones activas.</li>';

        // -- Renderizar Solicitudes de Postulación --
        let requestsHtml = data.application_requests.length > 0 ? data.application_requests.map(req => `
            <li class="list-group-item">
                <h6>${req.cargo_solicitado}</h6>
                <span class="badge bg-secondary">${req.estado}</span>
                <small class="d-block text-muted">Solicitado: ${req.fecha_solicitud}</small>
            </li>
        `).join('') : '<li class="list-group-item text-muted">No tienes solicitudes recientes.</li>';

        container.innerHTML = `
            <div class="card shadow-sm">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">¡Hola, ${data.candidate_name}!</h5>
                    <button class="btn btn-sm btn-outline-secondary" onclick="logoutAndRedirect()">Salir</button>
                </div>
                <div class="card-body">
                    <div class="row g-4">
                        <div class="col-md-6">
                            <h6 class="text-primary">Mis Postulaciones</h6>
                            <ul class="list-group">${applicationsHtml}</ul>
                        </div>
                        <div class="col-md-6">
                            <h6 class="text-primary">Mis Solicitudes</h6>
                            <ul class="list-group">${requestsHtml}</ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Modal Functions
function showJobDetails(vacancy) {
    const modal = document.getElementById('jobModal');
    const modalTitle = document.getElementById('jobModalLabel');
    const modalBody = document.getElementById('jobModalBody');
    const modalFooter = modal.querySelector('.modal-footer'); // Seleccionamos el footer para cambiar el botón

    modalTitle.textContent = vacancy.puesto || vacancy.cargo_solicitado || 'Detalles de la Vacante';
    
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-8">
                <h6 class="text-primary mb-3">Información del Puesto</h6>
                <div class="mb-3">
                    <strong>Ubicación:</strong>
                    <span class="ms-2">${vacancy.ciudad || vacancy.ubicacion || 'No especificada'}</span>
                </div>
                ${vacancy.salario ? `
                    <div class="mb-3">
                        <strong>Salario:</strong>
                        <span class="ms-2">${vacancy.salario}</span>
                    </div>
                ` : ''}
                
                <h6 class="text-primary mb-3 mt-4">Descripción y Requisitos</h6>
                <p>${vacancy.requisitos || vacancy.descripcion || 'No se especifican requisitos detallados para esta posición.'}</p>
            </div>
            
            <div class="col-md-4">
                <div class="card bg-light">
                    <div class="card-body">
                        <h6 class="card-title">¿Interesado?</h6>
                        <p class="card-text small">Esta vacante coincide con tu perfil. ¡Aplica ahora!</p>
                        <ul class="list-unstyled small">
                            <li><i class="bi bi-check text-success me-2"></i>Proceso transparente</li>
                            <li><i class="bi bi-check text-success me-2"></i>Seguimiento personalizado</li>
                            <li><i class="bi bi-check text-success me-2"></i>Asesoría profesional</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;

    // --- CAMBIO QUIRÚRGICO AQUÍ ---
    // El botón ahora llama a nuestra nueva función lógica y pasa el ID de la vacante.
    modalFooter.innerHTML = `
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
            Cerrar
        </button>
        <button type="button" class="btn btn-primary" onclick="initiateApplicationProcess(${vacancy.id_vacante})">
            <i class="bi bi-send me-2"></i>Solicitar Postulación
        </button>
    `;

    new bootstrap.Modal(modal).show();
}

// AÑADE ESTA NUEVA FUNCIÓN
function logoutAndRedirect() {
    localStorage.removeItem('candidateIdentity');
    document.body.classList.remove('logged-in');
    document.getElementById('status-results-container').innerHTML = '';
    document.getElementById('status-identity').value = '';
    showToast('Has salido de tu perfil.', 'success');
    navigateToPage('page-home');
}

/**
 * Muestra un modal de Bootstrap genérico con un título y contenido HTML.
 * @param {string} title - El título que aparecerá en la cabecera del modal.
 * @param {string} content - El contenido HTML que se insertará en el cuerpo del modal.
 */
// AÑADE ESTE BLOQUE DE 2 FUNCIONES COMPLETAS A TU SCRIPT.JS PÚBLICO
function showModal(title, content) {
    const oldModal = document.getElementById('genericModal');
    if (oldModal) oldModal.remove();

    const modalElement = document.createElement('div');
    modalElement.className = 'modal fade';
    modalElement.id = 'genericModal';
    modalElement.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${title}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">${content}</div>
            </div>
        </div>
    `;
    document.body.appendChild(modalElement);
    const bsModal = new bootstrap.Modal(modalElement);
    bsModal.show();
    modalElement.addEventListener('hidden.bs.modal', () => modalElement.remove());
}

function closeModal() {
    const modalElement = document.getElementById('genericModal');
    if (modalElement) {
        const bsModal = bootstrap.Modal.getInstance(modalElement);
        if (bsModal) bsModal.hide();
    }
}
// REEMPLAZA ESTA FUNCIÓN COMPLETA
function initiateApplicationProcess(vacancyId) {
    const identity = localStorage.getItem('candidateIdentity');
    if (identity) {
        requestApplication(vacancyId);
    } else {
        alert("Para postular, primero debes ingresar a tu perfil desde la sección 'Mi Estado'.");
        navigateToPage('page-status');
    }
}

/**
 * Se llama desde el modal de identificación. Guarda la identidad y procede con la postulación.
 * @param {number} vacancyId - El ID de la vacante a la que se aplica.
 */
function loginAndApply(vacancyId) {
    const identityInput = document.getElementById('modal-identity-input');
    const identity = identityInput.value.trim();
    if (identity) {
        localStorage.setItem('candidateIdentity', identity);
        checkLoginStatus();
        closeModal(); // Cierra el modal de identificación
        requestApplication(vacancyId);
    } else {
        alert('Por favor, ingresa un número de identidad válido.');
    }
}

/**
 * Se llama desde el modal de identificación. Lleva al usuario a la página de registro.
 */
function registerAndApply() {
    closeModal();
    navigateToPage('page-register');
}


function showPostDetails(postId) {
    // Busca el post en los datos que ya tenemos de la API
    const post = appData.posts.find(p => p.id_post === postId);
    
    if (!post) {
        showToast('No se pudo encontrar el artículo.', 'error');
        return;
    }

    // Renombramos image_url a image para que coincida con lo que el modal espera
    const displayPost = {
        ...post,
        image: post.image_url,
        date: post.fecha_publicacion // Usamos la fecha de la base de datos
    };

    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${displayPost.title}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <img src="${displayPost.image}" class="img-fluid rounded mb-4" alt="${displayPost.title}">
                    <div class="d-flex justify-content-between text-muted small mb-4">
                        <span><i class="bi bi-person me-1"></i>Por ${displayPost.author}</span>
                        <span><i class="bi bi-calendar me-1"></i>${formatDate(displayPost.date)}</span>
                    </div>
                    ${displayPost.content}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    modal.addEventListener('hidden.bs.modal', () => modal.remove());
}

function acceptTerms() {
    const checkbox = document.getElementById('terms-agreement');
    if (checkbox) {
        checkbox.checked = true;
    }
}


// Navigation Functions

function navigateToPage(targetPageId) {
    // Oculta todas las páginas
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Muestra la página de destino
    const targetPage = document.getElementById(targetPageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // Actualiza el estado activo de la barra de navegación
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.pageTarget === targetPageId) {
            link.classList.add('active');
        }
    });

    // Actualiza el hash de la URL
    window.location.hash = `#!/${targetPageId}`;

    // Desplaza la vista a la parte superior
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // --- CAMBIO QUIRÚRGICO AQUÍ ---
    // Carga los datos específicos de la página O configura los formularios
    if (targetPageId === 'page-home') {
        loadHomePage();
    } else if (targetPageId === 'page-vacancies') {
        loadVacanciesPage();
    } else if (targetPageId === 'page-posts') {
        loadPostsPage();
    } else if (targetPageId === 'page-register' || targetPageId === 'page-contact') {
        // Si la página es la de registro o contacto, nos aseguramos de que
        // la validación del formulario esté activa en ese momento.
        setupFormValidation();
    }
}

// Page Loading Functions
async function loadHomePage() {
    const featuredContainer = document.getElementById('featured-vacancies-container');
    const postsContainer = document.getElementById('featured-posts-container');

    // Carga de vacantes (sin cambios)
    const vacanciesResult = await loadVacancies();
    if (vacanciesResult.success) {
        renderVacancies(vacanciesResult.data, featuredContainer, 3);
    } else {
        featuredContainer.innerHTML = `<div class="col-12 text-center"><div class="alert alert-warning">No se pudieron cargar las vacantes: ${vacanciesResult.error}</div></div>`;
    }

    // --- CAMBIO AQUÍ ---
    // Carga de posts desde la API
    const postsResult = await loadPosts();
    if (postsResult.success) {
        renderPosts(postsResult.data, postsContainer, 3);
    } else {
         postsContainer.innerHTML = `<div class="col-12 text-center"><div class="alert alert-warning">No se pudieron cargar las noticias.</div></div>`;
    }
}


async function loadPostsPage() {
    const container = document.getElementById('all-posts-container');
    container.innerHTML = `<div class="col-12 text-center py-5"><div class="spinner-custom mx-auto"></div><p class="mt-3 text-muted">Cargando noticias...</p></div>`;

    // Llama a la nueva función que obtiene los posts de la API
    const result = await loadPosts(true); // El 'true' fuerza la recarga de datos desde el servidor
    
    if (result.success) {
        // Si la llamada a la API fue exitosa, renderiza los posts
        renderPosts(result.data, container);
    } else {
        // Si hubo un error, muestra un mensaje de error
        container.innerHTML = `<div class="col-12 text-center"><div class="alert alert-danger">Error al cargar noticias: ${result.error}</div></div>`;
    }
}


async function loadVacanciesPage() {
    const container = document.getElementById('all-vacancies-container');
    const countBadge = document.getElementById('vacancy-count');

    // Show loading state
    container.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-custom mx-auto"></div>
            <p class="mt-3 text-muted">Cargando vacantes...</p>
        </div>
    `;

    const result = await loadVacancies(true); // Force refresh on vacancies page
    
    if (result.success) {
        renderVacancies(result.data, container);
        countBadge.textContent = `${result.data.length} vacantes disponibles`;
    } else {
        container.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-circle me-2"></i>
                    Error al cargar vacantes: ${result.error}
                </div>
            </div>
        `;
        countBadge.textContent = 'Error al cargar';
    }
}


// Filter Functions
function applyFilters() {
    const locationFilter = document.getElementById('location-filter').value;
    const areaFilter = document.getElementById('area-filter').value;
    
    let filteredVacancies = appData.vacancies;
    
    if (locationFilter) {
        filteredVacancies = filteredVacancies.filter(v => 
            (v.ciudad || v.ubicacion || '').toLowerCase().includes(locationFilter.toLowerCase())
        );
    }
    
    if (areaFilter) {
        filteredVacancies = filteredVacancies.filter(v => 
            (v.area || v.departamento || v.puesto || '').toLowerCase().includes(areaFilter.toLowerCase())
        );
    }
    
    const container = document.getElementById('all-vacancies-container');
    const countBadge = document.getElementById('vacancy-count');
    
    renderVacancies(filteredVacancies, container);
    countBadge.textContent = `${filteredVacancies.length} vacantes encontradas`;
    
    showToast(`Se encontraron ${filteredVacancies.length} vacantes que coinciden con tus filtros.`, 'success');
}

// Form Validation and Submission
function setupFormValidation() {
    const forms = document.querySelectorAll('.needs-validation');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            } else {
                event.preventDefault();
                handleFormSubmission(form);
            }
            
            form.classList.add('was-validated');
        });
    });
}

async function handleFormSubmission(form) {
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;

    // Deshabilitar botón y mostrar estado de carga
    submitButton.disabled = true;
    submitButton.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Procesando...
    `;

    if (form.id === 'registration-form') {
        // La lógica de registro se manejará en su propia función
        await handleRegistrationForm(form);
    } 
    else if (form.id === 'contact-form') {
        const contactData = {
            name: document.getElementById('contact-name').value,
            email: document.getElementById('contact-email').value,
            subject: document.getElementById('contact-subject').value,
            message: document.getElementById('contact-message').value
        };

        const result = await apiCall('/contact', {
            method: 'POST',
            body: JSON.stringify(contactData)
        });

        if (result.success) {
            showToast('¡Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto.', 'success');
            form.reset();
            form.classList.remove('was-validated');
        } else {
            showToast(`Error al enviar el mensaje: ${result.error || 'Por favor, inténtalo de nuevo.'}`, 'danger');
        }
    }

    // Restaurar el botón a su estado original
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonText;
}

async function handleRegistrationForm(form) {
    const formData = new FormData();

    // Recopilar datos del formulario
    formData.append('nombre_completo', document.getElementById('fullName').value);
    formData.append('identidad', document.getElementById('identityNumber').value);
    formData.append('telefono', document.getElementById('phone').value);
    formData.append('email', document.getElementById('email').value);
    formData.append('ciudad', document.getElementById('city').value);
    formData.append('grado_academico', document.getElementById('education').value);
    formData.append('transporte_propio', document.querySelector('input[name="transport"]:checked').value);
    formData.append('disponibilidad_rotativos', document.querySelector('input[name="shifts"]:checked').value);
    formData.append('experiencia', document.getElementById('experience').value);

    // Función para convertir Word a PDF (ahora retorna una promesa)
    function convertWordToPdf(wordFile, formData) {
        return new Promise((resolve, reject) => {
            if (!wordFile) {
                reject(new Error('No se proporcionó archivo'));
                return;
            }
            
            if (wordFile.type === 'application/pdf') {
                // Si ya es PDF, no hacemos nada y continuamos
                formData.set('cv_file', wordFile);
                resolve(formData);
                return;
            }

            try {
                // Verificar que las librerías estén cargadas
                if (!window.mammoth) {
                    throw new Error('La librería mammoth no está disponible. Verifica tu conexión a internet. Por favor, sube un archivo PDF en su lugar.');
                }
                if (!window.jspdf) {
                    throw new Error('La librería jsPDF no está disponible. Verifica tu conexión a internet. Por favor, sube un archivo PDF en su lugar.');
                }
                
                const reader = new FileReader();
                reader.onload = async function(e) {
                    try {
                        const arrayBuffer = e.target.result;
                        const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
                        const html = result.value;

                        // Convertir HTML a PDF (usando jsPDF)
                        const { jsPDF } = window.jspdf; // Sintaxis correcta para jsPDF 2.x
                        const pdf = new jsPDF();
                        
                        // Crear contenido simple del HTML
                        const textContent = html.replace(/<[^>]*>/g, ''); // Remover tags HTML
                        const lines = pdf.splitTextToSize(textContent, 170); // Dividir texto en líneas
                        
                        pdf.text(lines, 15, 15);

                        // Convertir el PDF a Blob
                        const pdfBlob = pdf.output('blob');

                        // Crear un nuevo archivo con el Blob
                        const newPdfFile = new File([pdfBlob], "converted.pdf", {
                            type: "application/pdf",
                            lastModified: Date.now()
                        });

                        // Reemplazar el archivo original con el PDF convertido
                        formData.set('cv_file', newPdfFile);
                        
                        resolve(formData);
                    } catch (innerError) {
                        reject(innerError);
                    }
                };
                
                reader.onerror = function() {
                    reject(new Error('Error al leer el archivo'));
                };
                
                reader.readAsArrayBuffer(wordFile);

            } catch (error) {
                reject(error);
            }
        });
    }

    // Función para enviar los datos de registro (separada para manejar la asincronía)
    async function sendRegistrationData(formData) {
        // Adjuntar el archivo del CV (PDF convertido)
        const cvFile = formData.get('cv_file'); // Obtener el archivo del FormData

        // Adjuntar los archivos de identidad (puede ser más de uno)
        const identityFiles = document.getElementById('identity').files;
        for (let i = 0; i < identityFiles.length; i++) {
            formData.append('identidad_files', identityFiles[i]);
        }

        // --- ESTA ES LA IMPLEMENTACIÓN REAL, SIN SIMULACIÓN ---
        const result = await apiCall('/register', {
            method: 'POST',
            body: formData // La función apiCall ahora sabe cómo manejar FormData
        });

        if (result.success) {
            showToast('¡Registro exitoso! Te contactaremos cuando tengamos oportunidades que coincidan con tu perfil.', 'success');
            form.reset();
            form.classList.remove('was-validated');

            setTimeout(() => {
                navigateToPage('page-status');
            }, 3000);
        } else {
            showToast(`Error en el registro: ${result.error || 'Inténtalo de nuevo.'}`, 'danger');
        }
    }

    // Obtener el archivo del CV
    const cvFile = document.getElementById('cv').files[0];

    try {
        // Convertir el archivo Word a PDF (si es necesario) o usar directamente si es PDF
        if (cvFile && (cvFile.type === 'application/msword' || cvFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
            // Es un archivo Word, verificar si las librerías están disponibles
            if (!window.mammoth || !window.jspdf) {
                // Las librerías no están disponibles, mostrar mensaje y detener el proceso
                showToast('Las librerías de conversión no están disponibles. Por favor, convierte tu CV a PDF manualmente y súbelo nuevamente.', 'warning');
                return;
            }
            
            // Es un archivo Word y las librerías están disponibles, proceder con la conversión
            const processedFormData = await convertWordToPdf(cvFile, formData);
            await sendRegistrationData(processedFormData);
        } else {
            // Es PDF o no hay archivo, procesar directamente
            formData.set('cv_file', cvFile);
            await sendRegistrationData(formData);
        }
    } catch (error) {
        console.error('Error durante el procesamiento del archivo:', error);
        showToast(error.message || 'Error al procesar el archivo. Intenta con un archivo PDF.', 'error');
    }
}

// Status Check Form Handler
async function handleStatusCheckSubmit(event) {
    event.preventDefault();
    
    const identityInput = document.getElementById('status-identity');
    const resultsContainer = document.getElementById('status-results-container');
    const identityNumber = identityInput.value.trim().replace(/-/g, '');
    
    if (!identityNumber) {
        resultsContainer.innerHTML = `<div class="alert alert-warning">Por favor, ingresa tu número de identidad.</div>`;
        return;
    }

    resultsContainer.innerHTML = `<div class="card"><div class="card-body text-center py-5"><div class="spinner-custom mx-auto"></div><p class="mt-3 text-muted">Buscando tu perfil...</p></div></div>`;

    const result = await apiCall(`/status/${identityNumber}`);
    
    if (result.success && result.data.status === 'profile_found') {
        // ¡Éxito! Guardamos la identidad en el navegador
        localStorage.setItem('candidateIdentity', identityNumber);
        document.body.classList.add('logged-in'); // Añadimos una clase al body para control global
    } else {
        // Si falla, nos aseguramos de que no haya sesión activa
        localStorage.removeItem('candidateIdentity');
        document.body.classList.remove('logged-in');
    }
    
    renderStatusResults(result); // Renderizamos el perfil o el mensaje de error
}

// Navbar Scroll Effect
function setupNavbarScrollEffect() {
    const navbar = document.getElementById('main-navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Henmir Application Loading...');

    // Setup navbar scroll effect
    setupNavbarScrollEffect();

    // Setup form validation
    setupFormValidation();

    // Setup navigation event listeners
    document.body.addEventListener('click', (event) => {
        const link = event.target.closest('[data-page-target]');
        if (link) {
            event.preventDefault();
            const pageId = link.dataset.pageTarget;
            navigateToPage(pageId);
        }
    });

    // Setup status check form
    const statusForm = document.getElementById('status-check-form');
    if (statusForm) {
        statusForm.addEventListener('submit', handleStatusCheckSubmit);
    }

    // Setup navbar collapse for mobile
    const navToggler = document.querySelector('.navbar-toggler');
    const navCollapse = document.querySelector('.navbar-collapse');
    
    if (navToggler && navCollapse) {
        navToggler.addEventListener('click', function() {
            navCollapse.classList.toggle('show');
        });
        
        navCollapse.addEventListener('click', function(e) {
            if (e.target.classList.contains('nav-link') || e.target.closest('[data-page-target]')) {
                navCollapse.classList.remove('show');
            }
        });
    }

    // Handle initial page load
    const handleInitialLoad = () => {
        try {
            const initialPageId = window.location.hash.substring(3) || 'page-home';
            navigateToPage(initialPageId);
        } catch (error) {
            console.error('Error during initial page load:', error);
            navigateToPage('page-home');
        }
    };

    // Handle hash changes
    window.addEventListener('hashchange', handleInitialLoad);
    
    // Initial load
    handleInitialLoad();

    console.log('Henmir Application Loaded Successfully!');
});

// --- AÑADE ESTE BLOQUE COMPLETO A TU SCRIPT.JS PÚBLICO ---

// Se ejecuta cuando la página carga para ver si ya hay un candidato "logueado"
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
});

function loginCandidate() {
    const identityInput = document.getElementById('identity-input'); // Asegúrate de que tu HTML tenga un input con este ID
    const identity = identityInput.value.trim();
    if (identity) {
        localStorage.setItem('candidateIdentity', identity); // Guarda la identidad en la memoria del navegador
        checkLoginStatus();
        alert('¡Has ingresado! Ahora puedes solicitar postulaciones.');
    }
}

function logoutCandidate() {
    localStorage.removeItem('candidateIdentity'); // Borra la identidad
    checkLoginStatus();
}

function checkLoginStatus() {
    const identity = localStorage.getItem('candidateIdentity');
    const welcomeMessage = document.getElementById('welcome-message');
    const loginForm = document.getElementById('login-form');
    const logoutButton = document.getElementById('logout-button');
    // --- CAMBIO QUIRÚRGICO AQUÍ ---
    // Usamos el ID correcto del contenedor de la página de vacantes
    const vacancyList = document.getElementById('all-vacancies-container'); 

    if (identity) {
        if (welcomeMessage) welcomeMessage.textContent = `Bienvenido(a). Estás ingresado con la identidad: ...${identity.slice(-4)}`;
        if (welcomeMessage) welcomeMessage.style.display = 'block';
        if (loginForm) loginForm.style.display = 'none';
        if (logoutButton) logoutButton.style.display = 'block';
        if(vacancyList) vacancyList.classList.add('logged-in');
    } else {
        if (welcomeMessage) welcomeMessage.style.display = 'none';
        if (loginForm) loginForm.style.display = 'block';
        if (logoutButton) logoutButton.style.display = 'none';
        if(vacancyList) vacancyList.classList.remove('logged-in');
    }
}


function requestApplication(vacancyId) {
    const identity = localStorage.getItem('candidateIdentity');
    if (!identity) {
        alert('Por favor, ingresa tu número de identidad primero para poder postular.');
        return;
    }

    if (!confirm('¿Confirmas que deseas enviar tu solicitud para esta vacante?')) {
        return;
    }

    // --- INICIO DE LA LÓGICA JSONP ---

    // 1. Define un nombre único para la función callback que manejará la respuesta
    const callbackName = 'handleApplicationResponse';

    // 2. Define la función callback en el scope global (window)
    window[callbackName] = function(response) {
        // Esta función será llamada por el script que devuelve el servidor
        alert(response.message || response.error);

        // Limpieza: elimina el script y la función callback global
        delete window[callbackName];
        document.body.removeChild(script);
    };

    // 3. Construye la URL del endpoint JSONP con los parámetros
    const params = new URLSearchParams({
        callback: callbackName,
        identity_number: identity,
        vacancy_id: vacancyId
    });
    const url = `${API_BASE_URL}/request-application-jsonp?${params.toString()}`;

    // 4. Crea una etiqueta <script> y la añade al documento para hacer la petición
    const script = document.createElement('script');
    script.src = url;
    document.body.appendChild(script);

    // Manejo de errores de red (si el script no carga)
    script.onerror = function() {
        alert('Error de red. No se pudo conectar con el servidor para enviar la solicitud.');
        delete window[callbackName];
        document.body.removeChild(script);
    };
}