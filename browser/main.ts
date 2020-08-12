import {render} from '../renderer/svg'
import {Config} from '../config'

declare global {
  interface Window {
    tefcha: any;
  }
}

const tefcha = {
  initialize: (config?: Config) => {
    [...document.getElementsByClassName('tefcha')].forEach(el => {
      const src = el.textContent;
      el.textContent = '';
      el.append(render({src, document, config}));
    });
  }
};

window.tefcha = tefcha;
