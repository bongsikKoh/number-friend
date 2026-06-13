# Number Friend

Number Friend is a small touch-friendly web app for playing with number block characters.
Children can create number friends, drag them around, merge them by overlapping, split them with a slicing gesture, and delete them from the playground.

The app is built as a static site with plain HTML, CSS, and JavaScript.

## Features

- Add number friends from 1 to 10.
- Merge two characters by dragging one onto another.
- Supports combined values up to 1000.
- Shows hundreds, tens, and ones using different colors based on the existing number color rules.
- Split an existing character by slicing across it from an empty area of the playground.
- Split count depends on finger count: one finger makes 2 parts, two fingers make 3 parts, and three fingers make 4 parts.
- Delete an existing character by dragging it to the trash zone or back toward the palette.
- Play in free mode, target-number mode, or split-quiz mode.
- Mobile and tablet friendly layout.

## Local Preview

From `C:\codex`, run:

```powershell
python -m http.server 8000 --bind 0.0.0.0
```

Then open:

```text
http://127.0.0.1:8000/number/
```

On a phone or tablet connected to the same Wi-Fi:

```text
http://192.168.50.163:8000/number/
```

The local IP can change depending on the network. Check it with:

```powershell
ipconfig
```

## Controls

- Use the mode tabs to switch between free play, target-number challenges, and split quizzes.
- Desktop: drag a number friend from the palette into the playground.
- Phone/tablet: tap a number friend in the palette to add it.
- Drag an existing character to move it.
- Drop one character onto another to merge them.
- Start from an empty playground area and swipe quickly across a character to split it.
- Use one finger for 2 parts, two fingers for 3 parts, and three fingers for 4 parts.
- Drag an existing character to the trash button to delete it.

## Deployment

This project is deployed as a static site.

Recommended Netlify settings:

- Build command: leave empty
- Publish directory: `.`

GitHub repository:

```text
https://github.com/bongsikKoh/number-friend
```

Once Netlify is connected to the GitHub repository, pushing to `main` will trigger a new deployment.

## Files

```text
index.html
styles.css
app.js
README.md
```
