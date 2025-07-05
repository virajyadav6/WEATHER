 const apiKey = "8e75fc7fa127e320cabdadd367280bce";
    const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
    const searchBox = document.querySelector(".search input");
    const searchBtn = document.querySelector(".search button");
    const weatherIcon = document.querySelector(".weather-icon");
    const card = document.querySelector(".card");
    const loading = document.querySelector(".loading");
    const errorDiv = document.querySelector(".error");

    function formatTime(unixTimestamp, timezoneOffset = 0) {
      const localTimestamp = (unixTimestamp + timezoneOffset) * 1000;
      const localDate = new Date(localTimestamp);
      const hours = localDate.getUTCHours();
      const minutes = localDate.getUTCMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const hour12 = hours % 12 || 12;
      const minuteStr = minutes < 10 ? "0" + minutes : minutes;
      return `${hour12}:${minuteStr} ${ampm}`;
    }

    function formatDate(unixTimestamp, timezoneOffset = 0) {
      const date = new Date((unixTimestamp + timezoneOffset) * 1000);
      const year = date.getUTCFullYear();
      const month = date.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
      const day = date.getUTCDate();
      return `${month} ${day}, ${year}`;
    }

    function showLoading() {
      loading.style.display = 'block';
      errorDiv.style.display = 'none';
    }

    function hideLoading() {
      loading.style.display = 'none';
    }

    function showError(message) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      hideLoading();
    }

    function expandCard() {
      card.classList.remove('collapsed');
      card.classList.add('expanded');
    }

    function collapseCard() {
      card.classList.remove('expanded');
      card.classList.add('collapsed');
    }

    async function checkWeather(city) {
      city = city.trim();
      if (!city) {
        showError("Please enter a city name");
        return;
      }

      showLoading();
      
      try {
        const response = await fetch(`${apiUrl}${city}&appid=${apiKey}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            showError("City not found. Please check the spelling and try again.");
          } else {
            showError("Failed to fetch weather data. Please try again.");
          }
          return;
        }

        const data = await response.json();
        hideLoading();
        
        const timezoneOffset = data.timezone;

        // Update all weather data
        document.querySelector(".city").innerHTML = data.name;
        document.querySelector(".temp").innerHTML = Math.round(data.main.temp) + "°C";
        document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
        document.querySelector(".wind").innerHTML = Math.round(data.wind.speed * 3.6) + " km/hr"; // Convert m/s to km/hr
        document.querySelector(".clouds").innerHTML = data.clouds.all + "%";
        document.querySelector(".pressure").innerHTML = data.main.pressure + " hPa";

        document.querySelector(".sunrise").innerHTML = formatTime(data.sys.sunrise, timezoneOffset);
        document.querySelector(".sunset").innerHTML = formatTime(data.sys.sunset, timezoneOffset);

        const capitalizedDescription = data.weather[0].description[0].toUpperCase() + data.weather[0].description.slice(1);
        document.querySelector(".condition").innerHTML = capitalizedDescription;

        const nowUTC = Math.floor(Date.now() / 1000);
        document.querySelector(".local-time").innerHTML = formatTime(nowUTC, timezoneOffset);
        document.querySelector(".local-date").innerHTML = formatDate(nowUTC, timezoneOffset);

        // Update weather icon
        const iconCode = data.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        weatherIcon.src = iconUrl;
        weatherIcon.alt = data.weather[0].description;

        // Expand the card with animation
        expandCard();

      } catch (error) {
        hideLoading();
        showError("Network error. Please check your connection and try again.");
        console.error("Weather fetch error:", error);
      }
    }

    // Event listeners
    searchBtn.addEventListener("click", () => {
      checkWeather(searchBox.value);
    });

    searchBox.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        checkWeather(searchBox.value);
      }
    });

    // Clear error when user starts typing
    searchBox.addEventListener("input", () => {
      errorDiv.style.display = 'none';
    });


    //--location code
const locationBtn = document.getElementById("location-btn");

locationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showError("Geolocation is not supported by your browser.");
    return;
  }

  showLoading();

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;

      // Use OpenWeatherMap reverse geocoding API to get city name from lat/lon
      const geoApiUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`;

      try {
        const response = await fetch(geoApiUrl);
        if (!response.ok) {
          showError("Failed to get city name from your location.");
          hideLoading();
          return;
        }

        const data = await response.json();

        if (data.length === 0) {
          showError("Could not find a city name for your location.");
          hideLoading();
          return;
        }

        const cityName = data[0].name;

        searchBox.value = cityName;
        hideLoading();
        checkWeather(cityName);

      } catch (error) {
        hideLoading();
        showError("Error fetching city name from location.");
        console.error(error);
      }
    },
    (error) => {
      hideLoading();
      switch(error.code) {
        case error.PERMISSION_DENIED:
          showError("Permission denied. Please allow location access.");
          break;
        case error.POSITION_UNAVAILABLE:
          showError("Location information is unavailable.");
          break;
        case error.TIMEOUT:
          showError("The request to get your location timed out.");
          break;
        default:
          showError("An unknown error occurred.");
      }
    }
  );
});
