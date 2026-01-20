# Digg Button Classic

remember when digg had those orange vote buttons? yeah, I missed them too.

this extension brings back the classic digg button style to the new digg.com. because the current buttons are boring and we deserve better.

## themes

5 different themes because why not:

- **classic** - the og orange/green digg buttons from like 2008
- **dark** - same vibe but for dark mode users
- **light** - clean minimal look if you're into that
- **cyberpunk** - neon pink and cyan, glowing effects, the whole thing
- **diggit** - reddit-style upvote/downvote arrows (you know the ones)

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

## building

```bash
./build.sh
```

spits out a `.xpi` file ready to distribute.

## privacy

this extension doesn't collect any data. doesn't phone home. doesn't track you. it just makes buttons look different. all your theme preference is stored locally in your browser.

## license

MIT - do whatever you want with it

## links

- [report bugs](https://github.com/FindWeedNY/digg-button-classic/issues)
- [digg.com](https://digg.com) - where this thing actually works

---

made with mass nostalgia for the old digg
