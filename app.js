// =======================================================
// JAVASCRIPT DEL PORTAL WEB - VERSIÓN FINAL Y ESTABLE
// =======================================================

// --- 1. CONFIGURACIÓN ---
const API_URL = 'URL_DEL_BACKEND_PYTHON_QUE_DESPLEGARAS_EN_RENDER_O_RAILWAY'; // <-- ¡REEMPLAZA ESTO EN FASE 6!
const GOOGLE_FORM_URL = 'https://script.google.com/macros/s/AKfycbw3rES9xsvo7M-xmTdXuoK0wbJI-WakRCF3t7EzA2Oa9FATKiQhVmKXozDGHMAi72iS/exec'; // <-- ¡REEMPLAZA ESTO AHORA!

// --- 2. FUNCIÓN CENTRAL PARA LLAMADAS A LA API ---
async function apiCall(endpoint, method = 'GET', data = null) {
    const url = `${API_URL}${endpoint}`;
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            // Si usas tokens JWT para autenticación, se añadirían aquí.
            // 'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
    };
    if (data) {
        options.body = JSON.stringify(data);
    }
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`Error de red: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Fallo en la llamada a la API:", error);
        return { error: "Error de conexión con el servidor." };
    }
}

// --- 3. LÓGICA DE NAVEGACIÓN Y RENDERIZADO ---
function navigateTo(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');

    const navCollapse = document.getElementById('navbarNav');
    if (navCollapse.classList.contains('show')) {
        new bootstrap.Collapse(navCollapse).hide();
    }
}

function showSpinner(containerId) {
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = '<div class="spinner-container"><div class="spinner-border text-primary" role="status"></div></div>';
}

function renderHomePage(publicData) {
    const { posts, webContent } = publicData;

    // Rellenar Posts
    const postsContainer = document.getElementById('posts-container');
    if(postsContainer) {
        if(posts && posts.length > 0) {
            postsContainer.innerHTML = posts.map(p => `...`).join(''); // Llenar con la estructura de tarjeta de post
        } else {
            postsContainer.innerHTML = '<p class="text-muted col-12 text-center">No hay posts recientes.</p>';
        }
    }

    // Rellenar carrusel
    const heroSection = document.getElementById('hero-section');
    // ... Lógica del carrusel ...
}

function renderVacanciesPage(vacantes) {
    const vacanciesList = document.getElementById('vacancies-list');
    // ... Lógica para llenar la lista de vacantes ...
}

function renderAboutPage(webContent) {
    const misionText = document.getElementById('mision-text');
    const visionText = document.getElementById('vision-text');
    if (misionText && webContent) misionText.textContent = webContent.texto_mision || 'Contenido no disponible.';
    if (visionText && webContent) visionText.textContent = webContent.texto_vision || 'Contenido no disponible.';
}

async function renderCandidateProfile(userId) {
    const container = document.getElementById('page-candidate-profile');
    showSpinner('page-candidate-profile');
    
    const result = await apiCall(`/profile/${userId}`);
    
    if (result && !result.error) {
        // Lógica para mostrar perfil, postulaciones, etc.
        container.innerHTML = `<h1>Bienvenido, ${result.nombre}</h1>`;
    } else {
        container.innerHTML = `<div class="alert alert-danger">Error: ${result.error}</div>`;
    }
}


// --- 4. LÓGICA DE LOGIN Y CHAT ---
async function handleLogin(event) {
    event.preventDefault();
    const statusDiv = document.getElementById('login-status');
    statusDiv.innerHTML = '<div class="spinner-border spinner-border-sm"></div>';

    const userId = document.getElementById('login-identidad').value;
    
    // En esta nueva arquitectura, el login sería más complejo (con contraseña)
    // Por ahora, solo buscaremos el perfil.
    navigateTo('page-candidate-profile');
    renderCandidateProfile(userId);
}

// --- 5. INICIALIZACIÓN DE LA APLICACIÓN ---
document.addEventListener('DOMContentLoaded', async () => {
    // Asignar URLs y listeners estáticos
    document.getElementById('google-form-iframe').src = GOOGLE_FORM_URL;
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Por ahora, como no hay un backend real, mostraremos datos estáticos.
    // En fases futuras, aquí iría la llamada a `apiCall('/public-data')`
    renderAboutPage({ texto_mision: 'Cargando misión...', texto_vision: 'Cargando visión...' });
    
    const authContainer = document.getElementById('auth-section');
    authContainer.innerHTML = `<button class="btn btn-outline-primary" onclick="navigateTo('page-login')">Iniciar Sesión</button>`;

    navigateTo('page-home');
});