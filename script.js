let schoolsDatabase = [];
const availableDates = ["2025-04-15", "2025-04-16", "2025-04-22", "2025-05-05", "2025-05-20"];

// Elements
const rbdInput = document.getElementById('rbdInput');
const rutInput = document.getElementById('rutInput');
const regionSelect = document.getElementById('regionSelect');
const comunaSelect = document.getElementById('comunaSelect');
const schoolSearch = document.getElementById('schoolSearch');
const schoolSelect = document.getElementById('schoolSelect');
const dateSelect = document.getElementById('visitDate');

// 1. Init
fetch('schools.json')
    .then(res => res.json())
    .then(data => {
        schoolsDatabase = data;
        initForm();
    });

function initForm() {
    // Dates
    dateSelect.innerHTML = '<option value="">Seleccione una fecha</option>';
    availableDates.forEach(date => {
        const opt = document.createElement('option');
        opt.value = date;
        opt.textContent = new Date(date + "T00:00:00").toLocaleDateString('es-CL', { 
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
        });
        dateSelect.appendChild(opt);
    });

    // Regions
    const regions = [...new Set(schoolsDatabase.map(s => s.NOM_REG_RBD_A))].sort();
    regionSelect.innerHTML = '<option value="">Seleccione Región</option>';
    regions.forEach(reg => {
        const opt = document.createElement('option');
        opt.value = reg; opt.textContent = reg;
        regionSelect.appendChild(opt);
    });
}

// 2. Search by RBD
rbdInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (val === "") return;
    const school = schoolsDatabase.find(s => s.RBD == val);
    if (school) fillFullForm(school);
});

// 3. Search by RUT
rutInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (val === "") { initForm(); return; }

    const matches = schoolsDatabase.filter(s => s.RUT == val);
    if (matches.length > 0) {
        const rutRegions = [...new Set(matches.map(s => s.NOM_REG_RBD_A))].sort();
        regionSelect.innerHTML = '<option value="">Seleccione Región</option>';
        rutRegions.forEach(reg => {
            const opt = document.createElement('option');
            opt.value = reg; opt.textContent = reg;
            regionSelect.appendChild(opt);
        });

        if (rutRegions.length === 1) {
            regionSelect.value = rutRegions[0];
            updateComunaList(rutRegions[0], val);
            comunaSelect.disabled = false;
        }
    }
});

// 4. Cascade: Region
regionSelect.addEventListener('change', () => {
    const region = regionSelect.value;
    const rut = rutInput.value.trim();
    if (!region) { resetCascading(); return; }
    
    updateComunaList(region, rut);
    comunaSelect.disabled = false;
    schoolSearch.disabled = true;
    schoolSelect.disabled = true;
});

// 5. Cascade: Comuna
comunaSelect.addEventListener('change', () => {
    const region = regionSelect.value;
    const comuna = comunaSelect.value;
    const rut = rutInput.value.trim();
    
    if (comuna) {
        schoolSearch.disabled = false;
        schoolSelect.disabled = false;
        schoolSearch.value = "";
        
        let filtered = schoolsDatabase.filter(s => s.NOM_REG_RBD_A === region && s.NOM_COM_RBD === comuna);
        if (rut !== "") filtered = filtered.filter(s => s.RUT == rut);
        
        updateSchoolList(filtered);
    }
});

// 6. Search Name (Contains)
schoolSearch.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const region = regionSelect.value;
    const comuna = comunaSelect.value;
    const rut = rutInput.value.trim();

    let filtered = schoolsDatabase.filter(s => 
        s.NOM_REG_RBD_A === region && 
        s.NOM_COM_RBD === comuna &&
        s.NOM_RBD.toLowerCase().includes(term)
    );
    if (rut !== "") filtered = filtered.filter(s => s.RUT == rut);
    
    updateSchoolList(filtered);
});

// 7. Final Selection
schoolSelect.addEventListener('change', () => {
    const school = schoolsDatabase.find(s => s.NOM_RBD === schoolSelect.value && s.NOM_COM_RBD === comunaSelect.value);
    if (school) {
        rbdInput.value = school.RBD;
        rutInput.value = school.RUT;
    }
});

// Helpers
function fillFullForm(school) {
    rbdInput.value = school.RBD;
    rutInput.value = school.RUT;
    regionSelect.value = school.NOM_REG_RBD_A;
    updateComunaList(school.NOM_REG_RBD_A, school.RUT);
    comunaSelect.value = school.NOM_COM_RBD;
    comunaSelect.disabled = false;
    updateSchoolList(schoolsDatabase.filter(s => s.NOM_COM_RBD === school.NOM_COM_RBD && s.RUT == school.RUT));
    schoolSelect.value = school.NOM_RBD;
    schoolSelect.disabled = false;
    schoolSearch.disabled = false;
}

function updateComunaList(regionName, rutFilter = "") {
    let list = schoolsDatabase.filter(s => s.NOM_REG_RBD_A === regionName);
    if (rutFilter !== "") list = list.filter(s => s.RUT == rutFilter);
    
    const comunas = [...new Set(list.map(s => s.NOM_COM_RBD))].sort();
    comunaSelect.innerHTML = '<option value="">Seleccione Comuna</option>';
    comunas.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c; opt.textContent = c;
        comunaSelect.appendChild(opt);
    });
}

function updateSchoolList(list) {
    schoolSelect.innerHTML = '<option value="">Seleccione Colegio (' + list.length + ')</option>';
    list.sort((a, b) => a.NOM_RBD.localeCompare(b.NOM_RBD)).forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.NOM_RBD; opt.textContent = s.NOM_RBD;
        schoolSelect.appendChild(opt);
    });
}

function resetCascading() {
    comunaSelect.disabled = true;
    schoolSearch.disabled = true;
    schoolSelect.disabled = true;
    rbdInput.value = "";
    rutInput.value = "";
}

// Form Submission
document.getElementById('bookingForm').addEventListener('submit', (e) => {
    e.preventDefault();
    alert("¡Validación Exitosa! Estamos listos para la Fase 3.");
});