import { useEffect, useState } from "react";

export default function App() {
  const [location, setLocation] = useState("Lundon");
  const [isLoading, setIsLoading] = useState(false);
  const [displayLocation, setDisplayLocation] = useState("");
  const [weather, setWeather] = useState({});

  function getWeatherIcon(wmoCode) {
    const icons = new Map([
      [[0], "☀️"],
      [[1], "🌤"],
      [[2], "⛅️"],
      [[3], "☁️"],
      [[45, 48], "🌫"],
      [[51, 56, 61, 66, 80], "🌦"],
      [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
      [[71, 73, 75, 77, 85, 86], "🌨"],
      [[95], "🌩"],
      [[96, 99], "⛈"],
    ]);
    const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
    if (!arr) return "NOT FOUND";
    return icons.get(arr);
  }

  function convertToFlag(countryCode) {
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  }

  function formatDay(dateStr) {
    return new Intl.DateTimeFormat("en", {
      weekday: "short",
    }).format(new Date(dateStr));
  }

  useEffect(
    function () {
      async function fetchWeather() {
        // console.log("LOADING...");
        // console.log(this);

        try {
          // this.setState({ isLoading: true });
          setIsLoading(true);
          // 1) Getting location (geocoding)
          const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${location}`
          );
          const geoData = await geoRes.json();
          console.log("geoData", geoData);

          if (!geoData.results) throw new Error("Location not found");

          const { latitude, longitude, timezone, name, country_code } =
            geoData.results.at(0);
          setDisplayLocation(`${name} ${convertToFlag(country_code)}`);

          // 2) Getting actual weather
          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
          );
          const weatherData = await weatherRes.json();
          // this.setState({ weather: weatherData.daily });
          setWeather(weatherData.daily);
          console.log("weatherData", weatherData);
        } catch (err) {
          console.error(err);
        } finally {
          // this.setState({ isLoading: false });
          setIsLoading(false);
        }
      }
      fetchWeather();
      const btn = document.querySelector(".weather-btn");
      btn.addEventListener("click", fetchWeather);
      return function () {
        btn.removeEventListener("click", fetchWeather);
      };
    },
    [location]
  );

  return (
    <div className="app">
      <h1>CLASSY WEATHER</h1>
      <div>
        <input
          type="text"
          placeholder="Search from location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>
      <button className="weather-btn">Get Weather</button>
      {isLoading && <p className="loader">Loading...</p>}
      {weather.weathercode && (
        <Weather weather={weather} displayLocation={displayLocation} />
      )}
    </div>
  );

  function Weather({ weather, displayLocation }) {
    const {
      temperature_2m_max: max,
      temperature_2m_min: min,
      time: dates,
      weathercode: codes,
    } = weather;
    console.log("weather", weather);
    return (
      <div>
        <h2>Weather {displayLocation}</h2>
        <ul className="weather">
          {dates.map((date, i) => (
            <Day
              date={date}
              code={codes.at(i)}
              max={max.at(i)}
              min={min.at(i)}
              key={date}
              isToday={i === 0}
            />
          ))}
        </ul>
      </div>
    );
  }

  function Day({ date, code, max, min, isToday }) {
    return (
      <li className="day">
        <span>{getWeatherIcon(code)}</span>
        <p>{isToday ? "Today" : formatDay(date)}</p>
        <p>
          {Math.floor(min)}&deg; &mdash; <strong>{Math.ceil(max)}&deg;</strong>
        </p>
      </li>
    );
  }
}
