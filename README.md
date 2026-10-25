# SportsHub

A modern live sports scores and upcoming matches website powered by [API-Sports](https://api-sports.io).

## Features

- **Live Events** category — matches currently in progress (auto-refreshes every 30 seconds)
- **Upcoming** matches (today + tomorrow)
- **Sports Categories** — Football, Basketball, Baseball, Hockey, American Football, Volleyball
- **Country-wise timezone** selector (times shown in your local timezone)
- Live matches automatically appear in the Live tab when they start
- Responsive dark theme
- No backend required (client-side API calls)

## How to use

1. Open `index.html` in a browser
2. Or deploy to GitHub Pages
3. Select your timezone from the dropdown
4. Switch between Live / Upcoming / Sports tabs

## API Key

The site uses the provided API-Sports key. Free tier has request limits — refresh moderately.

## Tech

- Pure HTML, CSS, JavaScript
- Fetches from API-Sports endpoints (`/fixtures?live=all`, `/fixtures?date=...`, timezone support)

© 2026 SportsHub
