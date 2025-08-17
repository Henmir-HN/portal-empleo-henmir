// ==================================================================
// =================== SCRIPT PÚBLICO DE HENMIR ===================
// ==================================================================

// --- 1. CONFIGURACIÓN GLOBAL ---
const API_BASE_URL = 'https://HenmirApp.pythonanywhere.com/public-api';

// --- 2. LÓGICA DE NAVEGACIÓN (SINGLE PAGE APPLICATION - SPA) ---

const navigateToPage = (targetPageId) => {
    // Oculta todas las páginas
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    
    // Muestra la página de destino
    const targetPage = document.getElementById(targetPageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // Actualiza la clase 'active' en los enlaces de la barra de navegación
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.pageTarget === targetPageId) {
            link.classList.add('active');
        }
    });

    // Actualiza el hash en la URL
    window.location.hash = `!/${targetPageId}`;

    // LÓGICA CORREGIDA Y SEGURA PARA CERRAR EL MENÚ MÓVIL
    const navCollapseEl = document.getElementById('navbarNav');
    // Solo intenta cerrar el menú si el elemento existe Y si está visible (en modo móvil)
    if (navCollapseEl && navCollapseEl.classList.contains('show')) {
        // Usamos el método seguro de Bootstrap para obtener la instancia del componente
        const bsCollapse = bootstrap.Collapse.getInstance(navCollapseEl);
        if (bsCollapse) {
            bsCollapse.hide();
        }
    }
    
    // Desplaza la vista al inicio de la página
    window.scrollTo(0, 0);
};

// --- 3. COMUNICACIÓN CON LA API ---
const apiCall = async (endpoint, options = {}) => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.error || `Error del servidor: ${response.status}`);
        }
        return { success: true, data: data.data };
    } catch (error) {
        console.error(`Error en API (${endpoint}):`, error);
        return { success: false, error: error.message };
    }
};

// --- 4. RENDERIZADO DE CONTENIDO ---
const showSpinner = (container) => {
    container.innerHTML = `<div class="col-12 text-center p-5"><div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"><span class="visually-hidden">Cargando...</span></div></div>`;
};

const renderVacancies = (vacancies, container) => {
    if (!vacancies || vacancies.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p class="lead text-secondary">No hay vacantes disponibles en este momento.</p></div>';
        return;
    }
    container.innerHTML = vacancies.map(v => `
        <div class="col-md-6 col-lg-4">
            <div class="card job-card h-100">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${v.puesto || 'Puesto no especificado'}</h5>
                    <p class="text-secondary"><i class="bi bi-geo-alt me-2"></i>${v.ciudad || 'No especificada'}</p>
                    <p class="card-text small">${v.requisitos ? v.requisitos.substring(0, 120) + '...' : 'Requisitos no detallados.'}</p>
                    <div class="mt-auto pt-3">
                         <a href="#" class="btn btn-primary w-100" onclick="alert('Funcionalidad de solicitud de postulación no implementada aún.')">Ver Detalles y Aplicar</a>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
};

const renderStatusResults = (result) => {
    const container = document.getElementById('status-results-container');
    if (!result.success) {
        container.innerHTML = `<div class="alert alert-danger text-center mt-4">${result.error}</div>`;
        return;
    }
    const { data } = result;
    let content = '';
    if (data.status === 'not_registered') {
        content = `<div class="card p-4 text-center mt-4"><h4 class="text-danger">Candidato No Encontrado</h4><p>No pudimos encontrar tu perfil. Por favor, verifica el número o <a href="#!/page-register" data-page-target="page-register">regístrate aquí</a>.</p></div>`;
    } else {
        content = `<div class="card p-4 mt-4"><h3 class="mb-3">Hola, ${data.candidate_name}</h3>`;
        if (data.status === 'registered_no_applications') {
            content += `<p>Encontramos tu perfil, pero no tienes postulaciones activas. ¡Te invitamos a <a href="#!/page-vacancies" data-page-target="page-vacancies">explorar nuestras vacantes</a>!</p>`;
        } else if (data.status === 'has_applications') {
            content += `<p>Este es el estado de tus procesos:</p><div class="list-group">`;
            data.applications.forEach(app => {
                let badgeClass = 'bg-secondary';
                if (['En Entrevista', 'Oferta', 'Pre-seleccionado'].includes(app.estado)) badgeClass = 'bg-info text-dark';
                if (app.estado === 'Contratado') badgeClass = 'bg-success';
                if (app.estado === 'Rechazado') badgeClass = 'bg-danger';
                content += `
                    <div class="list-group-item">
                        <div class="d-flex w-100 justify-content-between">
                            <h5 class="mb-1">${app.cargo_solicitado}</h5>
                            <small>Aplicado: ${app.fecha_aplicacion}</small>
                        </div>
                        <p class="mb-1">Estado: <span class="badge ${badgeClass}">${app.estado}</span></p>
                        ${app.fecha_entrevista ? `<small class="text-success fw-bold">Entrevista agendada: ${app.fecha_entrevista}.</small>` : ''}
                    </div>`;
            });
            content += `</div>`;
        }
        content += `</div>`;
    }
    container.innerHTML = content;
};

// --- 5. MANEJADORES DE EVENTOS Y LÓGICA DE CARGA ---
const handleStatusCheckSubmit = async (event) => {
    event.preventDefault();
    const identityInput = document.getElementById('status-identity');
    const resultsContainer = document.getElementById('status-results-container');
    const identityNumber = identityInput.value.trim().replace(/-/g, '');
    if (!identityNumber) {
        resultsContainer.innerHTML = `<div class="alert alert-warning text-center mt-4">Por favor, ingresa un número de identidad.</div>`;
        return;
    }
    showSpinner(resultsContainer);
    const result = await apiCall(`/status/${identityNumber}`);
    renderStatusResults(result);
};

const loadInitialData = async () => {
    const featuredVacanciesContainer = document.getElementById('featured-vacancies-container');
    const vacanciesResult = await apiCall('/vacancies');
    if (vacanciesResult.success) {
        renderVacancies(vacanciesResult.data.slice(0, 3), featuredVacanciesContainer);
    } else {
        featuredVacanciesContainer.innerHTML = `<div class="col-12 text-center"><p class="text-danger">No se pudieron cargar las vacantes.</p></div>`;
    }
};

const loadAllVacancies = async () => {
    const allVacanciesContainer = document.getElementById('all-vacancies-container');
    showSpinner(allVacanciesContainer);
    const result = await apiCall('/vacancies');
    if (result.success) {
        renderVacancies(result.data, allVacanciesContainer);
    } else {
        allVacanciesContainer.innerHTML = `<div class="col-12 text-center"><p class="text-danger">No se pudieron cargar las vacantes.</p></div>`;
    }
};

// --- PUNTO DE ENTRADA ---
document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', (event) => {
        const link = event.target.closest('[data-page-target]');
        if (link) {
            event.preventDefault();
            const pageId = link.dataset.pageTarget;
            navigateToPage(pageId);
            if (pageId === 'page-vacancies') loadAllVacancies();
        }
    });

    document.getElementById('status-check-form').addEventListener('submit', handleStatusCheckSubmit);
    
    const handleInitialLoad = () => {
        const initialPageId = window.location.hash.substring(3) || 'page-home';
        navigateToPage(initialPageId);
        if (initialPageId === 'page-home') loadInitialData();
        if (initialPageId === 'page-vacancies') loadAllVacancies();
    };
    
    window.addEventListener('hashchange', handleInitialLoad);
    handleInitialLoad();
});