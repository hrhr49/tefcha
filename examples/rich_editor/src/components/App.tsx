import * as React from 'react';

import '@fontsource/roboto';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';

import clsx from 'clsx';
import { Theme, createStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import CssBaseline from '@material-ui/core/CssBaseline';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';

import { Editor } from './Editor';
import { Tefcha } from './Tefcha';

import { ExportMenu } from './ExportMenu';
import { ThemeMenu } from './ThemeMenu';
import { ConfigMenu } from './ConfigMenu';
import { OtherMenu } from './OtherMenu';

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


const createRandomSrcWithComment = () => {
  return [
    '# This code is generated randomly',
    '',
    ...createRandomSrc({lineNum: 30}),
    'end'
  ].join('\n');
};


// const useStyles = makeStyles((theme) => ({
//   root: {
//     flexGrow: 1,
//   },
//   paper: {
//     padding: theme.spacing(2),
//     textAlign: 'center',
//     color: theme.palette.text.secondary,
//   },
// }));

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
      flexGrow: 1,
      padding: theme.spacing(3),
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      marginLeft: -drawerWidth,
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
    },
    nested: {
      paddingLeft: theme.spacing(4),
    },
  }),
);

const App = () => {
  const classes = useStyles();
  const [src, setSrc] = React.useState(createRandomSrcWithComment());
  const [errMsg, setErrMsg] = React.useState('');
  const [errLineNo, setErrLineNo] = React.useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [tefchaConfig, setTefchaConfig] = React.useState(blueConfig);

  const svgElRef = React.useRef(null);

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

  const onTefchaSuccess = React.useCallback((svgEl: SVGUseElement) => {
    setErrMsg('');
    setErrLineNo(0);
    svgElRef.current = svgEl;
  }, [errMsg, errLineNo]);

  const exportAsPNGFile = () => {
    if (svgElRef.current !== null) {
      downloadAsPNGFile(svgElRef.current);
    }
  };

  const exportAsSVGFile = () => {
    if (svgElRef.current !== null) {
      downloadAsSVGFile(svgElRef.current);
    }
  };

  const onRandomSrc = React.useCallback(() => {
    setSrc(createRandomSrcWithComment());
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
            Tefcha: Convert Text to Flowchart
          </Typography>
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
            onChange={({formData}: any) => {setTefchaConfig(formData)}}
            formData={tefchaConfig}
          />
          <OtherMenu
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
        <div className={classes.drawerHeader} />
        <Grid container spacing={3}>
          <Grid item xs={6}>
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
          </Grid>
          <Grid item xs={6}>
            <Paper className={classes.paper}>
              <Tefcha
                src={src}
                onError={onTefchaError}
                onSuccess={onTefchaSuccess}
                config={tefchaConfig}
              />
            </Paper>
          </Grid>
        </Grid>
      </main>
    </div>
  );
}

export {
  App,
}
