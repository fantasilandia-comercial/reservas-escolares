let schoolsDatabase = [];

// 1. Load the JSON file with error handling
console.log("Intentando cargar base de datos...");
fetch('schools.json')
    .then(response => {
        if (!response.ok) throw new Error("No se pudo cargar schools.json");
        return response.json();
    })
    .then(data => {
        schoolsDatabase = data;
        console.log("✅ Base de datos cargada. Registros:", schoolsDatabase.length);
        console.log("Muestra del primer registro:", schoolsDatabase[0]);
    })
    .catch(error => {
        console.error("❌ Error:", error);
    });

// 2. Identify Elements
const rbdInput = document.getElementById('rbdInput');
const schoolName = document.getElementById('schoolName');
const regionName = document.getElementById('regionName');
const comunaName = document.getElementById('comunaName');

// 3. Real-time Lookup
rbdInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    
    // Convert current value to string for matching
    // Note: We use '==' to match "1" (string) with 1 (number) just in case
    const match = schoolsDatabase.find(s => s.RBD == val);

    if (match) {
        console.log("🎯 Colegio encontrado:", match.NOM_RBD);
        schoolName.value = match.NOM_RBD;
        regionName.value = match.NOM_REG_RBD_A;
        comunaName.value = match.NOM_COM_RBD;
        rbdInput.classList.remove('is-invalid');
        rbdInput.classList.add('is-valid');
    } else {
        schoolName.value = "";
        regionName.value = "";
        comunaName.value = "";
        rbdInput.classList.remove('is-valid');
        if(val.length > 0) rbdInput.classList.add('is-invalid');
    }
});

// 4. Submit Placeholder
document.getElementById('bookingForm').addEventListener('submit', (e) => {
    e.preventDefault();
    alert("¡Fase 2 completa! El formulario está validado.");
});