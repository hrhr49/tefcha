interface Config {
  src: {
    indentStr: string;
    commentStr: string;
  };

  flowchart: {
    marginX: number;
    marginY: number;
    stepX: number;
    stepY: number;
  };

  rect: {
    padX: number;
    padY: number;
    attrs: any;
  };

  path: {
    attrs: any;
  };

  arrowHead: {
    size: number;
    attrs: any;
  };

  diamond: {
    aspectRatio: number;
    labelMarginX: number;
    labelMarginY: number;
    attrs: any;
  };

  text: {
    attrs: any;
  }

  // 'yes', 'no' label
  label: {
    attrs: any;
    yesText: string;
    noText: string;
  }
}

const OPACITY = '100%';
const STROKE_COLOR = 'black';
const FILL_COLOR = 'white';

const defaultConfig: Config = {
  src: {
    // indent need to be this string.
    indentStr: '  ',
    // line starts with this character is skipped by parser.
    commentStr: '#',
  },

  flowchart: {
    //                       svg width
    //          <------------------------------------>
    //        ^ +------------------------------------+
    //        | |                                    | ^
    // svg    | |                                    | | marginY
    // height | |                                    | v
    //        | |       +-------------------+        |
    //        | |       | flowchart         |        |
    //        | |       |                   |        |
    //        | |       |                   |        |
    //        | |       |                   |        |
    //        | |       |                   |        |
    //        | |       +-------------------+        |
    //        | |                                    | ^
    //        | |                                    | | marginY
    //        | |                                    | v
    //        v +------------------------------------+
    //          <------>                     <------->
    //           marginX                      marginX
    marginX: 35,
    marginY: 35,

    // branch1        branch2
    // +-----+        +-----+
    // | aaa |        | aaa |
    // +--+--+        +--+--+
    //    |              |
    //    |              |
    //    |              |
    // +--+--+        +--+--+
    // | bbb |        | bbb |
    // +-----+        +-----+
    //
    //       <------->
    //         stepX
    stepX: 24,

    // +-----+
    // | aaa |
    // +--+--+    ^
    //    |       |
    //    |       | stepY
    //    |       |
    // +--+--+    v
    // | bbb |
    // +-----+
    stepY: 24,
  },

  rect: {
    // +------------------------------------+
    // |                                    | ^
    // |                                    | | padY
    // |                                    | v
    // |          ###          ###          |
    // |         ## ##        ## ##         |
    // |        ##   ##      ##   ##        |
    // |       ##     ##    ##     ##       |
    // |       #########    #########       |
    // |       ##     ##    ##     ##       |
    // |       ##     ##    ##     ##       |
    // |                                    | ^
    // |                                    | | padY
    // |                                    | v
    // +------------------------------------+
    // <------>                     <------->
    //   padX                          padX
    padX: 12,
    padY: 8,

    attrs: {
      'stroke': STROKE_COLOR,
      'fill': FILL_COLOR,
      'stroke-width': '2px',
      'fill-opacity': '0%',
    },
  },

  diamond: {
    //              _
    //          _.-' '-._          ^
    //      _.-'         '-._      |
    //  _.-'                 '-._  |
    // '-._                   _.-' | height
    //     '-._           _.-'     |
    //         '-._   _.-'         |
    //             '-'             v
    // <------------------------->
    //  width
    //
    // diamondAspectRatio = height / width

    aspectRatio: 3 / 4,

    labelMarginX: 1,
    labelMarginY: 0,

    attrs: {
      'stroke': STROKE_COLOR,
      'fill': FILL_COLOR,
      'fill-opacity': '0%',
      'stroke-width': '2px',
    },
  },

  path: {
    attrs: {
      'stroke': STROKE_COLOR,
      'fill': STROKE_COLOR,
      'stroke-linecap': 'square',
      'stroke-width': '2px',
      'fill-opacity': '0%',
      'stroke-opacity': OPACITY,
    },
  },

  arrowHead: {
    size: 15,
    attrs: {
      'stroke': STROKE_COLOR,
      'fill': STROKE_COLOR,
      'fill-opacity': OPACITY,
      'stroke-width': '0px',
    },
  },

  text: {
    attrs: {
      'stroke': STROKE_COLOR,
      'fill': STROKE_COLOR,
      'fill-opacity': OPACITY,
      'font-size': '14px',
      'stroke-width': '0',
      /* font-weight': 'lighter', */
      /* font-family': 'monospace', */
    },
  },

  label: {
    yesText: 'Y',
    noText: 'N',

    attrs: {
      'stroke': STROKE_COLOR,
      'fill': STROKE_COLOR,
      'fill-opacity': OPACITY,
      'font-size': '10px',
      'font-weight': 'lighter',
    },
  },
};

const mergeDefaultConfig = (config: any = {}): Config => {
  return {
    src: {
      ...defaultConfig.src,
      ...(config.src || {}),
    },

    flowchart: {
      ...defaultConfig.flowchart,
      ...(config.flowchart || {}),
    },

    rect: {
      ...defaultConfig.rect,
      ...(config.rect || {}),
    },

    diamond: {
      ...defaultConfig.diamond,
      ...(config.diamond || {}),
    },

    path: {
      ...defaultConfig.path,
      ...(config.path || {}),
    },

    arrowHead: {
      ...defaultConfig.arrowHead,
      ...(config.arrowHead || {}),
    },

    text: {
      ...defaultConfig.text,
      ...(config.text || {}),
    },

    label: {
      ...defaultConfig.label,
      ...(config.label || {}),
    },
  }
};

export {Config, defaultConfig, mergeDefaultConfig}
