import '../style.css';
import * as React from 'react';

import '@fontsource/roboto';

import clsx from 'clsx';
import Input from '@material-ui/core/Input';
import InputAdornment from '@material-ui/core/InputAdornment';

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import Slider from '@material-ui/core/Slider';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';

import MenuIcon from '@material-ui/icons/Menu';

import {
  AutoScaleType,
  isAutoScaleType,
} from '../types';

interface ICustomAppBarProps {
  flowchatScalePercent: number;
  autoScaleType: AutoScaleType;
  classes: any;
  onClickDrawerButton: () => void;
  onFlowcharScalePercentChange: (newValue: number) => void;
  onAutoScaleTypeChange: (newValue: AutoScaleType) => void;
}

const CustomAppBar = ({
  flowchatScalePercent,
  autoScaleType,
  classes,
  onClickDrawerButton,
  onFlowcharScalePercentChange,
  onAutoScaleTypeChange,
}: ICustomAppBarProps) => {
  return (
      <AppBar
        position="fixed"
        className={clsx(classes.appBar, {
        })}
      >
        <Toolbar>
            <IconButton
              color="inherit"
              onClick={onClickDrawerButton}
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
                onFlowcharScalePercentChange(v);
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
                  onFlowcharScalePercentChange(value);
                } catch(e) {
                  console.error(e);
                }
              }}
              onBlur={() => {
                if (flowchatScalePercent < 1) {
                  onFlowcharScalePercentChange(1);
                } else if (flowchatScalePercent > 400) {
                  onFlowcharScalePercentChange(400);
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
                  onAutoScaleTypeChange(value);
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
    );
}

export {
  CustomAppBar,
}
