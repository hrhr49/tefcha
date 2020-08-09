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
  };

  diamond: {
    yesText: string;
    noText: string;
    aspectRatio: number;
    labelMarginX: number;
    labelMarginY: number;
  };
}
const defaultConfig: Config = {
  flowchart: {
    marginX: 30,
    marginY: 30,

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
    stepX: 20,

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

    yesText: 'yes',
    noText: 'no',

    labelMarginX: 5,
    labelMarginY: 30,
  },
};

export {Config, defaultConfig}
