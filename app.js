// =======================================================
// JAVASCRIPT DEL PORTAL WEB - VERSIÓN FINAL Y COMPLETA
// =======================================================

// --- 1. CONFIGURACIÓN ---
// ¡IMPORTANTE! Esta URL DEBE ser la URL pública de tu servicio de backend en Render.com.
const BACKEND_API_URL = 'https://henmir-api.onrender.com'; 

const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfUIjyERr1AkHtXv5Dm-aIT2JOjCOtJsSfiMzCREs6HFMwUtw/viewform?usp=header'; 
// La API Key de Gemini ahora se maneja en el backend (app.py) para mayor seguridad.
// No es necesaria definirla aquí en el frontend (app.js).

// --- 2. FUNCIÓN CENTRAL PARA LLAMADAS A LA API ---
async function apiCall(endpoint, method = 'GET', data = null) {
    const url = `${BACKEND_API_URL}${endpoint}`;
    const options = {
        method: method,
        headers: { 'Content-Type': 'application/json' },
    };
    // Incluir token de autenticación si está disponible (para rutas protegidas)
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
        options.headers['Authorization'] = `Bearer ${adminToken}`;
    }

    if (data) {
        options.body = JSON.stringify(data);
    }
    try {
        const response = await fetch(url, options);
        const responseData = await response.json();
        if (!response.ok) {
            // Si es un error 401 (No autorizado) y es para admin, forzar logout
            // y el endpoint no es /login (ya que /login puede dar 401 por credenciales incorrectas)
            if (response.status === 401 && endpoint !== '/login') {
                showAlert('Sesión Expirada', 'Tu sesión ha expirado o no tienes permisos. Por favor, inicia sesión de nuevo.', 'warning', () => logout());
            }
            throw new Error(responseData.error || 'Error del servidor');
        }
        return { success: true, data: responseData };
    } catch (error) {
        console.error(`Fallo en la llamada a la API (${endpoint}):`, error);
        return { success: false, error: error.message };
    }
}

// --- 3. LÓGICA DE NAVEGACIÓN Y RENDERIZADO ---
// Hacemos navigateTo una función global para que onclick pueda acceder a ella
window.navigateTo = function(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        window.scrollTo(0, 0); // Desplaza al inicio de la página al navegar

        // Solución para el problema de la sección de Noticias
        if (pageId === 'page-posts-feed') {
            renderPostsFeed(); // Asegura que el feed de posts se cargue cuando se navega a esta página
        }
        // NUEVO: Cargar contenido legal si se navega a la página legal
        if (pageId === 'page-legal') {
            // No recargamos aquí, ya que renderPublicPages lo hace al inicio
            // y renderLegalPage solo muestra lo que ya está en webContent.
            // Si el sitio se carga dinámicamente o si el admin cambia esto, se actualizará al recargar la página principal.
        }
    }
    // Cierra el menú de navegación de Bootstrap en móviles si está abierto
    const navCollapse = document.getElementById('navbarNav');
    if (navCollapse && navCollapse.classList.contains('show')) {
        new bootstrap.Collapse(navCollapse).hide();
    }
}

function showSpinner(container) {
    if (container) container.innerHTML = '<div class="d-flex justify-content-center p-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>';
}

// --- FUNCIONES PARA ALERTAS Y CONFIRMACIONES PERSONALIZADAS ---
/**
 * Muestra un modal de alerta personalizado.
 * @param {string} title - El título del modal.
 * @param {string} message - El mensaje a mostrar.
 * @param {string} type - 'success', 'danger', 'warning', 'info' para el color del encabezado.
 * @param {function} [callback] - Función a ejecutar cuando el modal se cierra.
 */
function showAlert(title, message, type = 'info', callback = null) {
    const modalElement = document.getElementById('customAlertConfirmModal');
    const modal = new bootstrap.Modal(modalElement);
    const modalHeader = document.querySelector('#customAlertConfirmModal .modal-header');
    const modalTitle = document.getElementById('customAlertConfirmModalLabel');
    const modalBody = document.getElementById('customAlertConfirmModalBody');
    const modalFooter = document.getElementById('customAlertConfirmModalFooter');

    // Limpiar clases previas del header y añadir la nueva
    modalHeader.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info', 'text-white', 'text-dark');
    modalHeader.classList.add(`bg-${type}`, type === 'warning' ? 'text-dark' : 'text-white');

    modalTitle.textContent = title;
    modalBody.innerHTML = `<p>${message}</p>`;
    modalFooter.innerHTML = '<button type="button" class="btn btn-primary" data-bs-dismiss="modal">Aceptar</button>';

    if (callback) {
        // Asegurarse de que el callback se ejecuta solo una vez al cerrar el modal
        const handler = () => {
            callback();
            modalElement.removeEventListener('hidden.bs.modal', handler);
        };
        modalElement.addEventListener('hidden.bs.modal', handler);
    }
    modal.show();
}

/**
 * Muestra un modal de confirmación personalizado.
 * @param {string} title - El título del modal.
 * @param {string} message - El mensaje a mostrar.
 * @returns {Promise<boolean>} - Una promesa que resuelve a true si se confirma, false si se cancela.
 */
function showConfirm(title, message) {
    return new Promise((resolve) => {
        const modalElement = document.getElementById('customAlertConfirmModal');
        const modal = new bootstrap.Modal(modalElement);
        const modalHeader = document.querySelector('#customAlertConfirmModal .modal-header');
        const modalTitle = document.getElementById('customAlertConfirmModalLabel');
        const modalBody = document.getElementById('customAlertConfirmModalBody');
        const modalFooter = document.getElementById('customAlertConfirmModalFooter');

        // Estilo de confirmación (típicamente warning o info)
        modalHeader.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info', 'text-white', 'text-dark');
        modalHeader.classList.add('bg-warning', 'text-dark'); // Color para confirmación

        modalTitle.textContent = title;
        modalBody.innerHTML = `<p>${message}</p>`;
        modalFooter.innerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-danger" id="confirmActionBtn">Confirmar</button>
        `;

        const confirmBtn = document.getElementById('confirmActionBtn');
        
        const onConfirm = () => {
            resolve(true);
            modal.hide();
        };

        const onHidden = () => {
            // Si el modal se cierra sin confirmar (ej. click fuera o botón cerrar), resuelve a false
            confirmBtn.removeEventListener('click', onConfirm);
            modalElement.removeEventListener('hidden.bs.modal', onHidden);
            resolve(false); 
        };

        confirmBtn.addEventListener('click', onConfirm);
        modalElement.addEventListener('hidden.bs.modal', onHidden);

        modal.show();
    });
}


// --- RENDERIZADO DE CONTENIDO ---

// Función principal para poblar todas las secciones públicas
let globalWebContent = {}; // Almacenar el contenido web globalmente

function renderPublicPages(publicData) {
    const { vacancies, posts, webContent } = publicData;
    globalWebContent = webContent; // Almacenar para uso en otras funciones

    renderHeroCarousel(webContent);
    renderHomePagePosts(posts);
    renderVacanciesPage(vacancies); 
    renderAboutPage(webContent); 
    renderLegalPage(webContent); // ¡NUEVO! Renderizar contenido legal
}

function renderHeroCarousel(webContent) {
    const heroSection = document.getElementById('hero-section');
    if (!heroSection || !webContent) return;
    
    const defaultHeroImage = 'https://placehold.co/1200x400/0d6efd/ffffff?text=Henmir'; // Imagen de relleno por defecto

    const heroImages = Object.keys(webContent)
        .filter(k => k.startsWith('imagen_hero_'))
        .map(k => webContent[k])
        .filter(url => url); 

    if (heroImages.length > 0) {
        heroSection.style.backgroundImage = `url('${heroImages[0]}')`;
        if (heroImages.length > 1) {
            let currentHeroImage = 0;
            // Limpiar cualquier intervalo previo para evitar múltiples ejecuciones
            if (heroSection.dataset.intervalId) {
                clearInterval(parseInt(heroSection.dataset.intervalId));
            }
            const intervalId = setInterval(() => {
                currentHeroImage = (currentHeroImage + 1) % heroImages.length;
                heroSection.style.backgroundImage = `url('${heroImages[currentHeroImage]}')`;
            }, 7000);
            heroSection.dataset.intervalId = intervalId.toString(); // Guardar el ID del intervalo
        }
    } else {
        heroSection.style.backgroundImage = `url('${defaultHeroImage}')`; // Usar imagen por defecto si no hay ninguna
    }
}

function renderHomePagePosts(posts) {
    const postsContainerHome = document.getElementById('posts-container-home');
    if (!postsContainerHome) return;
    if (posts && posts.length > 0) {
        postsContainerHome.innerHTML = posts.map(p => `
            <div class="col-md-4 mb-4">
                <div class="card h-100 shadow-sm" role="button" onclick="navigateTo('page-posts-feed')">
                    <img src="${p.url_imagen || 'https://via.placeholder.com/400x250.png?text=Henmir'}" class="card-img-top" alt="${p.titulo}" style="height: 200px; object-fit: cover;">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${p.titulo}</h5>
                        <p class="card-text flex-grow-1">${p.contenido ? p.contenido.substring(0, 100) + '...' : ''}</p>
                        <small class="text-muted">${p.created_at}</small>
                    </div>
                </div>
            </div>`).join('');
    } else {
        const recentPostsSection = document.getElementById('recent-posts');
        if(recentPostsSection) recentPostsSection.style.display = 'none';
    }
}

function renderVacanciesPage(vacancies) {
    const vacanciesListContainer = document.getElementById('vacancies-list');
    if (!vacanciesListContainer) return;

    if (vacancies && vacancies.length > 0) {
        vacanciesListContainer.innerHTML = vacancies.map(v => `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card job-card h-100">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title text-primary">${v.puesto}</h5>
                        <h6 class="card-subtitle mb-2 text-muted"><i class="bi bi-building"></i> ${v.empresa || 'Confidencial'}</h6>
                        <p class="card-text mb-1"><i class="bi bi-geo-alt-fill"></i> ${v.ciudad}</p>
                        <p class="card-text text-truncate-3">${v.descripcion ? v.descripcion.substring(0, 150) + '...' : 'Sin descripción.'}</p>
                        <p class="card-text text-truncate-2"><strong>Requisitos:</strong> ${v.requisitos ? v.requisitos.substring(0, 100) + '...' : 'No especificados.'}</p>
                        <button class="btn btn-sm btn-outline-primary mt-auto apply-vacancy-btn">Postular Ahora</button>
                    </div>
                </div>
            </div>`).join('');
        
        // Adjuntar event listeners a los botones "Postular Ahora"
        document.querySelectorAll('.apply-vacancy-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                // Abre el formulario de Google en una nueva pestaña, no en un modal con iframe.
                window.open(GOOGLE_FORM_URL, '_blank');
            });
        });

    } else {
        vacanciesListContainer.innerHTML = '<div class="col-12"><div class="alert alert-info">No hay vacantes activas en este momento.</div></div>';
    }
}

function renderAboutPage(webContent) {
    const misionText = document.getElementById('mision-text');
    const visionText = document.getElementById('vision-text');
    const contactSection = document.getElementById('contact-section'); 

    // Limpiar spinners y mostrar contenido para Misión y Visión
    if (misionText) {
        misionText.innerHTML = ''; // Limpiar el spinner
        misionText.textContent = (webContent && webContent.texto_mision) || 'Contenido de misión no disponible.';
    }
    if (visionText) {
        visionText.innerHTML = ''; // Limpiar el spinner
        visionText.textContent = (webContent && webContent.texto_vision) || 'Contenido de visión no disponible.';
    }

    // Llenar la sección de contacto dinámicamente
    if (contactSection) {
        const direccion = (webContent && webContent.contacto_direccion) || '[Tu Dirección Aquí]';
        const telefono = (webContent && webContent.contacto_telefono) || '[Tu Número de Teléfono Aquí]';
        const email = (webContent && webContent.contacto_email) || '[tu_correo@ejemplo.com]';
        const horario = (webContent && webContent.contacto_horario) || 'No especificado.';

        contactSection.innerHTML = `
            <p>Si tienes preguntas o necesitas más información, no dudes en contactarnos:</p>
            <ul class="list-unstyled">
                <li><i class="bi bi-geo-alt-fill me-2"></i> Dirección: ${direccion}</li>
                <li><i class="bi bi-telephone-fill me-2"></i> Teléfono: ${telefono}</li>
                <li><i class="bi bi-envelope-fill me-2"></i> Correo Electrónico: <a href="mailto:${email}">${email}</a></li>
                <li><i class="bi bi-clock-fill me-2"></i> Horario de Atención: ${horario}</li>
            </ul>
            <p class="text-muted fst-italic">¡Estamos aquí para ayudarte a conectar tu talento con las mejores oportunidades!</p>
        `;
    }
}

// ¡NUEVO! Función para renderizar la página de Términos y Política de Privacidad
function renderLegalPage(webContent) {
    const terminosText = document.getElementById('terminos-condiciones-text');
    const privacidadText = document.getElementById('politica-privacidad-text');

    if (terminosText) {
        terminosText.innerHTML = ''; // Limpiar spinner
        // Usamos innerHTML si queremos que el texto tenga saltos de línea y formateo simple.
        // Convertimos '\n' en '<br>' para saltos de línea si el contenido viene plano.
        terminosText.innerHTML = (webContent && webContent.terminos_condiciones) ? 
            webContent.terminos_condiciones.replace(/\n/g, '<br>') : 
            'Contenido de Términos y Condiciones no disponible.';
    }
    if (privacidadText) {
        privacidadText.innerHTML = ''; // Limpiar spinner
        privacidadText.innerHTML = (webContent && webContent.politica_privacidad) ? 
            webContent.politica_privacidad.replace(/\n/g, '<br>') : 
            'Contenido de Política de Privacidad no disponible.';
    }
}


async function renderPostsFeed() {
    const postsFeedContainer = document.getElementById('posts-feed-container');
    if (!postsFeedContainer) return;
    showSpinner(postsFeedContainer);
    
    const result = await apiCall('/posts'); // Llama a la ruta que obtiene TODOS los posts
    if(result.success && result.data.length > 0) {
        postsFeedContainer.innerHTML = result.data.map(p => `
            <div class="col-md-8 mb-4">
                <div class="card shadow-sm">
                    ${p.url_imagen ? `<img src="${p.url_imagen}" class="card-img-top" alt="${p.titulo}">` : ''}
                    <div class="card-body">
                        <h2 class="card-title">${p.titulo}</h2>
                        <p class="card-text text-muted">Publicado el ${p.created_at}</p>
                        <p class="card-text fs-5" style="white-space: pre-wrap;">${p.contenido}</p>
                    </div>
                </div>
            </div>`).join('');
    } else {
        postsFeedContainer.innerHTML = '<div class="alert alert-info">No hay noticias disponibles.</div>';
    }
}

async function renderCandidateProfile(profileData) {
    const container = document.getElementById('page-candidate-profile');
    if (!container) return;

    if (profileData && profileData.infoBasica) {
        const { infoBasica, postulaciones, entrevistas } = profileData;
        const postulacionesHTML = postulaciones && postulaciones.length > 0 ? postulaciones.map(p => `
            <tr>
                <td>${p.vacanteId || 'N/A'}</td>
                <td><span class="badge bg-info text-dark">${p.estado || 'N/A'}</span></td>
                <td>${p.fechaAplicacion || 'N/A'}</td>
            </tr>`).join('') :
            '<tr><td colspan="3" class="text-center text-muted">No tienes postulaciones registradas.</td></tr>';
        const entrevistasHTML = entrevistas && entrevistas.length > 0 ? entrevistas.map(e => `
            <div class="card bg-light border-primary mb-3"><div class="card-body">
                <h5 class="card-title">Entrevista para: ${e.vacante}</h5>
                <p class="card-text mb-1"><strong>Fecha:</strong> ${e.fechaHora}</p>
                <p class="card-text mb-1"><strong>Empresa:</strong> ${e.empresa}</p>
                <p class="card-text"><strong>Notas:</strong> ${e.observaciones}</p>
            </div></div>`).join('') :
            '<p class="text-muted">No tienes entrevistas programadas.</p>';
        container.innerHTML = `
            <div class="candidate-panel">
                <div class="d-flex justify-content-between align-items-center"><h1 class="mb-1">Bienvenido, ${infoBasica.nombre}</h1><button class="btn btn-sm btn-outline-secondary" onclick="logout()"><i class="bi bi-arrow-left"></i> Volver</button></div>
                <p class="text-muted">Aquí puedes ver el estado de tus procesos de selección.</p><hr>
                <div class="row mb-4"><div class="col-md-6"><p><strong>Identidad:</strong> ${infoBasica.identidad}</p><p><strong>Teléfono:</strong> ${infoBasica.telefono}</p><p><strong>Correo:</strong> ${infoBasica.correo || 'No registrado'}</p></div><div class="col-md-6"><p><strong>Ciudad:</strong> ${infoBasica.ciudad}</p><p><strong>Experiencia Principal:</strong> ${infoBasica.experiencia}</p><p><strong>Grado Académico:</strong> ${infoBasica.gradoAcademico}</p></div></div>
                <h3 class="mt-4">Mis Postulaciones</h3><div class="table-responsive"><table class="table table-hover align-middle"><thead class="table-light"><tr><th>Vacante</th><th>Estado</th><th>Fecha de Aplicación</th></tr></thead><tbody>${postulacionesHTML}</tbody></table></div>
                <h3 class="mt-5">Próximas Entrevistas</h3>${entrevistasHTML}
            </div>`;
    } else {
        // Mensaje de error mejorado
        container.innerHTML = `
            <div class="candidate-panel text-center p-5">
                <i class="bi bi-exclamation-triangle-fill text-danger display-1 mb-3"></i>
                <h2 class="text-danger mb-3">¡Lo Sentimos!</h2>
                <p class="fs-4 text-muted">No pudimos encontrar un perfil de candidato con el número de identidad proporcionado.</p>
                <p class="text-muted">Por favor, verifica el número e intenta de nuevo. Si crees que hay un error, contacta a Henmir.</p>
                <button class="btn btn-primary mt-4" onclick="navigateTo('page-candidate-login')">Volver a Intentar</button>
            </div>`;
    }
}

async function renderAdminDashboard() {
    const container = document.getElementById('page-admin-dashboard');
    if (!container) return;
    container.innerHTML = `
        <div class="admin-panel">
            <h1>Panel de Administración</h1><p>Bienvenido. Selecciona una sección para gestionar.</p>
            <div class="d-grid gap-2 d-md-flex">
                <button class="btn btn-primary" onclick="showAdminContent('vacancies')"><i class="bi bi-card-list"></i> Gestionar Vacantes</button>
                <button class="btn btn-secondary" onclick="showAdminContent('posts')"><i class="bi bi-file-post"></i> Gestionar Noticias y Blog</button>
                <button class="btn btn-info text-white" onclick="showAdminContent('web-content')"><i class="bi bi-gear-fill"></i> Contenido General del Sitio</button>
            </div><hr><div id="admin-content-area" class="mt-4"><p class="text-muted">Selecciona una opción para comenzar.</p></div>
        </div>`;
}

function showAdminContent(section) {
    if (section === 'vacancies') renderAdminVacanciesPanel();
    else if (section === 'posts') renderAdminPostsPanel();
    else if (section === 'web-content') renderAdminWebPanel(); 
}

function renderAdminVacanciesPanel() {
    const container = document.getElementById('admin-content-area');
    container.innerHTML = `
        <div class="card mb-4"><div class="card-header"><h3><i class="bi bi-plus-circle"></i> Crear Nueva Vacante</h3></div>
        <div class="card-body"><form id="create-vacancy-form"><div class="row">
            <div class="col-md-6 mb-3"><label class="form-label">Puesto</label><input type="text" id="puesto" class="form-control" required></div>
            <div class="col-md-6 mb-3"><label class="form-label">Ciudad</label><input type="text" id="ciudad" class="form-control" required></div>
            <div class="col-md-6 mb-3"><label class="form-label">Empresa</label><input type="text" id="empresa" class="form-control"></div>
            <div class="col-md-6 mb-3"><label class="form-label">Salario</label><input type="text" id="salario" class="form-control"></div>
            <div class="col-12 mb-3"><label class="form-label">Descripción</label><textarea id="descripcion" class="form-control"></textarea></div>
            <div class="col-12 mb-3"><label class="form-label">Requisitos</label><textarea id="requisitos" class="form-control"></textarea></div>
        </div><button type="submit" class="btn btn-success">Guardar Vacante</button></form></div></div>
        <h3>Vacantes en el Sistema</h3><div class="table-responsive"><table class="table table-striped table-hover"><thead class="table-light"><tr><th>Puesto</th><th>Empresa</th><th>Ciudad</th><th>Estado</th><th>Acciones</th></tr></thead><tbody id="admin-vacancies-list"></tbody></table></div>`;
    document.getElementById('create-vacancy-form').addEventListener('submit', handleCreateVacancy);
    fetchAndRenderAdminVacancies();
}

async function fetchAndRenderAdminVacancies() {
    const listContainer = document.getElementById('admin-vacancies-list');
    listContainer.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner-border spinner-border-sm"></div></td></tr>';
    const result = await apiCall('/vacancies');
    if (result.success && Array.isArray(result.data)) {
        listContainer.innerHTML = result.data.length === 0 ? '<tr><td colspan="5" class="text-center text-muted">No hay vacantes creadas.</td></tr>' : result.data.map(v => `
            <tr><td>${v.puesto}</td><td>${v.empresa}</td><td>${v.ciudad}</td>
            <td><span class="badge bg-${v.estado === 'activa' ? 'success' : 'secondary'}">${v.estado}</span></td>
            <td><button class="btn btn-sm btn-danger delete-vacancy-btn" data-vacancy-id="${v.vacancy_id}"><i class="bi bi-trash"></i></button></td></tr>`).join('');
        
        // Adjuntar event listeners para los botones de eliminar dinámicamente
        document.querySelectorAll('.delete-vacancy-btn').forEach(button => {
            button.addEventListener('click', (e) => handleDeleteVacancy(e.currentTarget.dataset.vacancyId));
        });

    } else {
        listContainer.innerHTML = `<tr><td colspan="5" class="text-center text-danger">${result.error}</td></tr>`;
    }
}

function renderAdminPostsPanel() {
    const container = document.getElementById('admin-content-area');
    container.innerHTML = `
        <div class="card mb-4"><div class="card-header"><h3><i class="bi bi-plus-circle"></i> Crear Nuevo Post</h3></div>
        <div class="card-body"><form id="create-post-form">
            <div class="mb-3"><label class="form-label">Título</label><input type="text" id="post-titulo" class="form-control" required></div>
            <div class="mb-3"><label class="form-label">URL de Imagen (Para portadas de noticias)</label><input type="text" id="post-imagen" class="form-control" placeholder="https://ejemplo.com/imagen.jpg"></div>
            <div class="mb-3"><label class="form-label">Contenido del Post (Soporta saltos de línea)</label><textarea id="post-contenido" class="form-control" rows="5"></textarea></div>
            <button type="submit" class="btn btn-success">Guardar Post</button>
        </form></div></div>
        <h3>Posts en el Sistema</h3><div class="table-responsive"><table class="table table-striped table-hover"><thead class="table-light"><tr><th>Título</th><th>Fecha</th><th>Acciones</th></tr></thead><tbody id="admin-posts-list"></tbody></table></div>`;
    document.getElementById('create-post-form').addEventListener('submit', handleCreatePost);
    fetchAndRenderAdminPosts();
}

async function fetchAndRenderAdminPosts() {
    const listContainer = document.getElementById('admin-posts-list');
    listContainer.innerHTML = '<tr><td colspan="3" class="text-center"><div class="spinner-border spinner-border-sm"></div></td></tr>';
    const result = await apiCall('/posts');
    if (result.success && Array.isArray(result.data)) {
        listContainer.innerHTML = result.data.length === 0 ? '<tr><td colspan="3" class="text-center text-muted">No hay posts creados.</td></tr>' : result.data.map(p => `
            <tr><td>${p.titulo}</td><td>${p.created_at}</td><td><button class="btn btn-sm btn-danger delete-post-btn" data-post-id="${p.post_id}"><i class="bi bi-trash"></i></button></td></tr>`).join('');
        
        // Adjuntar event listeners para los botones de eliminar dinámicamente
        document.querySelectorAll('.delete-post-btn').forEach(button => {
            button.addEventListener('click', (e) => handleDeletePost(e.currentTarget.dataset.postId));
        });
    } else {
        listContainer.innerHTML = `<tr><td colspan="3" class="text-center text-danger">${result.error}</td></tr>`;
    }
}

// Panel de Administración de Contenido Web
async function renderAdminWebPanel() {
    const container = document.getElementById('admin-content-area');
    showSpinner(container); 

    // Usar el contenido web que ya se cargó globalmente al inicio
    let webContent = globalWebContent; 

    container.innerHTML = `
        <div class="card mb-4"><div class="card-header"><h3><i class="bi bi-gear-fill"></i> Editar Contenido Principal del Sitio</h3></div>
        <div class="card-body"><form id="update-web-content-form">
            <h4>Sección "Sobre Nosotros"</h4>
            <div class="mb-3"><label class="form-label">Texto de Nuestra Misión</label><textarea id="web-mision" class="form-control" rows="3">${webContent.texto_mision || ''}</textarea></div>
            <div class="mb-3"><label class="form-label">Texto de Nuestra Visión</label><textarea id="web-vision" class="form-control" rows="3">${webContent.texto_vision || ''}</textarea></div>
            
            <h4 class="mt-4">Carrusel de Imágenes Principales (Hero Section)</h4>
            <p class="text-muted">Introduce URLs de imágenes de alta resolución. Se mostrarán secuencialmente.</p>
            <div class="mb-3"><label class="form-label">URL de Imagen Hero #1</label><input type="text" id="web-hero-img-1" class="form-control" value="${webContent.imagen_hero_1 || ''}" placeholder="https://ejemplo.com/imagen1.jpg"></div>
            <div class="mb-3"><label class="form-label">URL de Imagen Hero #2</label><input type="text" id="web-hero-img-2" class="form-control" value="${webContent.imagen_hero_2 || ''}" placeholder="https://ejemplo.com/imagen2.jpg"></div>
            
            <h4 class="mt-4">Información de Contacto</h4>
            <div class="mb-3"><label class="form-label">Dirección Física</label><input type="text" id="web-contacto-direccion" class="form-control" value="${webContent.contacto_direccion || ''}" placeholder="Ej: Blvd. Morazán, Tegucigalpa"></div>
            <div class="mb-3"><label class="form-label">Número de Teléfono</label><input type="text" id="web-contacto-telefono" class="form-control" value="${webContent.contacto_telefono || ''}" placeholder="Ej: +504 22XX-XXXX"></div>
            <div class="mb-3"><label class="form-label">Correo Electrónico de Contacto</label><input type="email" id="web-contacto-email" class="form-control" value="${webContent.contacto_email || ''}" placeholder="Ej: info@henmir.com"></div>
            <div class="mb-3"><label class="form-label">Horario de Atención</label><input type="text" id="web-contacto-horario" class="form-control" value="${webContent.contacto_horario || ''}" placeholder="Ej: Lunes a Viernes, 8:00 AM - 5:00 PM"></div>

            <h4 class="mt-4">Páginas Legales</h4>
            <div class="mb-3"><label class="form-label">Contenido de Términos y Condiciones</label><textarea id="web-terminos-condiciones" class="form-control" rows="7">${webContent.terminos_condiciones || ''}</textarea></div>
            <div class="mb-3"><label class="form-label">Contenido de Política de Privacidad</label><textarea id="web-politica-privacidad" class="form-control" rows="7">${webContent.politica_privacidad || ''}</textarea></div>

            <button type="submit" class="btn btn-success">Guardar Cambios del Sitio</button>
        </form></div></div>`;
    
    document.getElementById('update-web-content-form').addEventListener('submit', handleUpdateWebContent);
}

async function handleUpdateWebContent(event) {
    event.preventDefault();
    const updates = [
        { key: 'texto_mision', value: document.getElementById('web-mision').value },
        { key: 'texto_vision', value: document.getElementById('web-vision').value },
        { key: 'imagen_hero_1', value: document.getElementById('web-hero-img-1').value },
        { key: 'imagen_hero_2', value: document.getElementById('web-hero-img-2').value },
        { key: 'contacto_direccion', value: document.getElementById('web-contacto-direccion').value },
        { key: 'contacto_telefono', value: document.getElementById('web-contacto-telefono').value },
        { key: 'contacto_email', value: document.getElementById('web-contacto-email').value },
        { key: 'contacto_horario', value: document.getElementById('web-contacto-horario').value },
        { key: 'terminos_condiciones', value: document.getElementById('web-terminos-condiciones').value }, // ¡NUEVO CAMPO!
        { key: 'politica_privacidad', value: document.getElementById('web-politica-privacidad').value } // ¡NUEVO CAMPO!
    ].filter(item => item.value !== null && item.value !== undefined); 

    const result = await apiCall('/web-config', 'POST', { updates: updates });
    if(result.success) {
        showAlert('Éxito', 'Contenido web actualizado con éxito. Refrescando página...', 'success', () => {
            window.location.reload(); 
        });
    } else { 
        showAlert('Error', `Error al actualizar el contenido web: ${result.error}`, 'danger'); 
    }
}


async function handleCandidateLogin(event) {
    event.preventDefault(); // ¡PREVENIR LA RECARGA DE LA PÁGINA!
    const statusDiv = document.getElementById('candidate-login-status');
    statusDiv.innerHTML = '<div class="d-flex align-items-center"><div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div><span>Buscando perfil...</span></div>';
    
    const identity = document.getElementById('candidate-identity').value.trim();
    if (!identity) {
        statusDiv.innerHTML = '<div class="alert alert-warning p-2">Por favor, ingresa un número de identidad.</div>';
        return;
    }

    // Navegar y renderizar el perfil solo DESPUÉS de obtener los datos
    const result = await apiCall(`/profile/${identity}`);
    statusDiv.innerHTML = ''; // Limpiar spinner o mensaje de búsqueda
    
    if (result.success) {
        navigateTo('page-candidate-profile');
        renderCandidateProfile(result.data); // Pasar directamente los datos del perfil
    } else {
        // Si hay un error (ej. 404 No encontrado), navegar a la página de perfil con un mensaje de error claro
        navigateTo('page-candidate-profile'); 
        renderCandidateProfile(null); // Pasar null para que renderCandidateProfile muestre el error adecuado
    }
}

async function handleAdminLogin(event) {
    event.preventDefault();
    const statusDiv = document.getElementById('admin-login-status');
    statusDiv.innerHTML = '<div class="spinner-border spinner-border-sm"></div>';
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const result = await apiCall('/login', 'POST', { email, password });
    if (result.success) {
        // Almacenar el token JWT recibido del backend
        localStorage.setItem('isAdminLoggedIn', 'true');
        localStorage.setItem('adminName', result.data.admin.nombre);
        if (result.data.token) { // Asumimos que el backend devuelve un token
            localStorage.setItem('adminToken', result.data.token);
        }
        // Navegar y renderizar el dashboard sin recargar la página
        navigateTo('page-admin-dashboard');
        renderAdminDashboard();
        // Actualizar la sección de autenticación en el header
        updateAuthSection();
    } else {
        statusDiv.innerHTML = `<div class="alert alert-danger p-2">${result.error}</div>`;
    }
}

async function handleCreateVacancy(event) {
    event.preventDefault();
    const newVacancy = {
        puesto: document.getElementById('puesto').value,
        ciudad: document.getElementById('ciudad').value,
        empresa: document.getElementById('empresa').value,
        salario: document.getElementById('salario').value,
        descripcion: document.getElementById('descripcion').value,
        requisitos: document.getElementById('requisitos').value,
    };
    const result = await apiCall('/vacancies', 'POST', newVacancy);
    if(result.success) {
        showAlert('Éxito', 'Vacante creada con éxito.', 'success');
        document.getElementById('create-vacancy-form').reset();
        fetchAndRenderAdminVacancies();
        // También actualizar la lista de vacantes en la página pública
        const publicDataResult = await apiCall('/public-data');
        if (publicDataResult.success) {
            renderVacanciesPage(publicDataResult.data.vacancies);
        }
    } else { 
        showAlert('Error', `Error: ${result.error}`, 'danger'); 
    }
}

async function handleDeleteVacancy(vacancyId) {
    const confirmed = await showConfirm('Confirmar Eliminación', '¿Estás seguro de que quieres eliminar esta vacante? Esta acción no se puede deshacer.');
    if (confirmed) {
        const result = await apiCall(`/vacancies/${vacancyId}`, 'DELETE');
        if (result.success) { 
            showAlert('Eliminada', 'Vacante eliminada con éxito.', 'info'); 
            fetchAndRenderAdminVacancies(); 
            // También actualizar la lista de vacantes en la página pública
            const publicDataResult = await apiCall('/public-data');
            if (publicDataResult.success) {
                renderVacanciesPage(publicDataResult.data.vacancies);
            }
        }
        else { showAlert('Error', `Error al eliminar: ${result.error}`, 'danger'); }
    }
}

async function handleCreatePost(event) {
    event.preventDefault();
    const newPost = {
        titulo: document.getElementById('post-titulo').value,
        url_imagen: document.getElementById('post-imagen').value,
        contenido: document.getElementById('post-contenido').value,
    };
    const result = await apiCall('/posts', 'POST', newPost);
    if(result.success) {
        showAlert('Éxito', 'Post creado con éxito.', 'success');
        document.getElementById('create-post-form').reset();
        fetchAndRenderAdminPosts();
        // También actualizar la lista de posts en la página pública y home
        const publicDataResult = await apiCall('/public-data');
        if (publicDataResult.success) {
            renderHomePagePosts(publicDataResult.data.posts);
            // renderPostsFeed(publicDataResult.data.posts); // No es necesario aquí, navigateTo lo llamará.
        }
    } else { showAlert('Error', `Error: ${result.error}`, 'danger'); }
}

async function handleDeletePost(postId) {
    const confirmed = await showConfirm('Confirmar Eliminación', '¿Estás seguro de que quieres eliminar este post? Esta acción no se puede deshacer.');
    if (confirmed) {
        const result = await apiCall(`/posts/${postId}`, 'DELETE');
        if (result.success) { 
            showAlert('Eliminado', 'Post eliminado con éxito.', 'info'); 
            fetchAndRenderAdminPosts(); 
            // También actualizar la lista de posts en la página pública y home
            const publicDataResult = await apiCall('/public-data');
            if (publicDataResult.success) {
                renderHomePagePosts(publicDataResult.data.posts);
                // renderPostsFeed(publicDataResult.data.posts); // No es necesario aquí.
            }
        }
        else { showAlert('Error', `Error al eliminar: ${result.error}`, 'danger'); }
    }
}

// Hacemos logout una función global para que onclick pueda acceder a ella
window.logout = function() {
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('adminName');
    localStorage.removeItem('adminToken'); // Eliminar también el token JWT
    window.location.reload(); // Recargar la página para limpiar el estado
}

// --- FUNCIONALIDAD DE CHAT CON GEMINI (AHORA CON PROXY EN BACKEND) ---
const chatModalElement = document.getElementById('chatModal');
const chatModal = new bootstrap.Modal(chatModalElement);
const chatInput = document.getElementById('chatInput');
const sendChatButton = document.getElementById('sendChatButton');
const chatMessagesContainer = document.getElementById('chatMessages');

// Historial del chat para Gemini (el primer mensaje es la "personalidad" del bot)
// Este historial se envía en cada petición para mantener el contexto de la conversación.
let chatHistory = [{
    role: "user", 
    parts: [{ text: "Eres un asistente de la agencia de empleos Henmir. Proporciona información concisa y útil sobre nuestros servicios, vacantes, cómo postularse, nuestra misión, visión y cualquier otra pregunta relacionada con la agencia. Responde de manera amigable y profesional. Si te preguntan algo fuera de tus conocimientos, menciona que solo puedes ayudar con temas relacionados con Henmir." }]
}];

function addMessageToChat(message, isUser = true) {
    const messageClass = isUser ? 'justify-content-end' : 'justify-content-start';
    const bubbleClass = isUser ? 'bg-primary text-white' : 'bg-info-subtle text-dark';
    const messageHtml = `
        <div class="d-flex flex-row ${messageClass} mb-2">
            <div class="p-3 ${bubbleClass} rounded-3 shadow-sm" style="max-width: 75%;">
                ${message}
            </div>
        </div>
    `;
    chatMessagesContainer.insertAdjacentHTML('beforeend', messageHtml);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight; // Desplazar al final
}

async function sendMessageToGemini() {
    const userMessage = chatInput.value.trim();
    if (!userMessage) return;

    addMessageToChat(userMessage, true);
    chatInput.value = '';

    // Añadir mensaje de carga
    const loadingMessageId = 'loading-gemini-response';
    chatMessagesContainer.insertAdjacentHTML('beforeend', `
        <div class="d-flex flex-row justify-content-start mb-2" id="${loadingMessageId}">
            <div class="p-3 bg-info-subtle text-dark rounded-3 shadow-sm" style="max-width: 75%;">
                <div class="spinner-border spinner-border-sm" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
            </div>
        </div>
    `);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

    // Añadir el mensaje del usuario al historial para enviarlo al backend
    chatHistory.push({ role: "user", parts: [{ text: userMessage }] });

    try {
        // Enviar el historial completo al backend proxy
        const response = await fetch(`${BACKEND_API_URL}/chat/gemini`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: chatHistory }) // Enviar el historial como parte del cuerpo
        });

        const result = await response.json();

        // Eliminar mensaje de carga
        const loadingDiv = document.getElementById(loadingMessageId);
        if (loadingDiv) loadingDiv.remove();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const botResponse = result.candidates[0].content.parts[0].text;
            addMessageToChat(botResponse, false);
            // Añadir la respuesta del bot al historial para futuras interacciones
            chatHistory.push({ role: "model", parts: [{ text: botResponse }] });
        } else {
            addMessageToChat("Lo siento, no pude obtener una respuesta en este momento. Intenta de nuevo más tarde.", false);
            console.error("Respuesta inesperada de Gemini (desde backend):", result);
        }
    } catch (error) {
        // Eliminar mensaje de carga
        const loadingDiv = document.getElementById(loadingMessageId);
        if (loadingDiv) loadingDiv.remove();
        addMessageToChat("Hubo un error al comunicarse con el asistente. Por favor, inténtalo de nuevo.", false);
        console.error("Error al llamar al proxy de Gemini en el backend:", error);
    }
}

// Función para actualizar la sección de autenticación en el header
function updateAuthSection() {
    const isAdmin = localStorage.getItem('isAdminLoggedIn') === 'true';
    const authContainer = document.getElementById('auth-section');

    if (isAdmin) {
        const adminName = localStorage.getItem('adminName') || 'Administrador';
        authContainer.innerHTML = `
            <span class="navbar-text me-3">Hola, ${adminName}</span>
            <button class="btn btn-outline-danger" onclick="logout()">Cerrar Sesión</button>`;
    } else {
        authContainer.innerHTML = `<button class="btn btn-outline-primary" onclick="navigateTo('page-login-selection')">Iniciar Sesión / Consultar Perfil</button>`;
    }
}


// --- 5. INICIALIZACIÓN DE LA APLICACIÓN ---
document.addEventListener('DOMContentLoaded', async () => {
    // Adjuntar listeners para el chat
    const chatFloatingButton = document.getElementById('chatFloatingButton');
    if (chatFloatingButton) {
        chatFloatingButton.addEventListener('click', () => {
            chatModal.show();
        });
    }
    if (sendChatButton) {
        sendChatButton.addEventListener('click', sendMessageToGemini);
    }
    if (chatInput) {
        chatInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                sendMessageToGemini();
            }
        });
    }

    updateAuthSection(); // Inicializar la sección de autenticación

    const isAdmin = localStorage.getItem('isAdminLoggedIn') === 'true';
    
    if (isAdmin) {
        navigateTo('page-admin-dashboard');
        renderAdminDashboard();
    } else {
        // Cargar datos públicos solo si no es admin
        const publicDataResult = await apiCall('/public-data');
        if (publicDataResult.success) {
            renderPublicPages(publicDataResult.data);
        } else {
            showAlert('Error de Carga', 'No se pudieron cargar los datos iniciales del portal. Intenta de nuevo más tarde.', 'danger');
            console.error('Error al cargar datos públicos iniciales:', publicDataResult.error);
        }
        navigateTo('page-home');
    }

    // Asegurarse de que los event listeners de formularios siempre estén adjuntos
    document.getElementById('candidate-login-form')?.addEventListener('submit', handleCandidateLogin);
    document.getElementById('admin-login-form')?.addEventListener('submit', handleAdminLogin);

    // --- Limpiar el backdrop del modal de postulación ---
    // Este código ahora se asegura de que no haya un modal-backdrop flotando
    // Si bien GOOGLE_FORM_URL ahora abre en nueva pestaña,
    // este listener es una buena práctica general para cualquier modal en tu app.
    const cvModalElement = document.getElementById('cvModal');
    if (cvModalElement) {
        cvModalElement.addEventListener('hidden.bs.modal', function () {
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => backdrop.remove());
            document.body.classList.remove('modal-open');
            document.body.style.overflow = ''; 
            document.body.style.paddingRight = ''; 
        });
    }
});
