import * as React from 'react';
import AceEditor from 'react-ace';

{/* import 'ace-builds/src-noconflict/mode-text; */}
import 'ace-builds/src-noconflict/theme-monokai';

// TODO: Syntax Highlight.
class CustomHighlightRules extends (window as any).ace.acequire("ace/mode/text_highlight_rules").TextHighlightRules {
  constructor() {
    super();
    this.$rules = {
      start: [
        {
          token: "keyword",
          regex: "if"
        }
      ]
    };
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

      // debounceChangePeriod={300}
export {
  Editor,
}
