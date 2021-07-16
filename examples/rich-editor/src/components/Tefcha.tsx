import * as React from 'react';
import {render as defaultRender} from '../../../../src/renderer/svg'
import {Config} from '../../../../src/config'

interface ITefchaProps {
  src: string;
  config?: Config;
  svgRef?: any;
  onError?: (error?: any) => void;
  onSuccess?: () => void;
  render?: (input: any) => SVGElement;
  width?: number;
  height?: number;
  style?: any;
}

const Tefcha = ({
  src,
  config,
  svgRef,
  onError,
  onSuccess,
  render,
  style,
  width,
  height,
}: ITefchaProps) => {

  const renderSVG = render ?? defaultRender;

  React.useEffect(() => {
    try {
      const tefchaResultSVG = renderSVG({
        src,
        config,
        document,
      });
      if (svgRef) {
        svgRef.current = tefchaResultSVG;
      }

      const div = document.getElementById('tefcha') as HTMLDivElement;
      div.textContent = '';

      if (onSuccess) {
        onSuccess();
      }
      // before appending to DOM (rendering), do something ('transform') in onSuccess
      div.append(tefchaResultSVG);
    } catch (e) {
      if (onError) {
        onError(e);
      }
    }
  }, [src, config, onError, onSuccess, width, height]);

  return (
    <>
      {
        style 
        ? <div id='tefcha' style={style}></div>
        : <div id='tefcha'></div>
      }
    </>
  );
}

export {
  Tefcha,
};
