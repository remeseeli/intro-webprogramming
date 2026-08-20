// API KEYS HERE
const OWM_API_KEY = "API_KEY_HERE"; 
const WEATHERAPI_KEY = "API_KEY_HERE";
// Open-Meteo does not require an API key

let currentUnit = 'celsius';
let chartInstance = null;
let currentCityData = { name: '', lat: 0, lon: 0 };
let favorites = JSON.parse(localStorage.getItem('weatherFavs')) || [];

document.addEventListener('DOMContentLoaded', () => {
    updateFavoritesMenu();
    
    // Auto-fetch location on page load, browser will prompt for permission
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
            err => console.log("Geolocation denied or failed. Waiting for manual search.")
        );
    }

    document.getElementById('search-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const city = document.getElementById('search-input').value;
        fetchWeatherByCity(city);
    });

    document.getElementById('geo-btn').addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
                err => showError("Geolocation failed or denied.")
            );
        }
    });

    document.getElementById('unit-toggle').addEventListener('change', (e) => {
        currentUnit = e.target.value;
        if(currentCityData.name) {
            fetchWeatherByCoords(currentCityData.lat, currentCityData.lon, currentCityData.name);
        }
    });

    document.getElementById('add-fav-btn').addEventListener('click', (e) => {
        if(!currentCityData.name) return;
        
        const btn = e.target;
        if (!favorites.includes(currentCityData.name)) {
            favorites.push(currentCityData.name);
            btn.innerText = "★ Added!";
            btn.classList.remove('btn-outline-warning');
            btn.classList.add('btn-warning');
        } else {
            favorites = favorites.filter(f => f !== currentCityData.name);
            btn.innerText = "★ Add to Favorites";
            btn.classList.remove('btn-warning');
            btn.classList.add('btn-outline-warning');
        }
        
        localStorage.setItem('weatherFavs', JSON.stringify(favorites));
        updateFavoritesMenu();
    });

async function fetchWeatherByCity(city) {
    try {
        // OpenWeatherMap (Used for geocoding and current weather)
        const owmRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OWM_API_KEY}&units=metric`);
        if (!owmRes.ok) throw new Error("City not found");
        const owmData = await owmRes.json();
        
        fetchWeatherByCoords(owmData.coord.lat, owmData.coord.lon, owmData.name);
    } catch (error) {
        showError(error.message);
    }
}

async function fetchWeatherByCoords(lat, lon, cityName = null) {
    hideError();
    try {
        // OpenWeatherMap (Current)
        const owmRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWM_API_KEY}&units=metric`);
        const owmData = await owmRes.json();
        
        currentCityData = { name: cityName || owmData.name, lat, lon };

        // WeatherAPI (7 day forecast & graph comparison)
        const wapiRes = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${WEATHERAPI_KEY}&q=${lat},${lon}&days=7`);
        const wapiData = await wapiRes.json();

        // Open-Meteo (24 hour forecast for graph comparison)
        const meteoRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m`);
        const meteoData = await meteoRes.json();

        updateUI(owmData, wapiData, meteoData);
    } catch (error) {
        showError("Failed to fetch weather data. Check API keys.");
    }
}

function updateUI(owmData, wapiData, meteoData) {
    const tempC = owmData.main.temp;
    const isNight = owmData.weather[0].icon.includes('n');
    
    // Update theme
    document.body.className = '';
    if (isNight) document.body.classList.add('theme-night');
    else if (tempC < 10) document.body.classList.add('theme-cold');
    else if (tempC > 25) document.body.classList.add('theme-hot');
    else document.body.classList.add('theme-default');

    // Update Current Weather
    document.getElementById('city-name').innerText = currentCityData.name;
    document.getElementById('current-temp').innerText = formatTemp(tempC);
    document.getElementById('current-desc').innerText = owmData.weather[0].description;
    document.getElementById('current-icon').innerHTML = `<img src="https://openweathermap.org/img/wn/${owmData.weather[0].icon}@2x.png" alt="icon">`;

    // Custom Feature: Running Condition
    evaluateRunningCondition(tempC, owmData.weather[0].id);

    const favBtn = document.getElementById('add-fav-btn');
    if (favorites.includes(currentCityData.name)) {
        favBtn.innerText = "★ Added!";
        favBtn.classList.remove('btn-outline-warning');
        favBtn.classList.add('btn-warning');
    } else {
        favBtn.innerText = "★ Add to Favorites";
        favBtn.classList.remove('btn-warning');
        favBtn.classList.add('btn-outline-warning');
    }
    // Update 7-Day Forecast (Provider: WeatherAPI)
    const forecastContainer = document.getElementById('seven-day-forecast');
    forecastContainer.innerHTML = '';
    wapiData.forecast.forecastday.forEach(day => {
        const date = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
        forecastContainer.innerHTML += `
            <div class="forecast-day">
                <strong>${date}</strong><br>
                <img src="${day.day.condition.icon}" alt="icon"><br>
                ${formatTemp(day.day.maxtemp_c)} / ${formatTemp(day.day.mintemp_c)}
            </div>
        `;
    });

    // Update Graph (Comparison: Open-Meteo vs WeatherAPI hourly)
    updateChart(wapiData.forecast.forecastday[0].hour, meteoData.hourly);
}

function evaluateRunningCondition(temp, weatherCode) {
    let condition = "Fair";
    let desc = "Decent weather for a run.";
    let iconHTML = '<i class="fas fa-running text-warning"></i>'; // Default yellow
    
    // OpenWeatherMap weather code groups
    const weatherGroup = Math.floor(weatherCode / 100);
    const isPrecipitating = [2, 3, 5, 6].includes(weatherGroup);
    const isObscured = [7].includes(weatherGroup);

    if (temp < -5 || temp > 30 || isPrecipitating) {
        condition = "Poor";
        iconHTML = '<i class="fas fa-running text-danger"></i>'; // Red icon
        
        if (isPrecipitating) desc = "Precipitation. Risk of slipping.";
        else if (temp < -5) desc = "Cold. Dress well.";
        else if (temp > 30) desc = "Extreme heat. Stay in, or hydrate well.";

    } else if (isObscured) {
        condition = "Fair";
        iconHTML = '<i class="fas fa-running text-warning"></i>'; // Yellow icon
        desc = " Reduced visibility. Be cautious.";

    } else if (temp >= 10 && temp <= 20) {
        condition = "Excellent";
        iconHTML = '<i class="fas fa-running text-success"></i>'; // Green icon
        desc = "Perfect running conditions!";
    
    } else {
        condition = "Fair";
        iconHTML = '<i class="fas fa-running text-warning"></i>'; // Yellow icon
        if (temp < 10) desc = "Dress in layers.";
        else if (temp > 20) desc = "Borderline temperature. Hydrate well.";
    }

    document.getElementById('running-icon').innerHTML = iconHTML;
    document.getElementById('running-condition').innerText = condition;
    document.getElementById('running-desc').innerText = desc;
}

function updateChart(wapiHourly, meteoHourly) {
    const labels = wapiHourly.map(h => new Date(h.time).getHours() + ':00');
    const wapiData = wapiHourly.map(h => convertTempInternal(h.temp_c));
    const meteoData = meteoHourly.temperature_2m.slice(0, 24).map(t => convertTempInternal(t));

    const data = {
        labels: labels,
        datasets: [
            {
                name: `WeatherAPI (${getUnitSymbol()})`,
                values: wapiData
            },
            {
                name: `Open-Meteo (${getUnitSymbol()})`,
                values: meteoData
            }
        ]
    };

    chartInstance = new frappe.Chart("#forecastChart", {
        title: "24-Hour Forecast Comparison",
        data: data,
        type: 'line',
        height: 250,
        colors: ['#ff6384', '#36a2eb'],
        lineOptions: {
            hideDots: 0,
            regionFill: 0
        },
        axisOptions: {
            xIsSeries: true
        }
    });
}

function formatTemp(celsius) {
    return Math.round(convertTempInternal(celsius)) + getUnitSymbol();
}

function convertTempInternal(celsius) {
    if (currentUnit === 'fahrenheit') return (celsius * 9/5) + 32;
    if (currentUnit === 'kelvin') return celsius + 273.15;
    return celsius;
}

function getUnitSymbol() {
    if (currentUnit === 'fahrenheit') return '°F';
    if (currentUnit === 'kelvin') return 'K';
    return '°C';
}

function updateFavoritesMenu() {
    const list = document.getElementById('favorites-list');
    list.innerHTML = '';
    
    if (favorites.length === 0) {
        list.innerHTML = '<li><span class="dropdown-item text-muted">No favorites yet</span></li>';
        return;
    }

    favorites.forEach(fav => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = 'dropdown-item';
        a.href = 'javascript:void(0)';
        a.innerText = fav;
        a.onclick = () => fetchWeatherByCity(fav);
        li.appendChild(a);
        list.appendChild(li);
    });
}

function showError(msg) {
    const errDiv = document.getElementById('error-message');
    errDiv.innerText = msg;
    errDiv.classList.remove('d-none');
}

function hideError() {
    document.getElementById('error-message').classList.add('d-none');
}
});