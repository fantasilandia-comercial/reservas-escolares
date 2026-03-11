let schoolsDatabase = [];
const availableDates = ["2025-04-15", "2025-04-16", "2025-04-22", "2025-05-05", "2025-05-20"];

// Element Selectors
const rbdInput = document.getElementById('rbdInput');
const rutInput = document.getElementById('rutInput');
const regionSelect = document.getElementById('regionSelect');
const comunaSelect = document.getElementById('comunaSelect');
const schoolSelect = document.getElementById('schoolSelect');
const dateSelect = document.getElementById('visitDate');
const schoolSearch = document.getElementById('schoolSearch');

// 1. Initialize Application
fetch('schools.json')
    .then(res => res.json())
    .then(data => {
        schoolsDatabase = data;
        initForm();
    });

function initForm() {
    // Populate Dates
    dateSelect.innerHTML = '<option value="">Seleccione una fecha</option>';
    availableDates.forEach(date => {
        const opt = document.createElement('option');
        opt.value = date;
        opt.textContent = new Date(date + "T00:00:00").toLocaleDateString('es-CL', { 
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
        });
        dateSelect.appendChild(opt);
    });

    // Populate Regions
    const regions = [...new Set(schoolsDatabase.map(s => s.NOM_REG_RBD_A))].sort();
    regions.forEach(reg => {
        const opt = document.createElement('option');
        opt.value = reg; opt.textContent = reg;
        regionSelect.appendChild(opt);
    });
}

// 2. SEARCH BY RBD
rbdInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    const school = schoolsDatabase.find(s => s.RBD == val);
    if (school) fillFullForm(school);
});

// 3. SEARCH BY RUT (Can return multiple schools)
rutInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    const matches = schoolsDatabase.filter(s => s.RUT == val);
    
    if (matches.length === 1) {
        fillFullForm(matches[0]);
    } else if (matches.length > 1) {
        // Just fill the Region and filter the school list
        regionSelect.value = matches[0].NOM_REG_RBD_A;
        updateComunaList(matches[0].NOM_REG_RBD_A);
        updateSchoolList(matches);
    }
});

// 4. CASCADE: Region -> Comuna
regionSelect.addEventListener('change', () => {
    const region = regionSelect.value;
    if (!region) {
        resetCascading(true);
        return;
    }
    updateComunaList(region);
    comunaSelect.disabled = false;
    schoolSelect.disabled = true;
    schoolSelect.value = "";
});

// 5. CASCADE: Comuna -> School Name
comunaSelect.addEventListener('change', () => {
    const region = regionSelect.value;
    const comuna = comunaSelect.value;
    if (!comuna) {
        schoolSelect.disabled = true;
        return;
    }
    const filteredSchools = schoolsDatabase.filter(s => s.NOM_REG_RBD_A === region && s.NOM_COM_RBD === comuna);
    updateSchoolList(filteredSchools);
    schoolSelect.disabled = false;
});

// 6. FINAL SELECTION: Fill IDs
schoolSelect.addEventListener('change', () => {
    const selectedName = schoolSelect.value;
    const region = regionSelect.value;
    const comuna = comunaSelect.value;
    const school = schoolsDatabase.find(s => s.NOM_RBD === selectedName && s.NOM_REG_RBD_A === region && s.NOM_COM_RBD === comuna);
    
    if (school) {
        rbdInput.value = school.RBD;
        rutInput.value = school.RUT;
    }
});

// HELPERS
function fillFullForm(school) {
    rbdInput.value = school.RBD;
    rutInput.value = school.RUT;
    regionSelect.value = school.NOM_REG_RBD_A;
    
    updateComunaList(school.NOM_REG_RBD_A);
    comunaSelect.value = school.NOM_COM_RBD;
    comunaSelect.disabled = false;

    updateSchoolList(schoolsDatabase.filter(s => s.NOM_COM_RBD === school.NOM_COM_RBD));
    schoolSelect.value = school.NOM_RBD;
    schoolSelect.disabled = false;
}

function updateComunaList(regionName) {
    const comunas = [...new Set(schoolsDatabase.filter(s => s.NOM_REG_RBD_A === regionName).map(s => s.NOM_COM_RBD))].sort();
    comunaSelect.innerHTML = '<option value="">Seleccione Comuna</option>';
    comunas.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c; opt.textContent = c;
        comunaSelect.appendChild(opt);
    });
}

function updateSchoolList(list) {
    schoolSelect.innerHTML = '<option value="">Seleccione Colegio</option>';
    // Sort alphabetically
    list.sort((a, b) => a.NOM_RBD.localeCompare(b.NOM_RBD)).forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.NOM_RBD; opt.textContent = s.NOM_RBD;
        schoolSelect.appendChild(opt);
    });
}

function resetCascading(full = false) {
    comunaSelect.innerHTML = '<option value="">Seleccione Comuna</option>';
    comunaSelect.disabled = true;
    schoolSelect.innerHTML = '<option value="">Seleccione Colegio</option>';
    schoolSelect.disabled = true;
    if(full) {
        rbdInput.value = "";
        rutInput.value = "";
    }
}

// FORM SUBMISSION
document.getElementById('bookingForm').addEventListener('submit', (e) => {
    e.preventDefault();
    alert("¡Datos listos! En la Fase 3 configuraremos el envío por correo.");
});

schoolSearch.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const region = regionSelect.value;
    const comuna = comunaSelect.value;
    // Filter schools that belong to the location AND contain the typed text
    const filtered = schoolsDatabase.filter(s => 
        s.NOM_REG_RBD_A === region && 
        s.NOM_COM_RBD === comuna &&
        s.NOM_RBD.toLowerCase().includes(term)
    );
    updateSchoolList(filtered);
});
