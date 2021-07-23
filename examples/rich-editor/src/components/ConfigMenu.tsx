import * as React from 'react';

import '@fontsource/roboto';

import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import SettingsIcon from '@material-ui/icons/Settings';

import {
  IChangeEvent,
  ErrorSchema,
  ISubmitEvent,
} from '@rjsf/core';

import Form from '@rjsf/material-ui';

import {
  CollapseListItem,
} from './CollapseListItem';

import { Validator } from 'jsonschema';

import { downloadAsJSONFile } from '../utils';

interface IConfigMenuProps {
  onChange?: (e: IChangeEvent<any>, es?: ErrorSchema) => any;
  onImport?: (data: any) => any;
  onError?: (e: any) => any;
  onSubmit?: (e: ISubmitEvent<any>, nativeEvent: React.FormEvent<HTMLFormElement>) => any;
  formData?: any;
  classes: any;
}

const configSchema = {
  "type": "object",
  "properties": {
    "flowchart": {
      "type": "object",
      "properties": {
        "marginX": {
          "type": "integer",
          "minimum": 0,
        },
        "marginY": {
          "type": "integer",
          "minimum": 0
        },
        "stepX": {
          "type": "integer",
          "minimum": 0
        },
        "stepY": {
          "type": "integer",
          "minimum": 0
        },
        "hlineMargin": {
          "type": "integer",
          "minimum": 0
        },
        "backgroundColor": {
          "type": "string"
        }
      },
      "required": [
        "marginX",
        "marginY",
        "stepX",
        "stepY",
        "hlineMargin",
        "backgroundColor"
      ]
    },
    "rect": {
      "type": "object",
      "properties": {
        "padX": {
          "type": "integer",
          "minimum": 0
        },
        "padY": {
          "type": "integer",
          "minimum": 0
        },
        "attrs": {
          "title": "rect.attrs",
          "description": "attributes of <rect> tag for rectangle in SVG",
          "type": "object",
          "additionalProperties": {
            "type": "string"
          },
        }
      },
      "required": [
        "padX",
        "padY",
        "attrs"
      ]
    },
    "frame": {
      "type": "object",
      "properties": {
        "attrs": {
          "title": "frame.attrs",
          "description": "attributes of <rect> tag for frame in SVG",
          "type": "object",
          "additionalProperties": {
            "type": "string"
          },
        }
      },
      "required": [
        "attrs"
      ]
    },
    "diamond": {
      "type": "object",
      "properties": {
        "aspectRatio": {
          "type": "number",
          "minimum": 0.1
        },
        "attrs": {
          "title": "diamond.attrs",
          "description": "attributes of <polygon> tag for diamond in SVG",
          "type": "object",
          "additionalProperties": {
            "type": "string"
          },
        }
      },
      "required": [
        "aspectRatio",
        "attrs"
      ]
    },
    "path": {
      "type": "object",
      "properties": {
        "attrs": {
          "title": "path.attrs",
          "description": "attributes of <path> tag for path in SVG",
          "type": "object",
          "additionalProperties": {
            "type": "string"
          },
        }
      },
      "required": [
        "attrs"
      ]
    },
    "arrowHead": {
      "type": "object",
      "properties": {
        "size": {
          "type": "integer",
          "minimum": 0
        },
        "attrs": {
          "title": "arrowHead.attrs",
          "description": "attributes of <polygon> tag for arrow head in SVG",
          "type": "object",
          "additionalProperties": {
            "type": "string"
          },
        }
      },
      "required": [
        "size",
        "attrs"
      ]
    },
    "text": {
      "type": "object",
      "properties": {
        "attrs": {
          "title": "text.attrs",
          "description": "attributes of <text> tag for text in shape in SVG",
          "type": "object",
          "additionalProperties": {
            "type": "string"
          },
        }
      },
      "required": [
        "attrs"
      ]
    },
    "label": {
      "type": "object",
      "properties": {
        "yesText": {
          "type": "string"
        },
        "noText": {
          "type": "string"
        },
        "marginX": {
          "type": "integer",
          "minimum": 0
        },
        "marginY": {
          "type": "integer",
          "minimum": 0
        },
        "attrs": {
          "title": "label.attrs",
          "description": "attributes of <text> tag for label of arrow in SVG",
          "type": "object",
          "additionalProperties": {
            "type": "string"
          },
        }
      },
      "required": [
        "yesText",
        "noText",
        "marginX",
        "marginY",
        "attrs"
      ]
    }
  },
  "required": [
    "src",
    "flowchart",
    "rect",
    "frame",
    "diamond",
    "path",
    "arrowHead",
    "text",
    "label"
  ]
};

const validator = new Validator();
validator.addSchema(configSchema);

const configUiSchema = {
  "flowchart": {
    "marginX": {
      "ui:widget": "updown"
    },
    "marginY": {
      "ui:widget": "updown"
    },
    "stepX": {
      "ui:widget": "updown"
    },
    "stepY": {
      "ui:widget": "updown"
    },
    "hlineMargin": {
      "ui:widget": "updown"
    }
  },
  "rect": {
    "padX": {
      "ui:widget": "updown"
    },
    "padY": {
      "ui:widget": "updown"
    },
  },
  "frame": {
    "padX": {
      "ui:widget": "updown"
    },
    "padY": {
      "ui:widget": "updown"
    },
  },
  "diamond": {
    "aspectRatio": {
    },
  },
  "path": {
  },
  "arrowHead": {
    "size": {
      "ui:widget": "updown"
    },
  },
  "text": {
  },
  "label": {
    "yesText": {
    },
    "noText": {
    },
    "marginX": {
      "ui:widget": "updown"
    },
    "marginY": {
      "ui:widget": "updown"
    },
  },
};

const ConfigMenu = ({
  onChange,
  onImport,
  onSubmit,
  onError,
  formData,
  classes,
}: IConfigMenuProps) => {
  const downloadConfig = React.useCallback(() => {
    downloadAsJSONFile(formData);
  }, [formData]);
  const loadConfig = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const target = event.target;
    const files = target.files;
    const reader = new FileReader();
    reader.readAsText(files[0]);

    reader.onload = () => {
      try {
        const jsonData = JSON.parse(reader.result.toString());
        onImport(jsonData);
      } catch (e) {
        alert(`JSON parsing is failed: ${e}`);
      }
    };
    reader.onerror = (e: any) => {
      alert(`Reading file is failed: ${e}`);
    };
  }, [onChange]);
  return (
    <CollapseListItem
      title="Config"
      icon={<SettingsIcon />}
    >
      <List component="div" disablePadding>
        <ListItem
          className={classes.nested}
        >
          <Form
            schema={configSchema as any}
            uiSchema={configUiSchema}
            formData={formData}
            onChange={onChange}
            onSubmit={onSubmit}
            onError={onError}
            liveValidate={true}
          >
            {/* since 'submit' button is not needed, we put dummy fragment */}
            <React.Fragment />
          </Form>
        </ListItem>
        <ListItem
          className={classes.nested}
        >
          <Button onClick={downloadConfig} variant='outlined'>
            Export
          </Button>
          <Button variant='outlined' component='label'>
            Import
            <input onChange={loadConfig} type='file' accept='application/json' hidden />
          </Button>
        </ListItem>
      </List>
    </CollapseListItem>
  );
};

export {
  ConfigMenu
}
