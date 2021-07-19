import * as React from 'react';
import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/mode-text';
import 'ace-builds/src-noconflict/theme-monokai';
import 'brace/mode/java';


declare global {
  interface Window {
    ace: any;
  }
}

window.ace.config.set('basePath', '.');

// https://github.com/securingsincity/react-ace/issues/126
class CustomHighlightRules extends window.ace.acequire("ace/mode/text_highlight_rules").TextHighlightRules {
  constructor() {
    super();
    this.$rules = {
      start: [
        {
          token: "keyword",
          regex: "^\\s*(if|elif|else|while|do|for|continue|break|switch|case|pass|try|except)"
        },
        {
          token: "comment",
          regex: "^\\s*#.*$"
        }
      ]
    };
  }
}

class CustomTextMode extends window.ace.acequire('ace/mode/java').Mode {
	constructor() {
		super();
		this.HighlightRules = CustomHighlightRules;
	}
}

interface IEditorProps {
  value: string;
  onChange: (value: string, event?: any) => void;
  annotations?: any[],
}

const Editor = ({
  onChange,
  value,
  annotations = [],
}: IEditorProps) => {
  const aceRef = React.useRef(null);

  React.useEffect(() => {
    if (aceRef.current) {
      aceRef.current.editor.getSession().setMode(new CustomTextMode());
    } else {
      throw `aceEditor ref is invalid: ${aceRef}`;
    }
  });
  return (
    <AceEditor
      ref={aceRef}
      value={value}
      theme='monokai'
      onChange={onChange}
      name='UNIQUE_ID_OF_DIV'
      tabSize={2}
      width={null}
      height='100%'
      focus={true}
      debounceChangePeriod={100}
      editorProps={{
        $rules: new CustomHighlightRules()
      }}
      annotations={annotations}
    />
  );
}

export {
  Editor,
}
