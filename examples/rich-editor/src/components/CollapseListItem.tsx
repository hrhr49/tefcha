import * as React from 'react';

import '@fontsource/roboto';

import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Collapse from '@material-ui/core/Collapse';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';

interface ICollapseListItemProps {
  title: string;
  icon: React.ReactElement;
  children: React.ReactNode;
}

const CollapseListItem = ({
  title,
  icon,
  children,
}: ICollapseListItemProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleIsOpen = React.useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  return (
    <>
      <ListItem button onClick={toggleIsOpen}>
        <ListItemIcon>{ icon }</ListItemIcon>
        <ListItemText primary={title} />
        {isOpen ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={isOpen} timeout="auto" unmountOnExit>
        { children }
      </Collapse>
    </>
  );
};

export {
  CollapseListItem,
}
