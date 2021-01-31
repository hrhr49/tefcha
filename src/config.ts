interface Config {
  src: {
    readonly indentStr: string;
    readonly commentStr: string;
  };

  flowchart: {
    readonly marginX: number;
    readonly marginY: number;
    readonly stepX: number;
    readonly stepY: number;
    readonly hlineMargin: number;
  };

  rect: {
    readonly padX: number;
    readonly padY: number;
    readonly attrs: any;
  };

  path: {
    readonly attrs: any;
  };

  arrowHead: {
    readonly size: number;
    readonly attrs: any;
  };

  diamond: {
    readonly aspectRatio: number;
    readonly labelMarginX: number;
    readonly labelMarginY: number;
    readonly attrs: any;
  };

  text: {
    readonly attrs: any;
  }

  // 'yes', 'no' label
  label: {
    readonly attrs: any;
    readonly yesText: string;
    readonly noText: string;
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

    //      +-----+
    //      | aaa |
    //      +--+--+    
    //         |       
    //         |       
    //         |    hline
    //  <-----------------............ ^
    //         |                       |
    //         |                       | hlineMargin
    //         |                       |
    //      +--+--+................... v
    //      | bbb |
    //      +-----+
    hlineMargin: 24,
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
      'fill': 'none',
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
      attrs: {
        ...defaultConfig.rect.attrs,
        ...(config.rect && config.rect.attrs || {}),
      }
    },

    diamond: {
      ...defaultConfig.diamond,
      ...(config.diamond || {}),
      attrs: {
        ...defaultConfig.diamond.attrs,
        ...(config.diamond && config.diamond.attrs || {}),
      }
    },

    path: {
      ...defaultConfig.path,
      ...(config.path || {}),
      attrs: {
        ...defaultConfig.path.attrs,
        ...(config.path && config.path.attrs || {}),
      }
    },

    arrowHead: {
      ...defaultConfig.arrowHead,
      ...(config.arrowHead || {}),
      attrs: {
        ...defaultConfig.arrowHead.attrs,
        ...(config.arrowHead && config.arrowHead.attrs || {}),
      }
    },

    text: {
      ...defaultConfig.text,
      ...(config.text || {}),
      attrs: {
        ...defaultConfig.text.attrs,
        ...(config.text && config.text.attrs || {}),
      }
    },

    label: {
      ...defaultConfig.label,
      ...(config.label || {}),
      attrs: {
        ...defaultConfig.label.attrs,
        ...(config.label && config.label.attrs || {}),
      }
    },
  }
};

export {Config, defaultConfig, mergeDefaultConfig}
