import * as React from 'react';

import '@fontsource/roboto';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import TagFacesIcon from '@material-ui/icons/TagFaces';

import {
  CollapseListItem,
} from './CollapseListItem';

interface IOtherMenuProps {
  onRandomSrc: () => void;
  classes: any;
}

const OtherMenu = ({
  onRandomSrc,
  classes,
}: IOtherMenuProps) => {
  return (
    <CollapseListItem
      title="Other"
      icon={<TagFacesIcon />}
    >
      <List component="div" disablePadding>
        <ListItem 
          button
          onClick={onRandomSrc}
          className={classes.nested}
        >
          <ListItemText primary='Random Source Code' />
        </ListItem>
      </List>
    </CollapseListItem>
  );
};

export {
  OtherMenu
}
