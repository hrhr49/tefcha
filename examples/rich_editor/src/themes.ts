import {
  mergeDefaultConfig,
  defaultConfig,
} from '../../../src/config';

const greenConfig = mergeDefaultConfig({
  text: {
    attrs: {
      'font-size': '14px',
      'stroke': 'white',
      'fill': 'white',
      'fill-opacity': '100%',
      'stroke-width': '0px',
    },
  },
  label: {
    attrs: {
      'font-size': '10px',
      'stroke': 'seagreen',
      'fill': 'seagreen',
      'fill-opacity': '100%',
    },
  },
  path: {
    attrs: {
      'stroke': 'dimgray',
      'stroke-width': '2px',
      'fill-opacity': '0%',
    },
  },
  rect: {
    attrs: {
      'stroke': 'darkcyan',
      'stroke-width': '2px',
      'fill': 'darkcyan',
      'fill-opacity': '100%',
      'rx': '3px',
      'ry': '3px',
    },
  },
  diamond: {
    attrs: {
      'stroke': 'seagreen',
      'stroke-width': '2px',
      'fill': 'seagreen',
      'fill-opacity': '100%',
    },
  },
  arrowHead: {
    attrs: {
      'stroke': 'dimgray',
      'stroke-width': '2px',
      'fill': 'dimgray',
      'fill-opacity': '100%',
    },
  },
});

const blueConfig = mergeDefaultConfig({
  text: {
    attrs: {
      'font-size': '14px',
      'stroke': 'white',
      'fill': 'white',
      'fill-opacity': '100%',
      'stroke-width': '0px',
    },
  },
  label: {
    attrs: {
      'font-size': '10px',
      'stroke': 'royalblue',
      'fill': 'royalblue',
      'fill-opacity': '100%',
    },
  },
  path: {
    attrs: {
      'stroke': 'dimgray',
      'stroke-width': '2px',
      'fill-opacity': '0%',
    },
  },
  rect: {
    attrs: {
      'stroke': 'steelblue',
      'stroke-width': '2px',
      'fill': 'steelblue',
      'fill-opacity': '100%',
      'rx': '3px',
      'ry': '3px',
    },
  },
  diamond: {
    attrs: {
      'stroke': 'royalblue',
      'stroke-width': '2px',
      'fill': 'royalblue',
      'fill-opacity': '100%',
    },
  },
  arrowHead: {
    attrs: {
      'stroke': 'dimgray',
      'stroke-width': '2px',
      'fill': 'dimgray',
      'fill-opacity': '100%',
    },
  },
});

export {
  defaultConfig,
  greenConfig,
  blueConfig,
}
