let schoolsDatabase = [];
const availableDates = {
    "Media Jornada": ["2026-11-26", "2026-12-03", "2026-12-04", "2026-12-16"],
    "Jornada Completa": ["2026-10-29", "2026-11-16", "2026-11-23",
                        "2026-11-24", "2026-11-30", "2026-12-01", "2026-12-09", "2026-12-21", "2026-12-22"]
    };

// Dynamic Menu Options
const mealOptions =[
    { id: "meal_burger", name: "Combo Burger y Papas" },
    { id: "meal_pizza", name: "Combo Pizza" },
    { id: "meal_ensalada", name: "Combo Ensalada" },
    { id: "meal_none", name: "Solo Entrada" }
];

// Reference to the new container
const mealContainer = document.getElementById('mealOptionsContainer');

// Elements
const rbdInput = document.getElementById('rbdInput');
const rutInput = document.getElementById('rutInput');
const regionSelect = document.getElementById('regionSelect');
const comunaSelect = document.getElementById('comunaSelect');
const schoolSearch = document.getElementById('schoolSearch');
const schoolSelect = document.getElementById('schoolSelect');
const dateSelect = document.getElementById('visitDate');
const modalidadSelect = document.getElementById('modalidadSelect');

// 1. Init
fetch('schools.json')
    .then(res => res.json())
    .then(data => {
        schoolsDatabase = data;
        initForm();
    });

function initForm() {

    // Regions
    const regions = [...new Set(schoolsDatabase.map(s => s.NOM_REG_RBD_A))].sort();
    regionSelect.innerHTML = '<option value="">Seleccione Región</option>';
    regions.forEach(reg => {
        const opt = document.createElement('option');
        opt.value = reg; opt.textContent = reg;
        regionSelect.appendChild(opt);
    });

    // Render Meal Options dynamically
    mealContainer.innerHTML = '';
    mealOptions.forEach(meal => {
        const col = document.createElement('div');
        col.className = 'col-md-3 col-sm-6';
        col.innerHTML = `
            <label class="form-label" style="font-size: 0.9rem;">${meal.name}</label>
            <input type="number" id="${meal.id}" class="form-control meal-input" min="0" value="0">
        `;
        mealContainer.appendChild(col);
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

// Cascade: Modalidad -> Fecha

modalidadSelect.addEventListener('change', (e) => {
    const modalidad = e.target.value;
    dateSelect.innerHTML = '<option value="">Seleccione una fecha</option>';
    
    if (modalidad && availableDates[modalidad]) {
        dateSelect.disabled = false;
        
        availableDates[modalidad].forEach(date => {
            const opt = document.createElement('option');
            opt.value = date;
            // The "T00:00:00" prevents the timezone from shifting the day backwards
            opt.textContent = new Date(date + "T00:00:00").toLocaleDateString('es-CL', { 
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
            });
            dateSelect.appendChild(opt);
        });
    } else {
        dateSelect.disabled = true;
        dateSelect.innerHTML = '<option value="">Primero seleccione modalidad</option>';
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
// Form Submission via EmailJS
document.getElementById('bookingForm').addEventListener('submit', (e) => {
    e.preventDefault();

    // -- NEW MATH VALIDATION --
    const kids = parseInt(document.getElementById('kidsCount').value) || 0;
    const adults = parseInt(document.getElementById('adultsCount').value) || 0;
    const totalVisitors = kids + adults;

    let totalMeals = 0;
    let mealSummaryArray =[];
    
    // Loop through our dynamic options to calculate totals
    mealOptions.forEach(meal => {
        const qty = parseInt(document.getElementById(meal.id).value) || 0;
        totalMeals += qty;
        if (qty > 0) {
            mealSummaryArray.push(`${meal.name}: ${qty}`);
        }
    });

    // Stop the form if the numbers don't match
    if (totalMeals !== totalVisitors) {
        alert(`Error: Tienes ${totalVisitors} visitantes en total, pero has asignado ${totalMeals} opciones de alimentación. Los números deben coincidir.`);
        return;
    }
    
    // -- EXTRACT MULTIPLE COURSES --
    const checkedBoxes = document.querySelectorAll('.curso-checkbox:checked');   
    // Extract their values and join them with a comma
    const selectedCursos = Array.from(checkedBoxes).map(cb => cb.value).join(", ");
    
    if (selectedCursos === "") {
        alert("Por favor seleccione al menos un curso o nivel.");
        return;
    }

    // 1. Check if reCAPTCHA is completed
    const recaptchaResponse = grecaptcha.getResponse();
    if (!recaptchaResponse) {
        alert("Por favor, confirme que no es un robot marcando la casilla de reCAPTCHA.");
        return;
    }

    // 2. Disable button to prevent double-clicks
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "ENVIANDO SOLICITUD...";

    // 3. Gather and structure all data into a JSON object
    const payload = {
        RBD: document.getElementById('rbdInput').value,
        RUT: document.getElementById('rutInput').value,
        Region: document.getElementById('regionSelect').value,
        Comuna: document.getElementById('comunaSelect').value,
        Colegio: document.getElementById('schoolSelect').value,
        Contacto1_Nombre: document.getElementById('contactName1').value,
        Contacto1_Email: document.getElementById('contactEmail1').value,
        Contacto1_Telefono: document.getElementById('contactPhone1').value,
        Contacto2_Nombre: document.getElementById('contactName2').value || "N/A",
        Contacto2_Email: document.getElementById('contactEmail2').value || "N/A",
        Contacto2_Telefono: document.getElementById('contactPhone2').value || "N/A",
        Modalidad: document.getElementById('modalidadSelect').value, 
        Fecha_Visita: document.getElementById('visitDate').value,
        Curso: selectedCursos,
        Alumnos: kids,
        Adultos: adults,
        Alimentacion: mealSummaryArray.join(" | ") 
    };

    // 4. Parameters required by your EmailJS Template
    const templateParams = {
        school_name: payload.Colegio,
        reply_to: payload.Contacto1_Email,
        json_payload: JSON.stringify(payload, null, 2), // Converts object to formatted JSON string
        "g-recaptcha-response": recaptchaResponse       // Required by EmailJS to validate the token securely
    };

    // 5. Send via EmailJS
    // REPLACE THESE TWO STRINGS WITH YOUR ACTUAL IDs
    emailjs.send('service_ygicx87', 'template_mtbk1wg', templateParams)
        .then(function(response) {
            alert('¡Reserva enviada con éxito! El departamento comercial la evaluará.');
            
            // Clean up the form after successful submission
            document.getElementById('bookingForm').reset();
            resetCascading();
            grecaptcha.reset(); // Reset the reCAPTCHA widget
            
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }, function(error) {
            console.error("EmailJS Error:", error);
            alert('Hubo un error al enviar la reserva. Por favor, intente nuevamente.');
            
            grecaptcha.reset(); // Reset the reCAPTCHA widget even if it fails
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        });
});