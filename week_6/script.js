const API_URL = "https://statfin.stat.fi/PxWeb/api/v1/en/StatFin/synt/12dy.px";

// function to build the JSON query for the API
function buildQuery(areaCode, contentsCode) {
    return {
        "query": [
            {
                "code": "timeperiod_y",
                "selection": {
                    "filter": "item",
                    "values": ["2000", "2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021"]
                }
            },
            {
                "code": "alue_23_20260101",
                "selection": {
                    "filter": "item",
                    "values": [areaCode]
                }
            },
            {
                "code": "contentscode",
                "selection": {
                    "filter": "item",
                    "values": [contentsCode]
                }
            }
        ],
        "response": {
            "format": "json-stat2"
        }
    };
}

// logic for main page
if (document.getElementById("submit-data")) {
    
    let chart;
    let currentData = [];
    let currentLabels = [];

    // Fetch population data
    async function fetchPopulationData(areaCode = "SSS") {
        const query = buildQuery(areaCode, "synt-vaesto");
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(query)
        });
        const data = await res.json();
        return Object.values(data.value);
    }

    // Fetch municipality codes
    async function getAreaCodes() {
        const res = await fetch(API_URL);
        const data = await res.json();
        const areaVariable = data.variables.find(v => v.code === "alue_23_20260101");
        return {
            codes: areaVariable.values,
            names: areaVariable.valueTexts
        };
    }

    // Render chart
    function renderChart(data, name) {
        document.getElementById("chart").innerHTML = ""; 
        
        chart = new frappe.Chart("#chart", {
            title: `Population Growth: ${name}`,
            data: {
                labels: currentLabels,
                datasets: [{ name: "Population", values: data }]
            },
            type: 'line',
            height: 450,
            colors: ['#eb5146']
        });
    }

    // Load default data on page load
    document.addEventListener("DOMContentLoaded", async () => {
        currentLabels = ["2000", "2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021"];
        
        const savedCode = localStorage.getItem("municipalityCode") || "SSS";
        const savedName = localStorage.getItem("municipalityName") || "Whole country";
        
        currentData = await fetchPopulationData(savedCode);
        renderChart(currentData, savedName);
    });

    // Handle search form
    document.getElementById("submit-data").addEventListener("click", async () => {
        const input = document.getElementById("input-area").value.trim().toLowerCase();
        if (!input) return;

        const { codes, names } = await getAreaCodes();
        const index = names.findIndex(name => name.toLowerCase() === input);
        
        if (index !== -1) {
            const areaCode = codes[index];
            const areaName = names[index];
            
            localStorage.setItem("municipalityCode", areaCode);
            localStorage.setItem("municipalityName", areaName);
            
            currentLabels = ["2000", "2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021"];
            currentData = await fetchPopulationData(areaCode);
            renderChart(currentData, areaName);
        } else {
            alert("Municipality not found. Try another one.");
        }
    });

    // Data prediction logic
    document.getElementById("add-data").addEventListener("click", () => {
        if (currentData.length < 2) return;
        
        let deltas = [];
        for (let i = 1; i < currentData.length; i++) {
            deltas.push(currentData[i] - currentData[i - 1]);
        }
        
        const meanDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
        const nextPoint = currentData[currentData.length - 1] + meanDelta;
        
        currentData.push(Math.round(nextPoint));
        
        const nextYear = parseInt(currentLabels[currentLabels.length - 1]) + 1;
        currentLabels.push(nextYear.toString());
        
        chart.update({
            labels: currentLabels,
            datasets: [{ name: "Population", values: currentData }]
        });
    });

} 
// newchart logic
else {

    // Fetch birth and death data
    async function fetchMetricData(areaCode, metricCode) {
        const query = buildQuery(areaCode, metricCode);
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(query)
        });
        const data = await res.json();
        return Object.values(data.value);
    }

    document.addEventListener("DOMContentLoaded", async () => {
        const areaCode = localStorage.getItem("municipalityCode") || "SSS";
        const areaName = localStorage.getItem("municipalityName") || "Whole country";

        // Fetch both metrics in parallel
        const [birthsData, deathsData] = await Promise.all([
            fetchMetricData(areaCode, "synt-vm01"),
            fetchMetricData(areaCode, "synt-vm11")
        ]);

        // Render bar chart
        new frappe.Chart("#chart", {
            title: `Births and Deaths: ${areaName}`,
            data: {
                labels: ["2000", "2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021"],
                datasets: [
                    {
                        name: "Births",
                        values: birthsData
                    },
                    {
                        name: "Deaths",
                        values: deathsData
                    }
                ]
            },
            type: 'bar',
            height: 450,
            colors: ['#63d0ff', '#363636']
        });
    });

}