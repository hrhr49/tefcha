import * as React from 'react';

import '@fontsource/roboto';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Tooltip from '@material-ui/core/Tooltip';

import SaveAltIcon from '@material-ui/icons/SaveAlt';
import InfoIcon from '@material-ui/icons/Info';

import {
  CollapseListItem,
} from './CollapseListItem';

interface IExportMenuProps {
  exportAsPNGFile: () => void;
  exportAsSVGFile: () => void;
  exportAsEditablePNGFile: () => void;
  exportAsEditableSVGFile: () => void;
  classes: any;
}

const ExportMenu = ({
  exportAsPNGFile,
  exportAsSVGFile,
  exportAsEditablePNGFile,
  exportAsEditableSVGFile,
  classes,
}: IExportMenuProps) => {
  return (
    <CollapseListItem
      title="Export"
      icon={<SaveAltIcon />}
    >
      <List component="div" disablePadding>
        <ListItem 
          button
          onClick={exportAsPNGFile}
          className={classes.nested}
        >
          <ListItemText primary={'PNG'} />
        </ListItem>
        <ListItem 
          button
          onClick={exportAsSVGFile}
          className={classes.nested}
        >
          <ListItemText primary={'SVG'} />
        </ListItem>
        <ListItem 
          button
          onClick={exportAsEditablePNGFile}
          className={classes.nested}
        >
          <ListItemText primary={'Editable PNG'} />
          <ListItemIcon>
            <Tooltip title="You can drag and drop this file to this editor to edit.">
              <InfoIcon />
            </Tooltip>
          </ListItemIcon>
        </ListItem>
        <ListItem 
          button
          onClick={exportAsEditableSVGFile}
          className={classes.nested}
        >
          <ListItemText primary={'Editable SVG'} />
          <ListItemIcon>
            <Tooltip title="You can drag and drop this file to this editor to edit.">
              <InfoIcon />
            </Tooltip>
          </ListItemIcon>
        </ListItem>
      </List>
    </CollapseListItem>
  );
};

export {
  ExportMenu
}
