// Call the fetch operation on page load
getPopulation();

/**
 * Fetches population data with a POST request, then triggers employment data fetch
 */
async function getPopulation() {
    const url = "https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/vaerak/11ra.px";
    const tableBody = document.querySelector("#population-data");
    
    try {
        const query = await fetch("./population_query.json");
        const body = await query.json();
        
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
        const data = await response.json();

        const labelsDict = data.dimension.alue_23_20260101.category.label;
        const populationValues = data.value;
        const municipalityNames = Object.values(labelsDict);

        for(let i = 0; i < municipalityNames.length; i++) {
            const row = document.createElement("tr");
            
            const municipalityCell = document.createElement("td");
            municipalityCell.innerHTML = municipalityNames[i];
            
            const populationCell = document.createElement("td");
            populationCell.innerHTML = populationValues[i];

            row.append(municipalityCell);
            row.append(populationCell);
            tableBody.append(row);
        }

        // Fetch employment data only after the population request fully succeeds
        getEmployment(populationValues);
    }
    catch(error) {
        console.error("Error when fetching population data", error);
    }
}

/**
 * Fetches employment data and appends the new columns to the existing rows
 */
async function getEmployment(populationValues) {
    const empUrl = "https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/tyokay/115b.px";
    const tableBody = document.querySelector("#population-data");
    const rows = tableBody.querySelectorAll("tr");
    
    try {
        const query = await fetch("./employment_query.json");
        const body = await query.json();
        
        const response = await fetch(empUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        const employmentValues = data.value;

        for(let i = 0; i < rows.length; i++) {
            const popValue = populationValues[i];
            const empValue = employmentValues[i];
            const percentage = (empValue / popValue) * 100;

            const employmentCell = document.createElement("td");
            employmentCell.innerHTML = empValue;
            
            const percentageCell = document.createElement("td");
            percentageCell.innerHTML = percentage.toFixed(2) + "%";
            
            // Apply conditional row styling based on employment percentage
            if (percentage > 45) {
                rows[i].style.backgroundColor = "#abffbd";
            } else if (percentage < 25) {
                rows[i].style.backgroundColor = "#ff9e9e";
            }
            // Append the new cells to the already existing row
            rows[i].append(employmentCell);
            rows[i].append(percentageCell);
        }
    }
    catch(error) {
        console.error("Error when fetching employment data", error);
    }
}