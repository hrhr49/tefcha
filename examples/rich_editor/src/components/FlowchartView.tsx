import '../style.css';
import * as React from 'react';

import '@fontsource/roboto';

import { Tefcha } from './Tefcha';

import {
  AutoScaleType,
} from '../types';


interface IFlowchartView {
  src: string;
  svgRef: any;
  scalePercent: number;
  autoScaleType: AutoScaleType;
  width: number;
  height: number;
  tefchaConfig: any;
  onTefchaError: (err: any) => void;
  onTefchaSuccess: () => void;
}

const FlowchartView = ({
  src,
  svgRef,
  scalePercent,
  autoScaleType,
  width,
  height,
  onTefchaError,
  onTefchaSuccess,
  tefchaConfig,
}: IFlowchartView) => {

  const applyScale = React.useCallback(() => {
    if (svgRef.current !== null) {
      const originalWidth = Number(svgRef.current.getAttribute('width'));
      const originalHeight = Number(svgRef.current.getAttribute('height'));

      let scale = scalePercent / 100;
      switch (autoScaleType) {
        case 'None': {
          // do nothing
          break;
        }
        case '100%': {
          scale = 1.0;
          break;
        }
        case 'Width': {
          scale = width / originalWidth;
          break;
        }
        case 'Height': {
          scale = height / originalHeight;
          break;
        }
        case 'Auto': {
          scale = Math.min(
            width / originalWidth,
            height / originalHeight
          );
          break;
        }
        default: {
          const _: never = autoScaleType;
          throw `invalid autoScaleType: ${_}`;
        }
      }
      console.log(autoScaleType);
      console.log(scale);
      svgRef.current.style['transform-origin'] = 'top left';
      svgRef.current.style['transform'] = `scale(${scale})`;
    }
  }, [svgRef, autoScaleType, scalePercent, width, height]);

  const _onTefchaSuccess = React.useCallback(() => {
    applyScale();
    onTefchaSuccess();
  }, [svgRef, scalePercent, autoScaleType, width, height]);

  React.useEffect(() => {
    applyScale();
  }, [svgRef, scalePercent, autoScaleType, width, height])


  return (
    <Tefcha
      src={src}
      svgRef={svgRef}
      onError={onTefchaError}
      onSuccess={_onTefchaSuccess}
      config={tefchaConfig}
    />
  );
}

export {
  FlowchartView,
}
