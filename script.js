// Weather App JavaScript
const API_KEY = '52a87406fc3c7111a83e21c9f60cb416';

// Get DOM elements
const cityInput = document.getElementById('cityInput');
const searchForm = document.getElementById('searchForm');
const locateBtn = document.getElementById('locateBtn');
const suggestions = document.getElementById('suggestions');
const status = document.getElementById('status');
const loader = document.getElementById('loader');

const cityName = document.getElementById('cityName');
const temperature = document.getElementById('temperature');
const description = document.getElementById('description');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const pressure = document.getElementById('pressure');
const visibility = document.getElementById('visibility');
const weatherIcon = document.getElementById('weatherIcon');
const dateTime = document.getElementById('dateTime');
const locationDetails = document.getElementById('locationDetails');
const temperatureChart = document.getElementById('temperatureChart');
const windChart = document.getElementById('windChart');

let currentSuggestions = [];
let searchTimeout;

// Utility functions
function setStatus(message, type = '') {
    status.textContent = message;
    status.className = `status ${type}`;
}

function setLoading(loading) {
    loader.classList.toggle('active', loading);
}

// Main weather search function using geocoding first
async function searchWeather(cityName) {
    try {
        setLoading(true);
        setStatus('Locating city...', 'success');
        
        // First get coordinates using geocoding API
        const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${API_KEY}`;
        const geoResponse = await fetch(geoUrl);
        
        if (!geoResponse.ok) {
            throw new Error('Location not found');
        }
        
        const locations = await geoResponse.json();
        
        if (locations.length === 0) {
            setStatus('City not found. Please check the spelling.', 'error');
            return;
        }
        
        const location = locations[0];
        setStatus('Getting weather data...', 'success');
        
        // Now get weather using coordinates
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${API_KEY}&units=metric`;
        const weatherResponse = await fetch(weatherUrl);
        
        if (weatherResponse.ok) {
            const data = await weatherResponse.json();
            displayWeather(data);
            setStatus('Weather data loaded successfully!', 'success');
        } else {
            setStatus('Failed to fetch weather data. Please try again.', 'error');
        }
    } catch (error) {
        setStatus('Location not found or network error.', 'error');
        console.error('Weather search error:', error);
    } finally {
        setLoading(false);
    }
}

// Get city suggestions
async function getCitySuggestions(query) {
    if (query.length < 2) {
        hideSuggestions();
        return;
    }
    
    try {
        const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`;
        const response = await fetch(url);
        
        if (response.ok) {
            const cities = await response.json();
            showSuggestions(cities);
        }
    } catch (error) {
        console.error('Suggestions error:', error);
    }
}

// Show city suggestions
function showSuggestions(cities) {
    currentSuggestions = cities;
    
    if (cities.length === 0) {
        suggestions.innerHTML = '<div class="empty">No cities found</div>';
        suggestions.classList.add('open');
        return;
    }
    
    const html = cities.map((city, index) => {
        const name = city.name;
        const country = city.country;
        const state = city.state ? `, ${city.state}` : '';
        const fullName = `${name}${state}, ${country}`;
        
        return `
            <div class="suggestion-item" data-index="${index}">
                <span class="label">${fullName}</span>
            </div>
        `;
    }).join('');
    
    suggestions.innerHTML = html;
    suggestions.classList.add('open');
}

// Hide suggestions
function hideSuggestions() {
    suggestions.classList.remove('open');
    suggestions.innerHTML = '';
    currentSuggestions = [];
}

// Select a suggestion
function selectSuggestion(index) {
    const city = currentSuggestions[index];
    if (city) {
        const name = city.name;
        const country = city.country;
        const state = city.state ? `, ${city.state}` : '';
        const fullName = `${name}${state}, ${country}`;
        
        cityInput.value = fullName;
        hideSuggestions();
        
        // Use coordinates directly from geocoding result
        getWeatherByCoords(city.lat, city.lon, fullName);
    }
}

// Get weather by coordinates
async function getWeatherByCoords(lat, lon, locationName) {
    try {
        setLoading(true);
        setStatus('Getting weather data...', 'success');
        
        // Get current weather
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        const weatherResponse = await fetch(weatherUrl);
        
        // Get 5-day forecast
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        const forecastResponse = await fetch(forecastUrl);
        
        if (weatherResponse.ok && forecastResponse.ok) {
            const weatherData = await weatherResponse.json();
            const forecastData = await forecastResponse.json();
            
            displayWeather(weatherData);
            displayLocationDetails(lat, lon);
            drawCharts(forecastData);
            setStatus(`Weather loaded for ${locationName}`, 'success');
        } else {
            setStatus('Failed to get weather data.', 'error');
        }
    } catch (error) {
        setStatus('Network error. Please try again.', 'error');
        console.error('Weather error:', error);
    } finally {
        setLoading(false);
    }
}

// Display weather data
function displayWeather(data) {
    // Update city name and date
    cityName.textContent = `${data.name}, ${data.sys.country}`;
    
    const date = new Date(data.dt * 1000);
    dateTime.textContent = date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Update weather info
    temperature.textContent = Math.round(data.main.temp);
    description.textContent = data.weather[0].description;
    humidity.textContent = `${data.main.humidity}%`;
    windSpeed.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
    pressure.textContent = `${data.main.pressure} hPa`;
    visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
    
    // Update weather icon
    const iconCode = data.weather[0].icon;
    weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    weatherIcon.alt = data.weather[0].description;
}

// Display location details
async function displayLocationDetails(lat, lon) {
    try {
        const geoUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;
        const response = await fetch(geoUrl);
        
        if (response.ok) {
            const locations = await response.json();
            if (locations.length > 0) {
                const location = locations[0];
                const details = [];
                
                if (location.state) details.push(`State: ${location.state}`);
                if (location.country) details.push(`Country: ${location.country}`);
                details.push(`Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
                
                locationDetails.textContent = details.join(' • ');
            }
        }
    } catch (error) {
        console.error('Location details error:', error);
    }
}

// Draw weather charts
function drawCharts(forecastData) {
    drawTemperatureChart(forecastData);
    drawWindChart(forecastData);
}

// Draw temperature chart
function drawTemperatureChart(forecastData) {
    const ctx = temperatureChart.getContext('2d');
    const width = temperatureChart.width;
    const height = temperatureChart.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Get daily data (one per day)
    const dailyData = [];
    const processedDates = new Set();
    
    forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000).toDateString();
        if (!processedDates.has(date) && dailyData.length < 5) {
            dailyData.push({
                date: new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
                temp: Math.round(item.main.temp)
            });
            processedDates.add(date);
        }
    });
    
    if (dailyData.length === 0) return;
    
    // Chart dimensions
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    // Find min/max temperatures
    const temps = dailyData.map(d => d.temp);
    const minTemp = Math.min(...temps) - 2;
    const maxTemp = Math.max(...temps) + 2;
    const tempRange = maxTemp - minTemp;
    
    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
        const y = padding + (i / 4) * chartHeight;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }
    
    // Draw temperature line
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    dailyData.forEach((data, index) => {
        const x = padding + (index / (dailyData.length - 1)) * chartWidth;
        const y = padding + ((maxTemp - data.temp) / tempRange) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Draw points and labels
    ctx.fillStyle = '#ff6b6b';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    dailyData.forEach((data, index) => {
        const x = padding + (index / (dailyData.length - 1)) * chartWidth;
        const y = padding + ((maxTemp - data.temp) / tempRange) * chartHeight;
        
        // Draw point
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw temperature label
        ctx.fillStyle = '#333';
        ctx.fillText(`${data.temp}°`, x, y - 10);
        
        // Draw day label
        ctx.fillText(data.date, x, height - 10);
        
        ctx.fillStyle = '#ff6b6b';
    });
}

// Draw wind speed chart
function drawWindChart(forecastData) {
    const ctx = windChart.getContext('2d');
    const width = windChart.width;
    const height = windChart.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Get daily data
    const dailyData = [];
    const processedDates = new Set();
    
    forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000).toDateString();
        if (!processedDates.has(date) && dailyData.length < 5) {
            dailyData.push({
                date: new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
                wind: Math.round(item.wind.speed * 3.6)
            });
            processedDates.add(date);
        }
    });
    
    if (dailyData.length === 0) return;
    
    // Chart dimensions
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    // Find max wind speed
    const winds = dailyData.map(d => d.wind);
    const maxWind = Math.max(...winds) + 5;
    
    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 4; i++) {
        const y = padding + (i / 4) * chartHeight;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }
    
    // Draw bars
    const barWidth = chartWidth / dailyData.length * 0.6;
    
    dailyData.forEach((data, index) => {
        const x = padding + (index + 0.5) * (chartWidth / dailyData.length) - barWidth / 2;
        const barHeight = (data.wind / maxWind) * chartHeight;
        const y = padding + chartHeight - barHeight;
        
        // Draw bar
        ctx.fillStyle = '#4ecdc4';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Draw wind speed label
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${data.wind}`, x + barWidth / 2, y - 5);
        
        // Draw day label
        ctx.fillText(data.date, x + barWidth / 2, height - 10);
    });
}

// Get current location weather
function getCurrentLocationWeather() {
    if (!navigator.geolocation) {
        setStatus('Geolocation is not supported by this browser.', 'error');
        return;
    }
    
    setStatus('Getting your location...', 'success');
    setLoading(true);
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`;
                const response = await fetch(url);
                
                if (response.ok) {
                    const data = await response.json();
                    displayWeather(data);
                    setStatus('Weather data loaded for your location!', 'success');
                } else {
                    setStatus('Failed to get weather for your location.', 'error');
                }
            } catch (error) {
                setStatus('Failed to get weather for your location.', 'error');
                console.error('Location weather error:', error);
            } finally {
                setLoading(false);
            }
        },
        (error) => {
            setLoading(false);
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    setStatus('Location access denied by user.', 'error');
                    break;
                case error.POSITION_UNAVAILABLE:
                    setStatus('Location information is unavailable.', 'error');
                    break;
                case error.TIMEOUT:
                    setStatus('Location request timed out.', 'error');
                    break;
                default:
                    setStatus('An unknown error occurred while getting location.', 'error');
                    break;
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
        }
    );
}

// Debounce function for search suggestions
function debounce(func, delay) {
    return function(...args) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => func.apply(this, args), delay);
    };
}

const debouncedGetSuggestions = debounce(getCitySuggestions, 300);

// Event listeners
cityInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    debouncedGetSuggestions(query);
});

cityInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        hideSuggestions();
    }
});

suggestions.addEventListener('click', (e) => {
    const suggestionItem = e.target.closest('.suggestion-item');
    if (suggestionItem) {
        const index = parseInt(suggestionItem.dataset.index);
        selectSuggestion(index);
    }
});

searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const city = cityInput.value.trim();
    if (city) {
        hideSuggestions();
        searchWeather(city);
    } else {
        setStatus('Please enter a city name.', 'warning');
    }
});

locateBtn.addEventListener('click', getCurrentLocationWeather);

// Hide suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!searchForm.contains(e.target)) {
        hideSuggestions();
    }
});

// Initialize app
setStatus('Enter a city name or use your current location to get weather information.', 'success');