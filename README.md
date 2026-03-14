# Digg Button Classic

⚠️ digg.com shut down, this is now archived.

remember when digg had those orange vote buttons? yeah, I missed them too.

this extension brings back the classic digg button style to the new digg.com. because the current buttons are boring and we deserve better.

## themes

5 built-in themes + fully customizable:

| minimal | classic | diggit |
|---------|---------|--------|
| ![minimal](docs/screenshot.png) | ![classic](docs/screenshot-2.png) | ![diggit](docs/screenshot-3.png) |

| chevron | cyberpunk | custom |
|---------|-----------|--------|
| ![chevron](docs/screenshot-4.png) | ![cyberpunk](docs/screenshot-5.png) | ![custom](docs/screenshot-6.png) |

- **minimal** - clean inline arrows with vote state colors
- **classic** - the og digg buttons repositioned to the left with labels
- **diggit** - reddit-style upvote/downvote colors
- **chevron** - replaces arrows with chevron style
- **cyberpunk** - neon pink and cyan with glowing effects
- **custom** - full control with visual color picker (see below)

all themes support a **dark/light mode toggle** in the popup header.

## install

### firefox
from add-ons store (recommended): search "digg button classic" on addons.mozilla.org

manual: download `.xpi` from [releases](https://github.com/FindWeedNY/digg-button-classic/releases) > about:addons > gear icon > install add-on from file

### chrome
from chrome web store (recommended): search "digg button classic"

manual: download `.zip` from [releases](https://github.com/FindWeedNY/digg-button-classic/releases) > unzip > chrome://extensions > developer mode on > load unpacked > select the folder

### for development
1. clone this repo
2. `./build.sh` to generate both packages
3. firefox: about:debugging > load temporary add-on > select manifest.json
4. chrome: chrome://extensions > load unpacked > select the folder

## usage

click the extension icon, pick a theme. that's it. it saves your choice.

## custom themes

select "Custom" and use the built-in **visual color picker** to create your own theme:

- **arrow colors** - click any swatch to pick colors for dugg, buried, and unvoted states
- **background colors** - optional backgrounds for voted buttons (double-click to reset to auto)
- **hex input** - type hex codes directly if you prefer
- **quick presets** - one-click palettes like Reddit, Stonks, Vapor, etc.

**options:**
- **layout** - inline (default) or side (classic digg-style with labels)
- **style** - arrow (default) or chevron
- **effects** - glow, bold, outline

**palette string format** (for sharing):
```
#upvote,#downvote,#neutral,#upBg,#downBg,#neutralBg;effects
```

background colors are optional. example palettes:
```
#50fa7b,#ff5555,#6272a4                   (dracula)
#ff71ce,#01cdfe,#b967ff;glow              (vaporwave)
#16a34a,#dc2626,#6b7280                   (stonks)
#a855f7,#ec4899,#6366f1                   (vapor)
```

paste any palette string into the text input at the bottom to import it.

## building

```bash
make build    # or ./build.sh
make test     # run tests
make lint     # run linter
```

spits out `.xpi` (Firefox) and `.zip` (Chrome) files ready to distribute.

## privacy

this extension doesn't collect any data. doesn't phone home. doesn't track you. it just makes buttons look different. all your theme preference is stored locally in your browser.

## license

MIT - do whatever you want with it

## links

- [report bugs](https://github.com/FindWeedNY/digg-button-classic/issues)
- [digg.com](https://digg.com) - where this thing actually works

---

made with mass nostalgia for the old digg
