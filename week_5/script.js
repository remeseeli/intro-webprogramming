const map = L.map('map', {
    minZoom: -3,
});

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
}).addTo(map);

const url = "https://geo.stat.fi/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=tilastointialueet:kunta4500k&outputFormat=json&srsName=EPSG:4326";
const migrationUrl = "https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/muutl/11a2.px";
const queryUrl = "./migration_data_query_2026.json";

fetch(queryUrl)
    .then(res => res.json())
    .then(queryPayload => {
        return Promise.all([
            fetch(url).then(res => res.json()),
            fetch(migrationUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(queryPayload)
            }).then(res => res.json())
        ]);
    })
    .then(([geoJsonData, migrationData]) => {
        // Extract municipality keys and values array from PxWeb response
        const regionKeys = migrationData.dimension.alue_23_20260101.category.index;
        const valuesList = migrationData.value;

        // Build a map of municipality code -> { positive, negative }
        const migrationMap = {};
        const regionCodeArray = Object.keys(regionKeys);

        regionCodeArray.forEach((code, index) => {
            const positiveVal = valuesList[index * 2];
            const negativeVal = valuesList[index * 2 + 1];
            
            // Clean "KU020" to "020" to match GeoJSON kunta-code formats
            const cleanCode = code.replace(/^KU/, '');

            migrationMap[cleanCode] = {
                positive: positiveVal,
                negative: negativeVal
            };
        });

        // Add GeoJSON layer with popups and hover tooltips
        const geoJsonLayer = L.geoJSON(geoJsonData, {
            style: function (feature) {
                const kuntaCode = feature.properties.kunta;
                const stats = migrationMap[kuntaCode];

                let fillColor = "hsl(0, 0%, 50%)"; // Default color

                if (stats && stats.positive !== undefined && stats.negative) {
                    // Calculate hue: (positive / negative)^3 * 60
                    const ratio = stats.positive / stats.negative;
                    let hue = Math.pow(ratio, 3) * 60;

                    // Cap hue at 120
                    if (hue > 120) {
                        hue = 120;
                    }
                    fillColor = `hsl(${hue}, 75%, 50%)`;
                }

                return {
                    weight: 2,
                    fillColor: fillColor,
                    fillOpacity: 0.7
                };
            },
            onEachFeature: function (feature, layer) {
                const name = feature.properties.nimi || feature.properties.name || "Unknown";
                const kuntaCode = feature.properties.kunta;

                // Look up corresponding migration data
                const stats = migrationMap[kuntaCode] || { positive: "N/A", negative: "N/A" };

                // Show name on hover
                layer.bindTooltip(name, { sticky: true });

                // Construct popup content on click
                const popupContent = `
                    <div>
                        <h5>${name}</h5>
                        <p><strong>Positive migration:</strong> ${stats.positive}</p>
                        <p><strong>Negative migration:</strong> ${stats.negative}</p>
                    </div>
                `;
                layer.bindPopup(popupContent);
            }
        }).addTo(map);

        // Step 5: Fit map bounds to loaded GeoJSON layer
        map.fitBounds(geoJsonLayer.getBounds());
    })
    .catch(error => console.error("Error loading data:", error));