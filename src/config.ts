interface Config {
  src: {
    readonly indentStr?: string;
    readonly commentStr: string;
  };

  flowchart: {
    readonly marginX: number;
    readonly marginY: number;
    readonly stepX: number;
    readonly stepY: number;
    readonly hlineMargin: number;
    readonly backgroundColor: string;
  };

  rect: {
    readonly padX: number;
    readonly padY: number;
    readonly attrs: any;
  };

  frame: {
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
    readonly attrs: any;
  };

  text: {
    readonly attrs: any;
  }

  // * 'yes', 'no' label of if-statement
  // * exception name of try-except statement
  label: {
    readonly attrs: any;
    readonly yesText: string;
    readonly noText: string;
    readonly marginX: number;
    readonly marginY: number;
  }
}

const STROKE_COLOR = 'black';

const defaultConfig: Config = {
  src: {
    // NOTE: this config is not used and any indent is available now
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

    // NOTE:
    // '' or 'none' or 'transparent' means no background rectangle.
    backgroundColor: 'white',
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
      'fill': 'none',
      'stroke-width': '2px',
    },
  },

  frame: {
    attrs: {
      'stroke': STROKE_COLOR,
      'fill': 'none',
      'stroke-dasharray': '2',
      'stroke-width': '2px',
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

    attrs: {
      'stroke': STROKE_COLOR,
      'fill': 'none',
      'stroke-width': '2px',
    },
  },

  path: {
    attrs: {
      'stroke': STROKE_COLOR,
      'fill': 'none',
      'stroke-linecap': 'square',
      'stroke-width': '2px',
    },
  },

  arrowHead: {
    size: 9,
    attrs: {
      'stroke': STROKE_COLOR,
      'fill': STROKE_COLOR,
      'stroke-width': '0px',
    },
  },

  text: {
    attrs: {
      'stroke': STROKE_COLOR,
      'fill': STROKE_COLOR,
      'font-size': '14px',
      'stroke-width': '0',
      /* font-weight': 'lighter', */
      /* font-family': 'monospace', */
    },
  },

  label: {
    yesText: 'Y',
    noText: 'N',
    marginX: 4,
    marginY: 4,

    attrs: {
      'stroke': STROKE_COLOR,
      'fill': STROKE_COLOR,
      'font-size': '10px',
      'font-weight': 'lighter',
    },
  },
};

const mergeConfig = (baseConfig: Config, config: any = {}): Config => {
  return {
    src: {
      ...baseConfig.src,
      ...(config.src || {}),
    },

    flowchart: {
      ...baseConfig.flowchart,
      ...(config.flowchart || {}),
    },

    rect: {
      ...baseConfig.rect,
      ...(config.rect || {}),
      attrs: {
        ...baseConfig.rect.attrs,
        ...(config.rect && config.rect.attrs || {}),
      }
    },

    diamond: {
      ...baseConfig.diamond,
      ...(config.diamond || {}),
      attrs: {
        ...baseConfig.diamond.attrs,
        ...(config.diamond && config.diamond.attrs || {}),
      }
    },

    path: {
      ...baseConfig.path,
      ...(config.path || {}),
      attrs: {
        ...baseConfig.path.attrs,
        ...(config.path && config.path.attrs || {}),
      }
    },

    arrowHead: {
      ...baseConfig.arrowHead,
      ...(config.arrowHead || {}),
      attrs: {
        ...baseConfig.arrowHead.attrs,
        ...(config.arrowHead && config.arrowHead.attrs || {}),
      }
    },

    text: {
      ...baseConfig.text,
      ...(config.text || {}),
      attrs: {
        ...baseConfig.text.attrs,
        ...(config.text && config.text.attrs || {}),
      }
    },

    frame: {
      ...baseConfig.frame,
      ...(config.frame || {}),
      attrs: {
        ...baseConfig.frame.attrs,
        ...(config.frame && config.frame.attrs || {}),
      }
    },

    label: {
      ...baseConfig.label,
      ...(config.label || {}),
      attrs: {
        ...baseConfig.label.attrs,
        ...(config.label && config.label.attrs || {}),
      }
    },
  }
};

const mergeDefaultConfig = (config: any = {}): Config => mergeConfig(defaultConfig, config);

export {Config, defaultConfig, mergeConfig, mergeDefaultConfig}
