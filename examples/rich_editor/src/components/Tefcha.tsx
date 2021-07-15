import * as React from 'react';
// import {Ref} from 'react';
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

      const svgWidth = Number(tefchaResultSVG.getAttribute('width'));
      const svgHeight = Number(tefchaResultSVG.getAttribute('height'));

      let viewWidth = 0;
      let viewHeight = 0;
      let scale = 1;
      if ((!width || width <=0) && (!height || height <= 0)) {
        viewWidth = svgWidth;
        viewHeight = svgHeight;
        scale = 1;
      } else if ((!width || width <=0) && (height && height > 0)) {
        viewHeight = height;
        viewWidth = height * svgWidth / svgHeight;
        scale = height / svgHeight;
      } else if ((width && width > 0) && (!height || height <= 0)) {
        viewWidth = width;
        viewHeight = width * svgHeight / svgWidth;
        scale = width / svgWidth;
      } else {
        if (height * svgWidth > width * svgHeight) {
          // fit width
          viewWidth = width;
          viewHeight = width * svgHeight / svgWidth;
          scale = width / svgWidth;
        } else {
          // fit height
          viewHeight = height;
          viewWidth = height * svgWidth / svgHeight;
          scale = height / svgHeight;
        }
      }

      const div = document.getElementById('tefcha') as HTMLDivElement;
      div.textContent = '';

      {/* const wrapperSvg = */} 
      {/*   document.createElementNS('http://www.w3.org/2000/svg', 'svg'); */}

      {/* wrapperSvg.setAttribute('version', '1.1'); */}
      {/* wrapperSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); */}
      {/* wrapperSvg.setAttribute('width', `${viewWidth * 1 / scale}`); */}
      {/* wrapperSvg.setAttribute('height', `${viewHeight * 1 / scale}`); */}
      {/* wrapperSvg.setAttribute('transform', `scale(${scale})`); */}

      {/* wrapperSvg.append(tefchaResultSVG); */}

      {/* div.append(wrapperSvg); */}

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
