const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const statusText = document.getElementById("status");
const weatherContent = document.getElementById("weatherContent");

// Weather codes from Open-Meteo (WMO)
function getWeatherInfo(code) {
  const conditions = {
    0: ["Clear Sky", "☀️"],
    1: ["Mainly Clear", "🌤️"],
    2: ["Partly Cloudy", "⛅"],
    3: ["Overcast", "☁️"],
    45: ["Foggy", "🌫️"],
    48: ["Rime Fog", "🌫️"],
    51: ["Light Drizzle", "🌦️"],
    53: ["Moderate Drizzle", "🌦️"],
    55: ["Heavy Drizzle", "🌧️"],
    56: ["Freezing Drizzle", "🌧️"],
    57: ["Freezing Drizzle", "🌧️"],
    61: ["Light Rain", "🌧️"],
    63: ["Moderate Rain", "🌧️"],
    65: ["Heavy Rain", "🌧️"],
    66: ["Freezing Rain", "🌧️"],
    67: ["Heavy Freezing Rain", "🌧️"],
    71: ["Light Snow", "🌨️"],
    73: ["Moderate Snow", "❄️"],
    75: ["Heavy Snow", "❄️"],
    77: ["Snow Grains", "🌨️"],
    80: ["Rain Showers", "🌦️"],
    81: ["Moderate Showers", "🌧️"],
    82: ["Heavy Showers", "⛈️"],
    85: ["Snow Showers", "🌨️"],
    86: ["Heavy Snow Showers", "❄️"],
    95: ["Thunderstorm", "⛈️"],
    96: ["Thunderstorm & Hail", "⛈️"],
    99: ["Heavy Thunderstorm", "⛈️"]
  };

  return conditions[code] || ["Unknown Weather", "🌡️"];
}

// Format time from the API's local-time string
function formatTime(value) {
  if (!value) return "--:--";

  const time = value.split("T")[1];
  if (!time) return "--:--";

  const [hour, minute] = time.split(":").map(Number);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;

  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

// Format forecast dates
function formatDay(date, index) {
  if (index === 0) return "Today";

  return new Date(date + "T12:00:00")
    .toLocaleDateString("en-IN", { weekday: "short" });
}

// Get weather information
async function getWeather(city) {
  try {
    searchBtn.disabled = true;
    searchBtn.textContent = "Loading...";
    statusText.textContent = "Finding your city...";
    weatherContent.style.display = "none";

    // STEP 1: Find city coordinates
    const geoURL = new URL(
      "https://geocoding-api.open-meteo.com/v1/search"
    );

    geoURL.search = new URLSearchParams({
      name: city,
      count: 1,
      language: "en",
      format: "json"
    });

    const geoResponse = await fetch(geoURL);
    if (!geoResponse.ok) throw new Error("City search failed.");

    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("City not found. Check the spelling.");
    }

    const location = geoData.results[0];

    // STEP 2: Get weather using coordinates
    statusText.textContent = "Getting live weather...";

    const weatherURL = new URL(
      "https://api.open-meteo.com/v1/forecast"
    );

    weatherURL.search = new URLSearchParams({
      latitude: location.latitude,
      longitude: location.longitude,
      current: [
        "temperature_2m",
        "relative_humidity_2m",
        "apparent_temperature",
        "is_day",
        "weather_code",
        "wind_speed_10m",
        "cloud_cover"
      ].join(","),
      daily: [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_probability_max",
        "sunrise",
        "sunset"
      ].join(","),
      timezone: "auto",
      forecast_days: 5,
      temperature_unit: "celsius",
      wind_speed_unit: "kmh"
    });

    const weatherResponse = await fetch(weatherURL);

    if (!weatherResponse.ok) {
      throw new Error("Weather service is unavailable.");
    }

    const data = await weatherResponse.json();

    // STEP 3: Display current weather
    const current = data.current;
    const daily = data.daily;

    const info = getWeatherInfo(current.weather_code);

    document.getElementById("cityName").textContent =
      location.name;

    document.getElementById("countryName").textContent =
      [location.admin1, location.country]
        .filter(Boolean)
        .join(", ");

    document.getElementById("temperature").textContent =
      Math.round(current.temperature_2m) + "°";

    document.getElementById("description").textContent =
      info[0];

    document.getElementById("weatherIcon").textContent =
      info[1];

    document.getElementById("feelsLike").textContent =
      Math.round(current.apparent_temperature) + "°C";

    document.getElementById("humidity").textContent =
      current.relative_humidity_2m + "%";

    document.getElementById("wind").textContent =
      Math.round(current.wind_speed_10m) + " km/h";

    document.getElementById("clouds").textContent =
      current.cloud_cover + "%";

    document.getElementById("rain").textContent =
      daily.precipitation_probability_max[0] + "%";

    document.getElementById("sunrise").textContent =
      formatTime(daily.sunrise[0]);

    document.getElementById("sunset").textContent =
      formatTime(daily.sunset[0]);

    document.getElementById("minMax").textContent =
      Math.round(daily.temperature_2m_min[0]) +
      "° / " +
      Math.round(daily.temperature_2m_max[0]) +
      "°C";

    document.getElementById("todayDate").textContent =
      new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });

    // STEP 4: Generate 5-day forecast
    const forecastContainer =
      document.getElementById("forecast");

    forecastContainer.innerHTML = "";

    for (let i = 0; i < daily.time.length; i++) {
      const dayInfo = getWeatherInfo(daily.weather_code[i]);

      const card = document.createElement("div");
      card.className = "forecast-card";

      const day = document.createElement("p");
      day.className = "day";
      day.textContent = formatDay(daily.time[i], i);

      const icon = document.createElement("div");
      icon.className = "icon";
      icon.textContent = dayInfo[1];

      const condition = document.createElement("p");
      condition.className = "condition";
      condition.textContent = dayInfo[0];

      const temps = document.createElement("p");
      temps.className = "temps";

      const high = document.createElement("span");
      high.textContent =
        Math.round(daily.temperature_2m_max[i]) + "° ";

      const low = document.createElement("span");
      low.className = "low";
      low.textContent =
        Math.round(daily.temperature_2m_min[i]) + "°";

      temps.append(high, low);
      card.append(day, icon, condition, temps);
      forecastContainer.appendChild(card);
    }

    // STEP 5: Show dashboard
    weatherContent.style.display = "block";
    statusText.textContent = "Weather updated successfully ✓";

  } catch (error) {
    statusText.textContent = "⚠️ " + error.message;
    weatherContent.style.display = "none";

  } finally {
    searchBtn.disabled = false;
    searchBtn.textContent = "Search";
  }
}

// Search button
searchForm.addEventListener("submit", function(event) {
  event.preventDefault();

  const city = cityInput.value.trim();

  if (city) {
    getWeather(city);
  }
});

// Load default city when website opens
getWeather("New Delhi");