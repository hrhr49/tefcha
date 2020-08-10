interface Config {
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
const defaultConfig: Config = {
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
    marginX: 50,
    marginY: 50,

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
    stepX: 30,

    // +-----+
    // | aaa |
    // +--+--+    ^
    //    |       |
    //    |       | stepY
    //    |       |
    // +--+--+    v
    // | bbb |
    // +-----+
    stepY: 30,
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
      'stroke': 'black',
      'fill': 'white',
      'stroke-width': '3px',
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

    labelMarginX: 5,
    labelMarginY: 25,

    attrs: {
      'stroke': 'black',
      'fill': 'white',
      'fill-opacity': '0%',
      'stroke-width': '3px',
    },
  },

  path: {
    attrs: {
      'stroke': 'black',
      'fill': 'black',
      'stroke-linecap': 'square',
      'stroke-width': '3px',
      'fill-opacity': '0%',
    },
  },

  arrowHead: {
    attrs: {
      'stroke': 'black',
      'fill': 'black',
      'fill-opacity': '100%',
      'stroke-width': '0px',
    },
  },

  text: {
    attrs: {
      'stroke': 'black',
      'fill': 'black',
      'fill-opacity': '100%',
      'font-size': '30px',
      'stroke-width': '0',
      /* font-weight': 'lighter', */
      /* font-family': 'monospace', */
    }
  },

  label: {
    yesText: 'y',
    noText: 'n',

    attrs: {
      'stroke': 'black',
      'fill': 'black',
      'fill-opacity': '100%',
      'font-size': '20px',
      'font-weight': 'lighter',
    }
  },
};

export {Config, defaultConfig}
