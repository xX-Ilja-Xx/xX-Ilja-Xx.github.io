document.addEventListener("DOMContentLoaded", () => {
  const icons = document.querySelectorAll(".icon");
  const windows = document.querySelectorAll(".window");
  const taskbarWindows = document.getElementById("taskbar-windows");
  const clockEl = document.getElementById("taskbar-clock");
  const desktopArea =
    document.querySelector(".desktop-icons") || document.querySelector(".desktop");

  // NEW: Start button + menu elements
  const startButton = document.querySelector(".start-button");
  const startMenu = document.getElementById("start-menu");
  const shutdownBtn = document.getElementById("start-shutdown");
  const startProfile = document.getElementById("start-profile");   // NEW
  const startProjects = document.getElementById("start-projects"); // NEW
  const startContact = document.getElementById("start-contact");   // NEW
  const startWeather = document.getElementById("start-weather");   // NEW

  // Weather UI refs
  const weatherTempEl = document.getElementById("weather-temp");
  const weatherConditionEl = document.getElementById("weather-condition");
  const weatherMetaEl = document.getElementById("weather-meta");
  const weatherForecastEl = document.getElementById("weather-forecast");
  const weatherNoteEl = document.getElementById("weather-note");
  const weatherEmojiEl = document.getElementById("weather-emoji");

  const WEATHER_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes
  let weatherCache = { timestamp: 0, data: null };

  const weatherLookup = {
    0: { text: "Clear sky", emoji: "☀️" },
    1: { text: "Mainly clear", emoji: "🌤️" },
    2: { text: "Partly cloudy", emoji: "⛅" },
    3: { text: "Overcast", emoji: "☁️" },
    45: { text: "Fog", emoji: "🌫️" },
    48: { text: "Fog", emoji: "🌫️" },
    51: { text: "Light drizzle", emoji: "🌦️" },
    53: { text: "Drizzle", emoji: "🌦️" },
    55: { text: "Heavy drizzle", emoji: "🌧️" },
    56: { text: "Light freezing drizzle", emoji: "🌧️" },
    57: { text: "Freezing drizzle", emoji: "🌧️" },
    61: { text: "Light rain", emoji: "🌧️" },
    63: { text: "Rain", emoji: "🌧️" },
    65: { text: "Heavy rain", emoji: "🌧️" },
    66: { text: "Light freezing rain", emoji: "🌧️" },
    67: { text: "Freezing rain", emoji: "🌧️" },
    71: { text: "Light snow", emoji: "🌨️" },
    73: { text: "Snow", emoji: "🌨️" },
    75: { text: "Heavy snow", emoji: "❄️" },
    77: { text: "Snow grains", emoji: "❄️" },
    80: { text: "Light rain showers", emoji: "🌦️" },
    81: { text: "Rain showers", emoji: "🌧️" },
    82: { text: "Violent rain showers", emoji: "⛈️" },
    85: { text: "Snow showers", emoji: "🌨️" },
    86: { text: "Heavy snow showers", emoji: "❄️" },
    95: { text: "Thunderstorm", emoji: "⛈️" },
    96: { text: "Thunderstorm + hail", emoji: "⛈️" },
    99: { text: "Thunderstorm + heavy hail", emoji: "⛈️" }
  };

  function getWeatherInfo(code) {
    return weatherLookup[code] || { text: "Weather", emoji: "🌈" };
  }

  function formatTime(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (err) {
      return "--:--";
    }
  }

  function setWeatherStatus(message) {
    if (weatherConditionEl) weatherConditionEl.textContent = message;
    if (weatherMetaEl) weatherMetaEl.textContent = "";
    if (weatherForecastEl) weatherForecastEl.innerHTML = "";
    if (weatherNoteEl) weatherNoteEl.textContent = "";
    if (weatherEmojiEl) weatherEmojiEl.textContent = "";
  }

  function renderWeather(data) {
    if (!data || !data.current_weather || !data.daily) {
      setWeatherStatus("Unable to load weather data.");
      if (weatherNoteEl) weatherNoteEl.textContent = "Check your connection and try again.";
      return;
    }

    const current = data.current_weather;
    const daily = data.daily;

    if (weatherTempEl) weatherTempEl.textContent = `${Math.round(current.temperature)}°C`;
    if (weatherConditionEl) {
      const { text } = getWeatherInfo(current.weathercode);
      const wind = Math.round(current.windspeed);
      weatherConditionEl.textContent = `${text} · Wind ${wind} km/h`;
    }
    if (weatherEmojiEl) {
      const { emoji } = getWeatherInfo(current.weathercode);
      weatherEmojiEl.textContent = emoji;
    }
    if (weatherMetaEl) {
      weatherMetaEl.textContent = `Updated ${formatTime(current.time)} · Source: Open-Meteo`;
    }

    if (weatherForecastEl) {
      weatherForecastEl.innerHTML = "";
      const days = daily.time || [];
      days.forEach((dayIso, idx) => {
        const maxArr = daily.temperature_2m_max || [];
        const minArr = daily.temperature_2m_min || [];
        const codeArr = daily.weathercode || [];
        const max = Math.round(maxArr[idx] ?? 0);
        const min = Math.round(minArr[idx] ?? 0);
        const code = codeArr[idx];
        const { text, emoji } = getWeatherInfo(code);

        const dayLabel = idx === 0
          ? "Today"
          : idx === 1
          ? "Tomorrow"
          : new Date(dayIso).toLocaleDateString([], { weekday: "short" });

        const item = document.createElement("div");
        item.className = "forecast-item";
        item.innerHTML = `
          <div class="forecast-day">${dayLabel}</div>
          <div class="forecast-temps">${max}°C / ${min}°C</div>
          <div class="forecast-note">${emoji} ${text}</div>
        `;
        weatherForecastEl.appendChild(item);
      });
    }

    if (weatherNoteEl) {
      weatherNoteEl.textContent = "Live Helsinki weather via Open-Meteo.";
    }
  }

  async function fetchWeatherData() {
    setWeatherStatus("Loading Helsinki weather...");
    const url = "https://api.open-meteo.com/v1/forecast?latitude=60.1699&longitude=24.9384&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&forecast_days=3&timezone=auto";

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      weatherCache = { timestamp: Date.now(), data: json };
      renderWeather(json);
    } catch (err) {
      setWeatherStatus("Could not fetch weather.");
      if (weatherNoteEl) weatherNoteEl.textContent = "Open-Meteo request failed; retry in a bit.";
    }
  }

  function loadWeather(force = false) {
    const age = Date.now() - weatherCache.timestamp;
    if (!force && weatherCache.data && age < WEATHER_MAX_AGE_MS) {
      renderWeather(weatherCache.data);
    } else {
      fetchWeatherData();
    }
  }

  let zIndexCounter = 10;

  function activateWindow(win) {
    zIndexCounter += 1;
    win.style.zIndex = zIndexCounter;
    windows.forEach(w => w.classList.remove("active"));
    win.classList.add("active");

    const id = win.id;
    const btn = taskbarWindows.querySelector(`[data-window-id="${id}"]`);
    if (btn) {
      taskbarWindows.querySelectorAll(".taskbar-button").forEach(b => b.classList.add("inactive"));
      btn.classList.remove("inactive");
    }
  }

  function ensureTaskbarButton(win) {
    const id = win.id;
    if (!taskbarWindows.querySelector(`[data-window-id="${id}"]`)) {
      const btn = document.createElement("button");
      btn.className = "taskbar-button";
      btn.dataset.windowId = id;
      btn.textContent = win.querySelector(".window-title").textContent || "Window";
      btn.addEventListener("click", () => {
        if (win.style.display === "none" || win.dataset.minimized === "true") {
          win.style.display = "block";
          win.dataset.minimized = "false";
          activateWindow(win);
        } else {
          win.style.display = "none";
          win.dataset.minimized = "true";
          btn.classList.add("inactive");
        }
      });
      taskbarWindows.appendChild(btn);
    }
  }

  // NEW: helper to open a window by id (used by icons + Start menu)
  function openWindowById(id) {
    if (!id) return;
    const win = document.getElementById(id);
    if (!win) return;
    win.style.display = "block";
    win.dataset.minimized = "false";
    ensureTaskbarButton(win);
    activateWindow(win);
  }

  icons.forEach(icon => {
    icon.addEventListener("dblclick", () => {
      const targetId = icon.dataset.window;
      openWindowById(targetId); // CHANGED: use helper
    });
  });

  windows.forEach(win => {
    const titlebar = win.querySelector(".window-titlebar");
    const btnClose = win.querySelector(".btn-close");
    const btnMin = win.querySelector(".btn-minimize");

    btnClose.addEventListener("click", () => {
      win.style.display = "none";
      // remove the taskbar button entirely when window is closed
      const btn = taskbarWindows.querySelector(`[data-window-id="${win.id}"]`);
      if (btn) {
        btn.remove();
      }
    });

    btnMin.addEventListener("click", () => {
      win.style.display = "none";
      win.dataset.minimized = "true";
      const btn = taskbarWindows.querySelector(`[data-window-id="${win.id}"]`);
      if (btn) {
        btn.classList.add("inactive");
      }
    });

    win.addEventListener("mousedown", () => {
      if (win.style.display !== "none") {
        activateWindow(win);
      }
    });

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    titlebar.addEventListener("mousedown", (e) => {
      isDragging = true;
      const rect = win.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      activateWindow(win);
      document.body.style.userSelect = "none";
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;
      win.style.left = Math.max(0, Math.min(window.innerWidth - 100, x)) + "px";
      win.style.top = Math.max(0, Math.min(window.innerHeight - 80, y)) + "px";
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
      document.body.style.userSelect = "";
    });

    // NEW: add bottom-right resize handle to this window
    const resizer = document.createElement("div");
    resizer.className = "window-resizer";
    win.appendChild(resizer);

    resizer.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      e.preventDefault();
      isResizing = true;
      resizeWin = win;
      const rect = win.getBoundingClientRect();
      startWidth = rect.width;
      startHeight = rect.height;
      resizeStartX = e.clientX;
      resizeStartY = e.clientY;
      activateWindow(win);
      document.body.style.userSelect = "none";
    });
  });

  // NEW: state for draggable desktop icons
  let activeIcon = null;
  let iconOffsetX = 0;
  let iconOffsetY = 0;

  // NEW: make desktop icons draggable within the desktop area
  icons.forEach((icon, index) => {
    icon.style.position = "absolute";

    // simple default layout if no position is set yet
    if (!icon.style.left && !icon.style.top) {
      const baseX = 10;
      const baseY = 10;
      const verticalSpacing = 80;
      icon.style.left = `${baseX}px`;
      icon.style.top = `${baseY + index * verticalSpacing}px`;
    }

    icon.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return; // left button only
      e.preventDefault();
      activeIcon = icon;
      const rect = icon.getBoundingClientRect();
      iconOffsetX = e.clientX - rect.left;
      iconOffsetY = e.clientY - rect.top;
      document.body.style.userSelect = "none";
    });
  });

  document.addEventListener("mousemove", (e) => {
    if (!activeIcon || !desktopArea) return;

    const desktopRect = desktopArea.getBoundingClientRect();
    const iconRect = activeIcon.getBoundingClientRect();

    let newLeft = e.clientX - desktopRect.left - iconOffsetX;
    let newTop = e.clientY - desktopRect.top - iconOffsetY;

    // clamp inside desktop bounds
    newLeft = Math.max(0, Math.min(desktopRect.width - iconRect.width, newLeft));
    newTop = Math.max(0, Math.min(desktopRect.height - iconRect.height, newTop));

    activeIcon.style.left = `${newLeft}px`;
    activeIcon.style.top = `${newTop}px`;
  });

  // NEW: state for resizing windows
  let isResizing = false;
  let resizeWin = null;
  let resizeStartX = 0;
  let resizeStartY = 0;
  let startWidth = 0;
  let startHeight = 0;

  // NEW: handle window resize on mousemove
  document.addEventListener("mousemove", (e) => {
    if (!isResizing || !resizeWin) return;

    const dx = e.clientX - resizeStartX;
    const dy = e.clientY - resizeStartY;

    const minWidth = 220;
    const minHeight = 120;

    const newWidth = Math.max(minWidth, startWidth + dx);
    const newHeight = Math.max(minHeight, startHeight + dy);

    resizeWin.style.width = `${newWidth}px`;
    resizeWin.style.height = `${newHeight}px`;
  });

  document.addEventListener("mouseup", () => {
    if (activeIcon) {
      activeIcon = null;
      document.body.style.userSelect = "";
    }
    // NEW: stop window resizing
    if (isResizing) {
      isResizing = false;
      resizeWin = null;
      document.body.style.userSelect = "";
    }
  });

  // NEW: small helper to close the Start menu
  function closeStartMenu() {
    if (!startMenu || !startButton) return;
    startMenu.classList.remove("visible");
    startButton.classList.remove("active");
  }

  // toggle Start menu on Start button click
  if (startButton && startMenu) {
    startButton.addEventListener("click", (e) => {
      e.stopPropagation();
      const willShow = !startMenu.classList.contains("visible");
      startMenu.classList.toggle("visible", willShow);
      startButton.classList.toggle("active", willShow);
    });
  }

  // NEW: open windows from Start menu items
  if (startProfile) {
    startProfile.addEventListener("click", (e) => {
      e.stopPropagation();
      openWindowById("profile-window");
      closeStartMenu();
    });
  }

  if (startProjects) {
    startProjects.addEventListener("click", (e) => {
      e.stopPropagation();
      openWindowById("projects-window");
      closeStartMenu();
    });
  }

  if (startContact) {
    startContact.addEventListener("click", (e) => {
      e.stopPropagation();
      openWindowById("contact-window");
      closeStartMenu();
    });
  }

  if (startWeather) {
    startWeather.addEventListener("click", (e) => {
      e.stopPropagation();
      openWindowById("weather-window");
      loadWeather();
      closeStartMenu();
    });
  }

  // close Start menu when clicking anywhere else
  document.addEventListener("click", (e) => {
    if (!startMenu || !startButton) return;
    if (
      !startMenu.contains(e.target) &&
      !startButton.contains(e.target)
    ) {
      closeStartMenu(); // CHANGED: use helper
    }
  });

  // NEW: "Shut Down..." closes the site (best-effort)
  if (shutdownBtn) {
    shutdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeStartMenu(); // CHANGED: use helper

      // try to close the window (works reliably for windows opened by script)
      try {
        window.open("", "_self");
        window.close();
      } catch (err) {
        // ignore
      }

      // fallback: navigate to blank page (effectively "closing" the site)
      window.location.href = "about:blank";
    });
  }

  function updateClock() {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, "0");
    const m = now.getMinutes().toString().padStart(2, "0");
    const d = now.getDate().toString().padStart(2, "0");
    const mo = (now.getMonth() + 1).toString().padStart(2, "0");
    const y = now.getFullYear();

    // time + date, e.g. "14:37  20.01.2026"
    clockEl.textContent = `${h}:${m}  ${d}.${mo}.${y}`;
  }
  updateClock();
  setInterval(updateClock, 30000);

  const profileWindow = document.getElementById("profile-window");
  if (profileWindow) {
    // CHANGED: use helper for consistency
    openWindowById("profile-window");
  }
});