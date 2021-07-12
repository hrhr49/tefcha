import * as React from 'react';

import '@fontsource/roboto';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import PaletteIcon from '@material-ui/icons/Palette';

import {
  CollapseListItem,
} from './CollapseListItem';

import {
  Config,
} from '../../../../src/config';

import {
  defaultConfig,
  greenConfig,
  blueConfig,
} from '../themes';

const themeList: [string, Config][] = [
  ['Default', defaultConfig],
  ['Green', greenConfig],
  ['Blue', blueConfig],
];

interface IThemeMenuProps {
  onSelect: (config: Config) => void;
  classes: any;
}

const ThemeMenu = ({
  onSelect,
  classes,
}: IThemeMenuProps) => {
  const [currentThemeName, setCurrentThemeName] = React.useState('');
  return (
    <CollapseListItem
      title="Theme"
      icon={<PaletteIcon />}
    >
      <List component="div" disablePadding>
        {
          themeList.map(([themeName, config]) => (
            <ListItem 
              button
              onClick={() => {
                setCurrentThemeName(themeName);
                onSelect(config);
              }}
              className={classes.nested}
              key={themeName}
            >
              <ListItemText primary={themeName} />
            </ListItem>
          ))
        }
      </List>
    </CollapseListItem>
  );
};

export {
  ThemeMenu
}
