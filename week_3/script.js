// Call the fetch operation on page load
getPopulationData();
/**
 * Help from https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
 * Fetches population data with a POST request
 */
async function getPopulationData() {
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
        // Debug
        console.log("API Response:", data);

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
    }
    catch(error) {
        console.error("Error when fetching data", error);
    }
}