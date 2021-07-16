import * as React from 'react';

import '@fontsource/roboto';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import SaveAltIcon from '@material-ui/icons/SaveAlt';

import {
  CollapseListItem,
} from './CollapseListItem';

interface IExportMenuProps {
  exportAsPNGFile: () => void;
  exportAsSVGFile: () => void;
  classes: any;
}

const ExportMenu = ({
  exportAsPNGFile,
  exportAsSVGFile,
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
      </List>
    </CollapseListItem>
  );
};

export {
  ExportMenu
}
