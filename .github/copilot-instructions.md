# Copilot Instructions

- Stack: single-page static site (`index.html`, `styles.css`, `script.js`) deployed via GitHub Pages; no build or dependencies—test by opening `index.html` in a browser.
- Visual direction: Windows XP-inspired desktop; preserve gradients, Tahoma-like font stack, and taskbar/start-menu styling. Keep colors in the existing blue/green palette and avoid introducing new frameworks or icon sets.
- Windows model: each app window uses `.window` elements with ids like `profile-window`; show via `display: block` and `data-minimized="false"`. New windows should reuse the existing title bar + controls markup (`.window-titlebar`, `.btn-minimize`, `.btn-close`).
- Window behavior: focus via `activateWindow` to bump z-index and toggle `.active`; ensure taskbar buttons (class `taskbar-button`, `data-window-id`) are created through `ensureTaskbarButton` so minimize/restore works. Close removes its taskbar button; minimize hides and marks `data-minimized`.
- Dragging: windows are draggable from `.window-titlebar`; position clamped within viewport in `mousemove`. Keep drag logic intact when adding new interactive elements (avoid stopping propagation unless needed).
- Resizing: each window gets a `.window-resizer` (bottom-right). Resize state lives in the shared vars (`isResizing`, `resizeWin`, etc.) and is handled on `document` mousemove/up; maintain min sizes (220x120) if adding new windows.
- Icons: desktop icons are absolutely positioned; initial layout set in JS (base 10px offset, 80px vertical spacing). Keep `data-window` attributes to map icons to window ids and use `openWindowById` for opening.
- Start menu: toggled by `.start-button`; visibility via `.visible` class. Menu items open windows through `openWindowById` and then `closeStartMenu`. Clicking outside closes the menu—preserve this delegation when adding items. Current entries map to `profile-window`, `projects-window`, `contact-window`, and the demo `weather-window`.
- Taskbar clock: 24h `HH:MM  DD.MM.YYYY` format, updates every 30s in `updateClock`. Keep this format if adjusting time logic.
- Default state: on load, `openWindowById("profile-window")` shows the profile window; keep a default visible window to avoid an empty desktop.
- Content patterns: project cards live in `.project-item` blocks; contact info inside `.xp-list`. Update placeholder content but maintain structure for consistent styling.
- Weather window: pulls live Helsinki data via Open-Meteo from `#start-weather`; uses placeholders `#weather-temp`, `#weather-condition`, `#weather-meta`, `#weather-forecast`, `#weather-note`. Cache is 10 minutes—refresh by reopening or calling `loadWeather(true)` if you add a button. Weather text includes emoji per weather-code mapping in `script.js` to keep the playful XP feel.
- Responsiveness: basic rule at `max-width: 600px` sets windows to 90% width; add mobile tweaks in `styles.css` without breaking desktop layout.
- Accessibility/behavior: avoid right-click context menus; left-click/drag expectations mimic desktop. Maintain `rel="noopener noreferrer"` on external links.
- File hygiene: keep assets ASCII-only; prefer inline gradients over image assets. If adding media, host statically and reference relatively.
