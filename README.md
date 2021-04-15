# NasaNeoWsWeeklyVis

A data viz weekly viewer for the [NASA NeoWs service](https://api.nasa.gov/).

# Running

To try it out, download the repository and serve as a static app. For example, use python:
```
python -m SimpleHTTPServer 8888
```

And then type `localhost:8888` in your browser.

## Notes

This is a work in progress. Missing stuff:
- Arrows at the bottom left.
- Tooltips over the asteroids.
- Proper grouping of legend labels and drawings in the SVG containers.
- Finding and applying a nicer font.
- A production build (webpack, babelization etc).
- A lot of code reorganization to avoid duplicate sections, magic numbers, etc.

## Attribution
Favicon by [Freepik](https://www.freepik.com) from [Flaticon](www.flaticon.com)
