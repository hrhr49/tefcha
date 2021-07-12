import * as React from 'react';

import '@fontsource/roboto';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import TagFacesIcon from '@material-ui/icons/TagFaces';

import Form from '@rjsf/material-ui';

import {
  CollapseListItem,
} from './CollapseListItem';

interface IRandomSrcMenuProps {
  onRandomSrc: (param: any) => void;
  classes: any;
}

const randomSrcSchema = {
  "type": "object",
  "properties": {
    "lineNum": {
      "type": "integer",
      "minimum": 1,
      "default": 30,
    },
    "randStrLength": {
      "type": "integer",
      "minimum": 1,
      "default": 5,
    },
    "exceptNumMax": {
      "type": "integer",
      "minimum": 0,
      "default": 3,
    },
    "elifNumMax": {
      "type": "integer",
      "minimum": 0,
      "default": 2,
    },
    "caseNumMin": {
      "type": "integer",
      "minimum": 0,
      "default": 2,
    },
    "caseNumMax": {
      "type": "integer",
      "minimum": 0,
      "default": 4,
    },
    "useIf": {
      "type": "boolean",
      "default": true,
    },
    "useWhile": {
      "type": "boolean",
      "default": true,
    },
    "useDoWhile": {
      "type": "boolean",
      "default": true,
    },
    "useBreak": {
      "type": "boolean",
      "default": true,
    },
    "useContinue": {
      "type": "boolean",
      "default": true,
    },
    "useSwitchCase": {
      "type": "boolean",
      "default": true,
    },
    "useTryExcept": {
      "type": "boolean",
      "default": true,
    },
  }
}

const randomSrcUiSchema = {
  "lineNum": {
    "ui:widget": "updown"
  },
  "randStrLength": {
    "ui:widget": "updown"
  },
  "exceptNumMax": {
    "ui:widget": "updown"
  },
  "elifNumMax": {
    "ui:widget": "updown"
  },
  "caseNumMin": {
    "ui:widget": "updown"
  },
  "caseNumMax": {
    "ui:widget": "updown"
  }
};

const randomSrcInitialFormData = {
  "lineNum": 30,
  "randStrLength": 5,
  "exceptNumMax": 3,
  "elifNumMax": 2,
  "caseNumMin": 2,
  "caseNumMax": 4,
  "useIf": true,
  "useWhile": true,
  "useDoWhile": true,
  "useBreak": true,
  "useContinue": true,
  "useSwitchCase": true,
  "useTryExcept": true,
};

const RandomSrcMenu = ({
  onRandomSrc,
  classes,
}: IRandomSrcMenuProps) => {
  const [formData, setFormData] = React.useState(randomSrcInitialFormData);
  const onSubmit = React.useCallback(({formData}: any) => {
    setFormData(formData);
    onRandomSrc(formData);
  }, [formData, setFormData]);

  return (
    <CollapseListItem
      title="Random Source Code"
      icon={<TagFacesIcon />}
    >
      <List component="div" disablePadding>
        <ListItem 
          button
          className={classes.nested}
        >
          <Form
            schema={randomSrcSchema as any}
            formData={formData}
            uiSchema={randomSrcUiSchema}
            onSubmit={onSubmit}
            liveValidate={true}
          />
        </ListItem>
      </List>
    </CollapseListItem>
  );
};

export {
  RandomSrcMenu
}
