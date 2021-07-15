import {render as renderSVG} from '../../src/renderer/svg'
import {render as renderJSON} from '../../src/renderer/json'
import {Config} from '../../src/config'

declare global {
  interface Window {
    tefcha: any;
  }
}

const tefcha = {
  renderSVG: renderSVG,
  renderJSON: renderJSON,
  initialize: (config?: Config) => {
    [...document.getElementsByClassName('tefcha')].forEach(el => {
      const src = el.textContent;
      el.textContent = '';
      el.append(renderSVG({src, document, config}));
    });
  }
};

window.tefcha = tefcha;
