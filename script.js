let schoolsDatabase = [];
const availableDates = ["2026-10-08","2026-10-22","2026-11-09","2026-11-11","2026-11-16","2026-11-23","2026-11-24","2026-12-01","2026-12-02","2026-12-14","2026-12-15"];

// Element Selectors
const rbdInput = document.getElementById('rbdInput');
const rutInput = document.getElementById('rutInput');
const regionSelect = document.getElementById('regionSelect');
const comunaSelect = document.getElementById('comunaSelect');
const schoolSearch = document.getElementById('schoolSearch');
const schoolSelect = document.getElementById('schoolSelect');
const dateSelect = document.getElementById('visitDate');

// 1. Initialize Application
fetch('schools.json')
    .then(res => res.json())
    .then(data => {
        schoolsDatabase = data;
        initForm();
    })
    .catch(err => console.error("Error loading JSON:", err));

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

    // Populate Regions (Full List)
    const regions = [...new Set(schoolsDatabase.map(s => s.NOM_REG_RBD_A))].sort();
    regionSelect.innerHTML = '<option value="">Seleccione Región</option>';
    regions.forEach(reg => {
        const opt = document.createElement('option');
        opt.value = reg; opt.textContent = reg;
        regionSelect.appendChild(opt);
    });
    
    // Reset states
    comunaSelect.disabled = true;
    schoolSearch.disabled = true;
    schoolSelect.disabled = true;
}

// 2. SEARCH BY RBD
rbdInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (val === "") return;
    const school = schoolsDatabase.find(s => s.RBD == val);
    if (school) fillFullForm(school);
});

// 3. SEARCH BY RUT (Can filter multiple schools)
rutInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (val === "") {
        initForm();
        return;
    }
    const matches = schoolsDatabase.filter(s => s.RUT == val);
    
    if (matches.length > 0) {
        // Update Region list to only show regions where this RUT has schools
        const rutRegions = [...new Set(matches.map(s => s.NOM_REG_RBD_A))].sort();
        regionSelect.innerHTML = '<option value="">Seleccione Región</option>';
        rutRegions.forEach(reg => {
            const opt = document.createElement('option');
            opt.value = reg; opt.textContent = reg;
            regionSelect.appendChild(opt);
        });

        if (matches.length === 1) {
            fillFullForm(matches[0]);
        } else {
            // If multiple schools for one RUT, pre-select region if there's only one
            if(rutRegions.length === 1) {
                regionSelect.value = rutRegions[0];
                updateComunaList(rutRegions[0]);
                comunaSelect.disabled = false;
            }
        }
    }
});

// 4. CASCADE: Region -> Comuna
regionSelect.addEventListener('change', () => {
    const region = regionSelect.value;
    if (!region) {
        resetCascading();
        return;
    }
    updateComunaList(region);
    comunaSelect.disabled = false;
    schoolSearch.disabled = true;
    schoolSelect.disabled = true;
    schoolSearch.value = "";
});

// 5. CASCADE: Comuna -> Enable Search & List Schools
comunaSelect.addEventListener('change', () => {
    const region = regionSelect.value;
    const comuna = comunaSelect.value;
    
    if (comuna) {
        schoolSearch.disabled = false;
        schoolSelect.disabled = false;
        schoolSearch.value = ""; // Clear previous search
        
        const filteredSchools = schoolsDatabase.filter(s => s.NOM_REG_RBD_A === region && s.NOM_COM_RBD === comuna);
        updateSchoolList(filteredSchools);
    } else {
        schoolSearch.disabled = true;
        schoolSelect.disabled = true;
    }
});

// 6. SEARCH BY NAME (Contains Logic)
schoolSearch.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const region = regionSelect.value;
    const comuna = comunaSelect.value;

    const filtered = schoolsDatabase.filter(s => 
        s.NOM_REG_RBD_A === region && 
        s.NOM_COM_RBD === comuna &&
        s.NOM_RBD.toLowerCase().includes(term)
    );
    updateSchoolList(filtered);
});

// 7. FINAL SELECTION: Update IDs
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
    schoolSearch.disabled = false;
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
    schoolSelect.innerHTML = '<option value="">Seleccione Colegio (' + list.length + ')</option>';
    list.sort((a, b) => a.NOM_RBD.localeCompare(b.NOM_RBD)).forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.NOM_RBD; opt.textContent = s.NOM_RBD;
        schoolSelect.appendChild(opt);
    });
}

function resetCascading() {
    comunaSelect.innerHTML = '<option value="">Seleccione Comuna</option>';
    comunaSelect.disabled = true;
    schoolSearch.disabled = true;
    schoolSelect.innerHTML = '<option value="">Seleccione Colegio</option>';
    schoolSelect.disabled = true;
    rbdInput.value = "";
    rutInput.value = "";
}

// FORM SUBMISSION (Next: Phase 3)
document.getElementById('bookingForm').addEventListener('submit', (e) => {
    e.preventDefault();
    alert("Formulario validado correctamente. ¡Listo para configurar el envío!");
});