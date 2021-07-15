import '../style.css';
import * as React from 'react';

import '@fontsource/roboto';
import { createStyles, alpha, Theme, makeStyles } from '@material-ui/core/styles';

import clsx from 'clsx';
import Input from '@material-ui/core/Input';
import InputAdornment from '@material-ui/core/InputAdornment';

import Drawer from '@material-ui/core/Drawer';
import CssBaseline from '@material-ui/core/CssBaseline';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import Slider from '@material-ui/core/Slider';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';

import MenuIcon from '@material-ui/icons/Menu';

import SplitPane from 'react-split-pane';

import { Editor } from './Editor';
import { Tefcha } from './Tefcha';

import { ExportMenu } from './ExportMenu';
import { ThemeMenu } from './ThemeMenu';
import { ConfigMenu } from './ConfigMenu';
import { RandomSrcMenu } from './RandomSrcMenu';

import {
  downloadAsPNGFile,
  downloadAsSVGFile,
} from '../utils';

import {
  blueConfig,
} from '../themes';

import {
  createRandomSrc,
} from '../../../../tests/fuzzing/create_random_src';


const createRandomSrcWithComment = (param: any) => {
  return [
    '# This code is generated randomly',
    '',
    ...createRandomSrc(param),
    'end'
  ].join('\n');
};


const drawerWidth = 440;
const appBarHeight = 64;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
    },
    appBar: {
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
    },
    toolBarRight: {
      position: 'relative',
      borderRadius: theme.shape.borderRadius,
      backgroundColor: alpha(theme.palette.common.white, 0.15),
      '&:hover': {
        backgroundColor: alpha(theme.palette.common.white, 0.25),
      },
      marginLeft: 0,
      width: '100%',
      [theme.breakpoints.up('sm')]: {
        marginLeft: theme.spacing(1),
        width: 'auto',
      },
    },
    appBarShift: {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: drawerWidth,
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    hide: {
      display: 'none',
    },
    drawer: {
      //     marginTop: appBarHeight,
      width: drawerWidth,
      flexShrink: 0,
    },
    drawerPaper: {
      height: `calc(100% - ${appBarHeight}px)`,
      marginTop: appBarHeight,
      width: drawerWidth,
    },
    drawerHeader: {
      // marginTop: appBarHeight,
      display: 'flex',
      alignItems: 'center',
      padding: theme.spacing(0, 1),
      // necessary for content to be below app bar
      ...theme.mixins.toolbar,
      justifyContent: 'flex-end',
    },
    content: {
      marginTop: appBarHeight,
      flexGrow: 1,
      // padding: theme.spacing(3),
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      marginLeft: -drawerWidth,
      height: `calc(100vh - ${appBarHeight}px)`,
    },
    contentShift: {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    },
    paper: {
      padding: theme.spacing(2),
      textAlign: 'center',
      color: theme.palette.text.secondary,
      height: '100%',
    },
    nested: {
      paddingLeft: theme.spacing(4),
    },
    resizerVertical: {
      height: `calc(100% - ${appBarHeight}px - ${theme.spacing(3)}px)`,
    },
    scaleSlider: {
      color: theme.palette.common.white,
      margin: theme.spacing(1),
      minWidth: 120,
      maxWidth: 300,
      marginLeft: 0,
    },
    scaleInput: {
      // position: 'relative',
      // width: 42,
      color: theme.palette.common.white,
      borderRadius: theme.shape.borderRadius,
      backgroundColor: alpha(theme.palette.common.white, 0.15),
      '&:hover': {
        backgroundColor: alpha(theme.palette.common.white, 0.25),
      },
      marginLeft: 0,
      width: '100%',
      [theme.breakpoints.up('sm')]: {
        marginLeft: theme.spacing(1),
        width: 'auto',
      },
    },
    scaleLabel: {
      display: 'inline',
      color: theme.palette.common.white,
      margin: theme.spacing(1),
      minWidth: 120,
    },
    scaleSelect: {
      color: theme.palette.common.white,
      borderRadius: theme.shape.borderRadius,
      backgroundColor: alpha(theme.palette.common.white, 0.15),
      '&:hover': {
        backgroundColor: alpha(theme.palette.common.white, 0.25),
      },
      margin: theme.spacing(1),
      minWidth: 120,
    },
    formControl: {
      margin: theme.spacing(1),
      minWidth: 120,
    },
  }),
);

const AUTO_SCALE_TYPE_LIST = ['None', '100%', 'Width', 'Height', 'Auto'] as const;
type AutoScaleType = (typeof AUTO_SCALE_TYPE_LIST)[number];
{/* 'None' | '100%' | 'Width' | 'Height' | 'Auto' */}

const isAutoScaleType = (obj: any): obj is AutoScaleType => {
  return AUTO_SCALE_TYPE_LIST.includes(obj);
};

const App = () => {
  const defaultEditorWidth = 300;

  const classes = useStyles();
  const [src, setSrc] = React.useState(createRandomSrcWithComment({lineNum: 20}));
  const [errMsg, setErrMsg] = React.useState('');
  const [errLineNo, setErrLineNo] = React.useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [tefchaConfig, setTefchaConfig] = React.useState(blueConfig);
  const [screenWidth, setScreenWidth] = React.useState(window.innerWidth);
  const [screenHeight, setScreenHeight] = React.useState(window.innerHeight);
  const [editorWidth, setEditorWidth] = React.useState(defaultEditorWidth);
  const [flowchatScalePercent, setFlowchatScalePercent] = React.useState(100);
  const [autoScaleType, setAutoScaleType] = React.useState<AutoScaleType>('None');

  const flowchatViewWidth = screenWidth - editorWidth;
  const flowchatViewHeight = screenHeight - appBarHeight;

  const svgRef = React.useRef(null);

  const applyScale = React.useCallback(() => {
    console.log('applyScale');
    if (svgRef.current !== null) {
    console.log('OK');
      const originalWidth = Number(svgRef.current.getAttribute('width'));
      const originalHeight = Number(svgRef.current.getAttribute('height'));

      let scale = flowchatScalePercent / 100;
      switch (autoScaleType) {
        case 'None': {
          // do nothing
          break;
        }
        case '100%': {
          scale = 1.0;
          break;
        }
        case 'Width': {
          scale = flowchatViewWidth / originalWidth;
          break;
        }
        case 'Height': {
          scale = flowchatViewHeight / originalHeight;
          break;
        }
        case 'Auto': {
          scale = Math.min(
            flowchatViewWidth / originalWidth,
            flowchatViewHeight / originalHeight
          );
          break;
        }
        default: {
          const _: never = autoScaleType;
          throw `invalid autoScaleType: ${_}`;
        }
      }
      console.log(autoScaleType);
      console.log(scale);
      svgRef.current.style['transform-origin'] = 'top left';
      svgRef.current.style['transform'] = `scale(${scale})`;
    }
  }, [svgRef, autoScaleType, flowchatScalePercent, flowchatViewWidth, flowchatViewHeight]);

  React.useEffect(() => {
    const updateScreenState = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setScreenWidth(width);
      setScreenHeight(height);
    };

    window.addEventListener('resize', updateScreenState);

    return () => window.removeEventListener('resize', updateScreenState);
  }, [setScreenWidth, setScreenHeight]);

  const toggleIsDrawerOpen = React.useCallback(() => {
    setIsDrawerOpen(!isDrawerOpen);
  }, [isDrawerOpen]);

  const onSrcChange = React.useCallback((value: string) => {
    setSrc(value);
  }, [src]);

  const onTefchaError = React.useCallback((error: any) => {
    setErrMsg(String(error));
    if (error?.type === 'tefcha' && 'lineno' in error) {
      setErrLineNo(error.lineno - 1);
    } else {
      setErrLineNo(0);
    }
  }, [errMsg, errLineNo]);

  const onTefchaSuccess = React.useCallback(() => {
    setErrMsg('');
    setErrLineNo(0);
    applyScale();
  }, [errMsg, errLineNo, flowchatScalePercent,
svgRef, autoScaleType, flowchatViewWidth, flowchatViewHeight
  ]);


  React.useEffect(() => {
    applyScale();
  }, [svgRef, flowchatScalePercent, autoScaleType, flowchatViewWidth, flowchatViewHeight])

  const exportAsPNGFile = () => {
    if (svgRef.current !== null) {
      downloadAsPNGFile(svgRef.current);
    }
  };

  const exportAsSVGFile = () => {
    if (svgRef.current !== null) {
      downloadAsSVGFile(svgRef.current);
    }
  };

  const onRandomSrc = React.useCallback((param: any) => {
    setSrc(createRandomSrcWithComment(param));
  }, [src, setSrc]);

  return (
    <div className={classes.root}>
      <CssBaseline />
          {/* [classes.appBarShift]: isDrawerOpen, */}
      <AppBar
        position="fixed"
        className={clsx(classes.appBar, {
        })}
      >
        <Toolbar>
            <IconButton
              color="inherit"
              onClick={toggleIsDrawerOpen}
              edge="start"
              className={clsx(classes.menuButton)}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap>
              Tefcha
            </Typography>
            {/* put components at rightside by 'flexGrow: 1' */}
            <div style={{ flexGrow: 1 }}></div>
            <Slider
              value={typeof flowchatScalePercent === 'number' ? flowchatScalePercent : 0}
              onChange={(_e: any, v: any) => {
                setFlowchatScalePercent(v);
              }}
              defaultValue={100}
              step={1}
              min={1}
              max={400}
              disabled={autoScaleType !== 'None'}
              className={classes.scaleSlider}
            />
            <Input
              className={classes.scaleInput}
              value={flowchatScalePercent}
              margin="dense"
              endAdornment={<InputAdornment position="end">%</InputAdornment>}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                try {
                  const value = Number(event.target.value)
                  setFlowchatScalePercent(value);
                } catch(e) {
                  console.error(e);
                }
              }}
              onBlur={() => {
                if (flowchatScalePercent < 1) {
                  setFlowchatScalePercent(1);
                } else if (flowchatScalePercent > 400) {
                  setFlowchatScalePercent(400);
                }
              }}
              inputProps={{
                step: 1,
                min: 1,
                max: 400,
                type: 'number',
                'aria-labelledby': 'input-slider',
              }}
              disabled={autoScaleType !== 'None'}
            />
            <Select
              className={classes.scaleSelect}
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={autoScaleType}
              onChange={(event: React.ChangeEvent<{value: unknown}>) => {
                const value = event.target.value;
                if (isAutoScaleType(value)) {
                  setAutoScaleType(value);
                } else {
                  throw `value is invalid: ${value}`;
                }
              }}
            >
              <MenuItem value='None'>Scale-None</MenuItem>
              <MenuItem value='100%'>Scale-100%</MenuItem>
              <MenuItem value='Width'>Scale-Width</MenuItem>
              <MenuItem value='Height'>Scale-Height</MenuItem>
              <MenuItem value='Auto'>Scale-Auto</MenuItem>
            </Select>
        </Toolbar>
      </AppBar>
      <Drawer
        className={classes.drawer}
        variant="persistent"
        anchor="left"
        open={isDrawerOpen}
        classes={{
          paper: classes.drawerPaper,
        }}
      >
        <List>
          <ExportMenu
            classes={classes}
            exportAsPNGFile={exportAsPNGFile}
            exportAsSVGFile={exportAsSVGFile}
          />
          <ThemeMenu
            classes={classes}
            onSelect={setTefchaConfig}
          />
          <ConfigMenu
            classes={classes}
            onSubmit={({formData}: any) => {setTefchaConfig(formData)}}
            onChange={({formData, errors}: any) => {
              if (errors.length === 0) {
                setTefchaConfig(formData);
              }
            }}
            formData={tefchaConfig}
          />
          <RandomSrcMenu
            classes={classes}
            onRandomSrc={onRandomSrc}
          />
        </List>
      </Drawer>
          {/* [classes.contentShift]: isDrawerOpen, */}
      <main
        className={clsx(classes.content, {
        })}
      >
        <SplitPane
          split="vertical"
          minSize={100}
          defaultSize={defaultEditorWidth}
          style={
            { height: `calc(100% - ${appBarHeight}px)`}
          }
          onChange={(newSize: number) => {
            setEditorWidth(newSize);
            }
          }
        >
          <Editor
            value={src}
            onChange={onSrcChange}
            annotations={
              errMsg ? [{
                row: errLineNo,
                column: 0,
                type: 'error',
                text: errMsg,
                }] : []
              }
            />
            <div style={{
              overflow: 'scroll',
              height: '100%',
              width: flowchatViewWidth
              }}
            >
      
              <Tefcha
                src={src}
                svgRef={svgRef}
                onError={onTefchaError}
                onSuccess={onTefchaSuccess}
                config={tefchaConfig}
              />
            </div>
          </SplitPane>
        </main>
      </div>
  );
}

export {
  App,
}
