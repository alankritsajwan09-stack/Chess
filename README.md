# ♟️ Chess

A browser-based Chess game built with HTML, CSS, and JavaScript — featuring themed backgrounds and a gallery of legendary chess players.

## 🎮 Features

- Fully playable Chess board in the browser
- Custom themed backgrounds (Norse Realm, Chess World, Cover)
- Legendary chess players gallery (e.g. Viswanathan Anand, Wilhelm Steinitz, and more)
- Python script to automatically fetch legend images

## 🗂️ Project Structure

```
Chess/
├── Chess.html             # Main HTML file — open this to play
├── chess.js                # Game logic and board interactions
├── download_legends.py     # Script to download legend images
├── chess_world_bg.png      # Background image
├── cover_bg.png             # Cover/landing background image
├── norse_realm_bg.png      # Background image
└── legends/                 # Folder containing images of chess legends
```

## 🚀 Getting Started

### Play in your browser

1. Clone the repository:
   ```bash
   git clone https://github.com/alankritsajwan09-stack/Chess.git
   ```
2. Open `Chess.html` in your web browser.

That's it — no server or installation required.

### Optional: Re-download legend images

If you want to refresh or re-download the legend images used in the gallery:

```bash
python download_legends.py
```

## 🛠️ Built With

- **HTML** – structure and layout
- **JavaScript** – game logic
- **Python** – asset downloading utility

## 📌 Status

This project is a work in progress. Contributions, suggestions, and feedback are welcome.

## 📄 License

No license specified yet. Feel free to add one (e.g. MIT) if you'd like others to reuse this project.
