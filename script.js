// Global Configuration
//const API_BASE_URL = 'http://34.68.183.117.nip.io/public-api';
const API_BASE_URL = 'https://34.68.183.117.sslip.io/public-api/vacancies'
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

// Static Posts Data (easy to modify without backend changes)
function getStaticPosts() {
    return [
        {
            id: 1,
            title: "Cómo Preparar una Entrevista de Trabajo Exitosa",
            excerpt: "Consejos esenciales para destacar en tu próxima entrevista laboral y conseguir el trabajo de tus sueños.",
            content: `
                <h4>Preparación antes de la entrevista</h4>
                <p>La preparación es clave para el éxito en cualquier entrevista. Investiga sobre la empresa, sus valores y la posición específica.</p>
                <h5>Pasos importantes:</h5>
                <ul>
                    <li>Investiga la empresa y el puesto</li>
                    <li>Prepara respuestas para preguntas comunes</li>
                    <li>Practica tu presentación personal</li>
                    <li>Prepara preguntas inteligentes sobre la empresa</li>
                    <li>Planifica tu vestimenta profesional</li>
                </ul>
                <p>Recuerda: una buena preparación te dará la confianza necesaria para brillar en la entrevista.</p>
            `,
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
            date: "2024-08-15",
            author: "Equipo Henmir"
        },
        {
            id: 2,
            title: "Las Habilidades Más Demandadas en 2024",
            excerpt: "Descubre cuáles son las competencias que los empleadores valoran más en el mercado laboral actual.",
            content: `
                <h4>Habilidades Técnicas</h4>
                <ul>
                    <li>Competencias digitales básicas</li>
                    <li>Manejo de herramientas de productividad</li>
                    <li>Análisis de datos básico</li>
                    <li>Marketing digital</li>
                </ul>
                <h4>Habilidades Blandas</h4>
                <ul>
                    <li>Comunicación efectiva</li>
                    <li>Trabajo en equipo</li>
                    <li>Adaptabilidad</li>
                    <li>Liderazgo</li>
                    <li>Pensamiento crítico</li>
                </ul>
                <p>El futuro del trabajo requiere una combinación equilibrada de habilidades técnicas y blandas.</p>
            `,
            image: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=400&auto=format&fit=crop",
            date: "2024-08-10",
            author: "Ana García"
        },
        {
            id: 3,
            title: "Cómo Crear un CV Que Destaque",
            excerpt: "Tips profesionales para diseñar un curriculum vitae que capture la atención de los reclutadores.",
            content: `
                <h4>Estructura de un CV efectivo</h4>
                <ol>
                    <li><strong>Datos personales:</strong> Información de contacto actualizada</li>
                    <li><strong>Perfil profesional:</strong> Un resumen impactante de 2-3 líneas</li>
                    <li><strong>Experiencia laboral:</strong> Logros cuantificables y relevantes</li>
                    <li><strong>Educación:</strong> Títulos y certificaciones importantes</li>
                    <li><strong>Habilidades:</strong> Competencias clave para el puesto</li>
                </ol>
                <h4>Consejos importantes</h4>
                <ul>
                    <li>Mantén el CV en máximo 2 páginas</li>
                    <li>Usa un diseño limpio y profesional</li>
                    <li>Adapta el contenido para cada aplicación</li>
                    <li>Revisa la ortografía y gramática</li>
                </ul>
            `,
            image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=400&auto=format&fit=crop",
            date: "2024-08-05",
            author: "Carlos López"
        }
    ];
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
    
    container.innerHTML = displayVacancies.map((vacancy, index) => `
        <div class="col-lg-4 col-md-6">
            <div class="card job-card h-100 fade-in" style="animation-delay: ${index * 0.1}s">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex align-items-start mb-3">
                        <div class="job-icon me-3">
                            <i class="bi bi-briefcase"></i>
                        </div>
                        <div class="flex-grow-1">
                            <h5 class="card-title mb-1">${vacancy.puesto || vacancy.cargo_solicitado || 'Puesto no especificado'}</h5>
                            <div class="d-flex align-items-center text-muted small mb-2">
                                <i class="bi bi-geo-alt me-1"></i>
                                <span>${vacancy.ciudad || vacancy.ubicacion || 'No especificada'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <p class="card-text text-muted small flex-grow-1">
                        ${(vacancy.requisitos || vacancy.descripcion || 'Requisitos no detallados.').substring(0, 120)}...
                    </p>
                    
                    <div class="d-flex flex-wrap gap-2 mb-3">
                        ${vacancy.tipo_empleo ? `<span class="badge badge-custom">${vacancy.tipo_empleo}</span>` : ''}
                        ${vacancy.salario ? `<span class="badge badge-custom">${vacancy.salario}</span>` : ''}
                    </div>
                    
                    <button class="btn btn-primary w-100 mt-auto" onclick="showJobDetails(${JSON.stringify(vacancy).replace(/"/g, '&quot;')})">
                        <i class="bi bi-eye me-2"></i>Ver Detalles
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderPosts(posts, container, limit = null) {
    const displayPosts = limit ? posts.slice(0, limit) : posts;
    
    container.innerHTML = displayPosts.map((post, index) => `
        <div class="col-lg-4 col-md-6">
            <div class="card h-100 fade-in" style="animation-delay: ${index * 0.1}s">
                <img src="${post.image}" class="card-img-top" alt="${post.title}" style="height: 200px; object-fit: cover;">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${post.title}</h5>
                    <p class="card-text text-muted small flex-grow-1">${post.excerpt}</p>
                    <div class="d-flex justify-content-between align-items-center mt-auto pt-3">
                        <small class="text-muted">
                            <i class="bi bi-calendar me-1"></i>
                            ${formatDate(post.date)}
                        </small>
                        <button class="btn btn-outline-primary btn-sm" onclick="showPostDetails(${post.id})">
                            Leer más
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderStatusResults(result) {
    const container = document.getElementById('status-results-container');
    
    if (!result.success) {
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-circle me-2"></i>
                <strong>Error:</strong> ${result.error}
            </div>
        `;
        return;
    }

    const data = result.data;
    
    if (data.status === 'not_registered') {
        container.innerHTML = `
            <div class="card">
                <div class="card-body text-center py-5">
                    <div class="job-icon mx-auto mb-3" style="background-color: var(--warning); color: white;">
                        <i class="bi bi-person-x"></i>
                    </div>
                    <h4 class="text-warning mb-3">Candidato No Encontrado</h4>
                    <p class="text-muted mb-4">No encontramos tu perfil en nuestra base de datos. Verifica tu número de identidad o regístrate con nosotros.</p>
                    <a href="#" class="btn btn-primary" data-page-target="page-register">
                        <i class="bi bi-person-plus me-2"></i>Registrarme Ahora
                    </a>
                </div>
            </div>
        `;
    } else if (data.status === 'registered_no_applications') {
        container.innerHTML = `
            <div class="card">
                <div class="card-body text-center py-5">
                    <div class="job-icon mx-auto mb-3" style="background-color: var(--primary); color: white;">
                        <i class="bi bi-person-check"></i>
                    </div>
                    <h4 class="text-primary mb-3">¡Hola, ${data.candidate_name}!</h4>
                    <p class="text-muted mb-4">Tu perfil está registrado correctamente, pero aún no tienes postulaciones activas.</p>
                    <a href="#" class="btn btn-primary" data-page-target="page-vacancies">
                        <i class="bi bi-search me-2"></i>Explorar Vacantes
                    </a>
                </div>
            </div>
        `;
    } else if (data.status === 'has_applications') {
        const applicationsHtml = data.applications.map(app => {
            let badgeClass = 'bg-secondary';
            let badgeIcon = 'clock';
            
            if (['En Entrevista', 'Pre-seleccionado'].includes(app.estado)) {
                badgeClass = 'bg-info';
                badgeIcon = 'person-video2';
            } else if (app.estado === 'Oferta') {
                badgeClass = 'bg-warning text-dark';
                badgeIcon = 'envelope-check';
            } else if (app.estado === 'Contratado') {
                badgeClass = 'bg-success';
                badgeIcon = 'check-circle';
            } else if (app.estado === 'Rechazado') {
                badgeClass = 'bg-danger';
                badgeIcon = 'x-circle';
            }

            return `
                <div class="card mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="card-title mb-0">${app.cargo_solicitado}</h6>
                            <span class="badge ${badgeClass}">
                                <i class="bi bi-${badgeIcon} me-1"></i>
                                ${app.estado}
                            </span>
                        </div>
                        <p class="text-muted small mb-2">
                            <i class="bi bi-calendar me-1"></i>
                            Aplicado: ${formatDate(app.fecha_aplicacion)}
                        </p>
                        ${app.fecha_entrevista ? `
                            <div class="alert alert-info py-2 mb-0">
                                <i class="bi bi-calendar-event me-2"></i>
                                <strong>Entrevista programada:</strong> ${formatDate(app.fecha_entrevista)}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">
                        <i class="bi bi-person-circle me-2"></i>
                        Hola, ${data.candidate_name}
                    </h5>
                </div>
                <div class="card-body">
                    <p class="text-muted mb-4">Este es el estado actual de tus procesos de selección:</p>
                    ${applicationsHtml}
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
                ${vacancy.tipo_empleo ? `
                    <div class="mb-3">
                        <strong>Tipo de empleo:</strong>
                        <span class="ms-2">${vacancy.tipo_empleo}</span>
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

    new bootstrap.Modal(modal).show();
}

function showPostDetails(postId) {
    const posts = getStaticPosts();
    const post = posts.find(p => p.id === postId);
    
    if (!post) return;

    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${post.title}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <img src="${post.image}" class="img-fluid rounded mb-4" alt="${post.title}">
                    <div class="d-flex justify-content-between text-muted small mb-4">
                        <span><i class="bi bi-person me-1"></i>Por ${post.author}</span>
                        <span><i class="bi bi-calendar me-1"></i>${formatDate(post.date)}</span>
                    </div>
                    ${post.content}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" data-bs-dismiss="modal">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();

    modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
    });
}

function acceptTerms() {
    const checkbox = document.getElementById('terms-agreement');
    if (checkbox) {
        checkbox.checked = true;
    }
}

function applyToJob() {
    showToast('Para aplicar a esta vacante, necesitas estar registrado en nuestro sistema.', 'info');
    setTimeout(() => {
        navigateToPage('page-register');
        bootstrap.Modal.getInstance(document.getElementById('jobModal')).hide();
    }, 2000);
}

// Navigation Functions
function navigateToPage(targetPageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(targetPageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // Update navbar active state
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.pageTarget === targetPageId) {
            link.classList.add('active');
        }
    });

    // Update URL hash
    window.location.hash = `#!/${targetPageId}`;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Load page-specific data
    if (targetPageId === 'page-home') {
        loadHomePage();
    } else if (targetPageId === 'page-vacancies') {
        loadVacanciesPage();
    } else if (targetPageId === 'page-posts') {
        loadPostsPage();
    }
}

// Page Loading Functions
async function loadHomePage() {
    const featuredContainer = document.getElementById('featured-vacancies-container');
    const postsContainer = document.getElementById('featured-posts-container');

    // Load featured vacancies
    const vacanciesResult = await loadVacancies();
    if (vacanciesResult.success) {
        renderVacancies(vacanciesResult.data, featuredContainer, 3);
    } else {
        featuredContainer.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    No se pudieron cargar las vacantes: ${vacanciesResult.error}
                </div>
            </div>
        `;
    }

    // Load featured posts
    renderPosts(getStaticPosts(), postsContainer, 3);
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

function loadPostsPage() {
    const container = document.getElementById('all-posts-container');
    renderPosts(getStaticPosts(), container);
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

// REEMPLAZA LA FUNCIÓN handleFormSubmission COMPLETA CON ESTA VERSIÓN
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

        const result = await apiCall('/public-api/contact', {
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

    // Adjuntar el archivo del CV
    const cvFile = document.getElementById('cv').files[0];
    if (cvFile) {
        formData.append('cv_file', cvFile);
    }
    
    // Adjuntar los archivos de identidad (puede ser más de uno)
    const identityFiles = document.getElementById('identity').files;
    for (let i = 0; i < identityFiles.length; i++) {
        formData.append('identidad_files', identityFiles[i]);
    }

    // --- ESTA ES LA IMPLEMENTACIÓN REAL, SIN SIMULACIÓN ---
    const result = await apiCall('/public-api/register', {
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

// Status Check Form Handler
async function handleStatusCheckSubmit(event) {
    event.preventDefault();
    
    const identityInput = document.getElementById('status-identity');
    const resultsContainer = document.getElementById('status-results-container');
    const identityNumber = identityInput.value.trim().replace(/-/g, '');
    
    if (!identityNumber) {
        resultsContainer.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Por favor, ingresa tu número de identidad.
            </div>
        `;
        return;
    }

    // Show loading state
    resultsContainer.innerHTML = `
        <div class="card">
            <div class="card-body text-center py-5">
                <div class="spinner-custom mx-auto"></div>
                <p class="mt-3 text-muted">Consultando tu estado...</p>
            </div>
        </div>
    `;

    const result = await apiCall(`/status/${identityNumber}`);
    renderStatusResults(result);
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