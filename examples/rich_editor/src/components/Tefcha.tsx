import * as React from 'react';
import {render as defaultRender} from '../../../../src/renderer/svg'
import {Config} from '../../../../src/config'

interface ITefchaProps {
  src: string;
  config?: Config;
  onError?: (error?: any) => void;
  onSuccess?: (svgEl?: SVGElement) => void;
  render?: (input: any) => SVGElement;
}

const Tefcha = ({
  src,
  config,
  onError,
  onSuccess,
  render,
}: ITefchaProps) => {

  const renderSVG = render ?? defaultRender;

  React.useEffect(() => {
    try {
      const tefchaResultSVG = renderSVG({
        src,
        config,
        document,
      });
      {/* tefchaResultSVG.setAttribute('width', 400); */}
      {/* tefchaResultSVG.setAttribute('height', 400); */}
      {/* const r = tefchaResultSVG.getElementsByTagName('svg'); */}
      const r = tefchaResultSVG;
      // console.log(r);
      {/* .setAttribute('width', 400); */}
      {/* tefchaResultSVG.height = 400; */}
      const div = document.getElementById('tefcha') as HTMLDivElement;
      div.textContent = '';
      div.append(tefchaResultSVG);
      if (onSuccess) {
        onSuccess(tefchaResultSVG);
      }
    } catch (e) {
      if (onError) {
        onError(e);
      }
    }
  }, [src, config, onError, onSuccess]);

  return (
    <div id='tefcha'></div>
  );
}

export {
  Tefcha,
};
