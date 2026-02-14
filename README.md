# DrawingBoard

Minimal mobile-first drawing board web app.

## Features

- Draw with finger/touch (also works with mouse/stylus)
- Fixed brush: black, medium thickness
- `Delete Drawing` button:
	- Tap to clear the drawing (restorable)
	- Hold for 2 seconds to permanently delete (not restorable)
- Invisible secret area (top-left):
	- Press and hold to temporarily reveal the last deleted drawing
	- Release to hide it again

## Run

From the project root:

```bash
python3 -m http.server 8000
```

Open:

- `http://localhost:8000`

If testing on phone, open the same URL using your computer's local network IP (same Wi-Fi).