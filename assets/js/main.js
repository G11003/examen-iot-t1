const MOCKAPI_URL = "https://68c729fb442c663bd028e5cb.mockapi.io/examen/t1/Cafetera";

let monitoreoInterval;
const historyData = [];
const HISTORY_LIMIT = 10;
let selectedCapsuleName = "";

// --- Funciones de Historial ---
function initHistorial() {
    fetchAndRenderHistorial();
}

async function fetchAndRenderHistorial() {
    const tableBody = document.querySelector('#historial-table tbody');
    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla de historial.");
        return;
    }
    try {
        const response = await fetch(MOCKAPI_URL);
        const devices = await response.json();
        const last10Records = devices.slice(-10).reverse();
        
        tableBody.innerHTML = '';
        last10Records.forEach(device => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${device.id}</td>
                <td>${device.ip}</td>
                <td>${device.name}</td>
                <td><span class="badge ${device.status === 'prendido' ? 'bg-success' : 'bg-danger'}">${device.status}</span></td>
                <td>${device.tipo}</td>
                <td>${device.tamano}</td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error al cargar el historial:", error);
    }
}

// --- Funciones de Control ---
function initControl() {
    fetchAndRenderControlCard();
}

async function fetchAndRenderControlCard() {
    const controlCardContainer = document.getElementById('control-card');
    if (!controlCardContainer) {
        console.error("No se encontró el contenedor de la tarjeta de control.");
        return;
    }
    try {
        const response = await fetch(MOCKAPI_URL);
        const devices = await response.json();
        const mainDevice = devices[0];
        
        const uniqueCapsules = [...new Set(devices.map(d => d.name))].sort();

        controlCardContainer.innerHTML = `
            <div class="card-body text-center">
                <img src="https://img.icons8.com/plasticine/100/coffee-maker.png" alt="Cafetera IoT" class="mb-3" width="70">
                <h5 class="card-title">Cafetera Principal</h5>
                <p class="card-text text-muted">IP: ${mainDevice.ip}</p>
                <hr>
                <div class="form-check form-switch mb-3 d-flex justify-content-center align-items-center">
                    <label class="form-check-label me-2" for="status-switch">Estado: <span class="badge ${mainDevice.status === 'prendido' ? 'bg-success' : 'bg-danger'}">${mainDevice.status.toUpperCase()}</span></label>
                    <input class="form-check-input" type="checkbox" id="status-switch" ${mainDevice.status === 'prendido' ? 'checked' : ''}>
                </div>
                
                <div class="mb-3">
                    <label class="form-label d-block">Tipo de Café</label>
                    <button class="btn ${mainDevice.tipo === 'caliente' ? 'btn-danger' : 'btn-outline-danger'} me-2 type-btn" data-tipo="caliente">Caliente</button>
                    <button class="btn ${mainDevice.tipo === 'frio' ? 'btn-primary' : 'btn-outline-primary'} type-btn" data-tipo="frio">Frío</button>
                </div>
                <div class="mb-3">
                    <label class="form-label d-block">Tamaño de Bebida</label>
                    <button class="btn ${mainDevice.tamano === 'estandar' ? 'btn-dark' : 'btn-outline-dark'} me-2 size-btn" data-tamano="estandar">Estándar</button>
                    <button class="btn ${mainDevice.tamano === 'grande' ? 'btn-dark' : 'btn-outline-dark'} size-btn" data-tamano="grande">Grande</button>
                </div>

                <div class="mb-3">
                    <label class="form-label d-block">Seleccionar Cápsula</label>
                    <select id="capsule-select" class="form-select">
                        <option value="">-- Elige una cápsula --</option>
                        ${uniqueCapsules.map(name => `<option value="${name}" ${name === mainDevice.name ? 'selected' : ''}>${name}</option>`).join('')}
                    </select>
                </div>

                <p class="mt-3">
                    Cápsula presente: 
                    <span class="badge ${mainDevice.capsula ? 'bg-success' : 'bg-danger'}">
                        ${mainDevice.capsula ? 'SÍ' : 'NO'}
                    </span>
                </p>

                <button class="btn btn-warning mt-4" id="visualizar-btn">Visualizar Guía de Leche</button>
            </div>
        `;
        addControlListeners(mainDevice.id);

    } catch (error) {
        console.error("Error al cargar la tarjeta de control:", error);
    }
}

function addControlListeners(deviceId) {
    const mainDevice = { id: deviceId };

    document.getElementById('status-switch').addEventListener('change', async (e) => {
        const newStatus = e.target.checked ? 'prendido' : 'apagado';
        await fetch(`${MOCKAPI_URL}/${mainDevice.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        fetchAndRenderControlCard();
    });

    document.querySelectorAll('.type-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const newType = e.target.dataset.tipo;
            await fetch(`${MOCKAPI_URL}/${mainDevice.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tipo: newType, lasttemp: newType })
            });
            fetchAndRenderControlCard();
        });
    });

    document.querySelectorAll('.size-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const newTamano = e.target.dataset.tamano;
            await fetch(`${MOCKAPI_URL}/${mainDevice.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tamano: newTamano })
            });
            fetchAndRenderControlCard();
        });
    });

    document.getElementById('capsule-select').addEventListener('change', async (e) => {
        const newName = e.target.value;
        selectedCapsuleName = newName;
        await fetch(`${MOCKAPI_URL}/${mainDevice.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName })
        });
        fetchAndRenderControlCard();
    });

    document.getElementById('visualizar-btn').addEventListener('click', () => {
        showSection('taza');
    });
}

// --- Funciones de Taza de Leche ---
function initTaza() {
    const tazaCafeName = document.getElementById('taza-cafe-name');
    const tazaCoffeeFill = document.getElementById('taza-coffee-fill');
    const tazaMilkFill = document.getElementById('taza-milk-fill');
    const tazaMilkText = document.getElementById('taza-milk-text');
    const backButton = document.getElementById('back-to-control-btn');

    const milkPercentage = 100 - getMilkPercentage(selectedCapsuleName);
    const coffeePercentage = getMilkPercentage(selectedCapsuleName);

    tazaCafeName.textContent = selectedCapsuleName || "Café no seleccionado";
    tazaCoffeeFill.style.height = `${coffeePercentage}%`;
    tazaMilkFill.style.height = `${milkPercentage}%`;
    tazaMilkText.textContent = `${milkPercentage}%`;
    
    backButton.addEventListener('click', () => {
        showSection('control');
    });
}

function getMilkPercentage(coffeeName) {
    const name = coffeeName.toLowerCase();
    if (name.includes('cappuccino')) return 20;
    if (name.includes('latte')) return 10;
    if (name.includes('cortado')) return 50;
    if (name.includes('espresso')) return 100;
    if (name.includes('machiato')) return 80;
    return 90;
}

// --- Funciones de Cápsulas ---
function initCapsulas() {
    fetchCapsulas();
}

async function fetchCapsulas() {
    const form = document.getElementById('capsula-form');
    const tableBody = document.querySelector('#capsulas-table tbody');
    const capsulaIdInput = document.getElementById('capsula-id');
    const cancelButton = document.getElementById('cancel-edit');
    if (!tableBody || !form) {
        console.error("No se encontraron los elementos de la sección de cápsulas.");
        return;
    }
    
    async function loadCapsulas() {
        try {
            const response = await fetch(MOCKAPI_URL);
            const capsulas = await response.json();
            tableBody.innerHTML = '';
            capsulas.forEach(capsula => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${capsula.id}</td>
                    <td>${capsula.name}</td>
                    <td>${capsula.tipo}</td>
                    <td>${capsula.tamano}</td>
                    <td>
                        <button class="btn btn-sm btn-warning edit-btn" data-id="${capsula.id}">Editar</button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${capsula.id}">Eliminar</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            
            tableBody.querySelectorAll('.edit-btn').forEach(button => {
                button.addEventListener('click', () => {
                    const id = button.dataset.id;
                    editCapsula(id);
                });
            });

            tableBody.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', async () => {
                    const id = button.dataset.id;
                    if (confirm('¿Estás seguro de que quieres eliminar esta cápsula?')) {
                        await fetch(`${MOCKAPI_URL}/${id}`, { method: 'DELETE' });
                        loadCapsulas();
                    }
                });
            });
        } catch (error) {
            console.error("Error al cargar las cápsulas:", error);
        }
    }
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = capsulaIdInput.value;
        const capsulaData = {
            name: document.getElementById('capsula-name').value,
            tipo: document.getElementById('capsula-tipo').value,
            tamano: document.getElementById('capsula-tamano').value
        };
        try {
            if (id) {
                await fetch(`${MOCKAPI_URL}/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(capsulaData)
                });
            } else {
                await fetch(MOCKAPI_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(capsulaData)
                });
            }
            form.reset();
            capsulaIdInput.value = '';
            loadCapsulas();
        } catch (error) {
            console.error("Error al guardar la cápsula:", error);
        }
    });

    async function editCapsula(id) {
        try {
            const response = await fetch(`${MOCKAPI_URL}/${id}`);
            const capsula = await response.json();
            capsulaIdInput.value = capsula.id;
            document.getElementById('capsula-name').value = capsula.name;
            document.getElementById('capsula-tipo').value = capsula.tipo;
            document.getElementById('capsula-tamano').value = capsula.tamano;
        } catch (error) {
            console.error("Error al obtener los datos para editar:", error);
        }
    }

    cancelButton.addEventListener('click', () => {
        form.reset();
        capsulaIdInput.value = '';
    });
    
    loadCapsulas();
}

// --- Funciones de Monitoreo ---
function startMonitoreo() {
    fetchAndRenderMonitoreo();
    monitoreoInterval = setInterval(fetchAndRenderMonitoreo, 2000);
}

function stopMonitoreo() {
    clearInterval(monitoreoInterval);
}

async function fetchAndRenderMonitoreo() {
    const monitoreoCardsContainer = document.getElementById('monitoreo-cards');
    const historyTableBody = document.querySelector('#history-table tbody');
    if (!monitoreoCardsContainer || !historyTableBody) {
        console.error("No se encontraron los elementos de la sección de monitoreo.");
        return;
    }
    
    try {
        const response = await fetch(MOCKAPI_URL);
        const devices = await response.json();
        monitoreoCardsContainer.innerHTML = '';
        devices.forEach(device => {
            const card = document.createElement('div');
            card.className = 'col';
            card.innerHTML = `
                <div class="card h-100 shadow-sm p-3 ${device.status === 'prendido' ? 'status-on' : 'status-off'}">
                    <div class="card-body">
                        <h5 class="card-title">${device.name}</h5>
                        <p class="card-text mb-1"><strong>Estado:</strong> <span class="badge ${device.status === 'prendido' ? 'bg-success' : 'bg-danger'}">${device.status.toUpperCase()}</span></p>
                        <p class="card-text mb-1"><strong>Tipo Actual:</strong> ${device.tipo}</p>
                        <p class="card-text mb-1"><strong>Última Selección:</strong> ${device.lasttemp}</p>
                        <p class="card-text mb-1"><strong>Tamaño:</strong> ${device.tamano}</p>
                    </div>
                </div>
            `;
            monitoreoCardsContainer.appendChild(card);
        });

        // La siguiente parte genera el error si no hay registros o si la estructura cambia
        // He comentado este bloque para evitar errores con estructuras de datos cambiantes
        // historyTableBody.innerHTML = '';
        // historyData.slice().reverse().forEach(record => {
        //     const row = document.createElement('tr');
        //     row.innerHTML = `
        //         <td>${record.id}</td>
        //         <td>${record.name}</td>
        //         <td><span class="badge ${record.status === 'prendido' ? 'bg-success' : 'bg-danger'}">${record.status}</span></td>
        //         <td>${record.tipo}</td>
        //         <td>${record.lasttemp}</td>
        //         <td>${record.timestamp}</td>
        //     `;
        //     historyTableBody.appendChild(row);
        // });
    } catch (error) {
        console.error("Error al cargar los datos de monitoreo:", error);
    }
}

// --- Lógica Principal de la Aplicación ---
document.addEventListener('DOMContentLoaded', () => {
    const sections = {
        'historial': document.getElementById('historial-section'),
        'control': document.getElementById('control-section'),
        'taza': document.getElementById('taza-section'),
        'capsulas': document.getElementById('capsulas-section'),
        'monitoreo': document.getElementById('monitoreo-section')
    };

    const navLinks = {
        'historial': document.getElementById('nav-historial'),
        'control': document.getElementById('nav-control'),
        'capsulas': document.getElementById('nav-capsulas'),
        'monitoreo': document.getElementById('nav-monitoreo')
    };

    const initFunctions = {
        'historial': initHistorial,
        'control': initControl,
        'taza': initTaza,
        'capsulas': initCapsulas,
        'monitoreo': startMonitoreo
    };

    function showSection(sectionName) {
        for (const name in sections) {
            if (sections[name]) {
                sections[name].classList.add('d-none');
            }
        }
        if (sections[sectionName]) {
            sections[sectionName].classList.remove('d-none');
        }

        for (const name in navLinks) {
            if (navLinks[name]) {
                navLinks[name].classList.remove('active');
            }
        }
        if (navLinks[sectionName]) {
            navLinks[sectionName].classList.add('active');
        }

        // Llamar a la función de inicialización correspondiente
        if (initFunctions[sectionName]) {
            initFunctions[sectionName]();
        }

        // Detener el monitoreo si no estamos en la sección de monitoreo
        if (sectionName !== 'monitoreo') {
            stopMonitoreo();
        }
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = e.target.getAttribute('href').substring(1);
            showSection(sectionId);
        });
    });

    showSection('historial');
});