import '../style.css';
import * as React from 'react';

import '@fontsource/roboto';
import { createStyles, alpha, Theme, makeStyles } from '@material-ui/core/styles';

import clsx from 'clsx';

import Drawer from '@material-ui/core/Drawer';
import CssBaseline from '@material-ui/core/CssBaseline';
import List from '@material-ui/core/List';

import SplitPane from 'react-split-pane';

import { Editor } from './Editor';

import { ExportMenu } from './ExportMenu';
import { ThemeMenu } from './ThemeMenu';
import { ConfigMenu } from './ConfigMenu';
import { RandomSrcMenu } from './RandomSrcMenu';

import { CustomAppBar } from './CustomAppBar';

import { FlowchartView } from './FlowchartView';

import {
  downloadAsPNGFile,
  downloadAsSVGFile,
} from '../utils';

import {
  blueConfig,
} from '../themes';

import {
  createRandomSrc,
} from '../../../../tests/fuzzing/create-random-src';

import {
  AutoScaleType,
} from '../types';


const createRandomSrcWithComment = (param: any) => {
  return [
    '# This code is generated randomly',
    '',
    ...createRandomSrc(param),
    'end'
  ].join('\n');
};


const drawerWidth = Math.max(Math.floor(window.innerWidth * 0.3), 280);
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
    menuButton: {
      marginRight: theme.spacing(2),
    },
    hide: {
      display: 'none',
    },
    drawer: {
      width: drawerWidth,
      flexShrink: 0,
    },
    drawerPaper: {
      height: `calc(100% - ${appBarHeight}px)`,
      marginTop: appBarHeight,
      width: drawerWidth,
    },
    content: {
      marginTop: appBarHeight,
      flexGrow: 1,
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
      [theme.breakpoints.up('xs')]: {
        color: theme.palette.common.white,
        marginLeft: 0,
      },
      [theme.breakpoints.down('xs')]: {
        color: theme.palette.primary.main,
      },
      margin: theme.spacing(1),
      minWidth: 100,
      maxWidth: 300,
    },
    scaleInput: {
      [theme.breakpoints.up('xs')]: {
        color: theme.palette.common.white,
        backgroundColor: alpha(theme.palette.common.white, 0.15),
        '&:hover': {
          backgroundColor: alpha(theme.palette.common.white, 0.25),
        },
        marginLeft: 0,
      },
      [theme.breakpoints.down('xs')]: {
        color: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.common.white, 0.9),
        '&:hover': {
          backgroundColor: alpha(theme.palette.common.white, 1.0),
        },
      },
      borderRadius: theme.shape.borderRadius,
      margin: theme.spacing(1),
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
      minWidth: 100,
    },
    scaleSelect: {
      [theme.breakpoints.up('xs')]: {
        color: theme.palette.common.white,
        backgroundColor: alpha(theme.palette.common.white, 0.15),
        '&:hover': {
          backgroundColor: alpha(theme.palette.common.white, 0.25),
        },
        marginLeft: 0,
      },
      [theme.breakpoints.down('xs')]: {
        color: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.common.white, 0.9),
        '&:hover': {
          backgroundColor: alpha(theme.palette.common.white, 1.0),
        },
      },
      margin: theme.spacing(1),
      minWidth: 100,
    },
    formControl: {
      margin: theme.spacing(1),
      minWidth: 100,
    },
  }),
);


const App = () => {
  const defaultEditorWidth = drawerWidth;

  const classes = useStyles();

  // States
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

  // Refs
  const svgRef = React.useRef(null);

  // Effects
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

  // Callbacks
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
  }, [errMsg, errLineNo, flowchatScalePercent,
svgRef, autoScaleType, flowchatViewWidth, flowchatViewHeight
  ]);

  const onRandomSrc = React.useCallback((param: any) => {
    setSrc(createRandomSrcWithComment(param));
  }, [src, setSrc]);

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

  return (
    <div className={classes.root}>
      <CssBaseline />
      <CustomAppBar
        classes={classes}
        flowchatScalePercent={flowchatScalePercent}
        autoScaleType={autoScaleType}
        onClickDrawerButton={toggleIsDrawerOpen}
        onFlowcharScalePercentChange={setFlowchatScalePercent}
        onAutoScaleTypeChange={setAutoScaleType}
      />
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
            onImport={(data: any) => {
              setTefchaConfig(data);
            }}
            formData={tefchaConfig}
          />
          <RandomSrcMenu
            classes={classes}
            onRandomSrc={onRandomSrc}
          />
        </List>
      </Drawer>
      <main
        className={clsx(classes.content, {
        })}
      >
        <SplitPane
          split="vertical"
          minSize={10}
          defaultSize={defaultEditorWidth}
          style={{ height: flowchatViewHeight}}
          onChange={setEditorWidth}
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
      
              <FlowchartView
                src={src}
                svgRef={svgRef}
                scalePercent={flowchatScalePercent}
                autoScaleType={autoScaleType}
                width={flowchatViewWidth}
                height={flowchatViewHeight}
                onTefchaError={onTefchaError}
                onTefchaSuccess={onTefchaSuccess}
                tefchaConfig={tefchaConfig}
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
