#!/usr/bin/env node
import * as fs from 'fs'
import * as path from 'path'
import * as puppeteer from 'puppeteer'
import * as rimraf from 'rimraf'

import {
  createRandomSrc,
} from './create_random_src';

import {
  parse,
} from '../../src/parser';
import {
  defaultConfig,
} from '../../src/config';
// import {
//   checkSVGFile,
// } from './svg_extractor';
import {
  checkJSONObj,
} from './json_checker';

declare global {
  interface Window {
    tefcha: any;
  }
}

const launch = async (srcs: string[], outputFileBases: string[], config: any) => {
  const browser = await puppeteer.launch({
    // headless: false,
  });
  const page = await browser.newPage();
  const htmlFile = path.join(__dirname, 'index.html');
  page.setViewport({width: 500, height: 500});
  await page.goto(`file://${htmlFile}`);
  await page.evaluate(`document.body.style.background = '${'white'}'`);

  for (let i = 0; i < srcs.length; i++) {
    const src = srcs[i];
    console.log(`rendering flowchart... ${i}`);
    const result = await page.$eval('#container', (container: any, src: any, config: any, _x3: any) => {
      container.textContent = src;
      try {
        window.tefcha.initialize(config);
        const json = window.tefcha.renderJSON(
          {src},
        );
        console.log(json);
        return {
          status: 'success',
          json,
        };
      } catch (error) {
        return {status: 'error', error, message: error.message};
      }
    }, src, config, null);

    if (result && result.status === 'error') {
      console.error('E:', result.message);
    } else if (result && result.status === 'success') {
      const json = result.json;
      const outputJSONFile = `result/json/${outputFileBases[i]}.json`;
      fs.writeFileSync(outputJSONFile, JSON.stringify(json, null, '  '));
    }

    try {
      const svgElement = (await page.$$('svg'))[0];
      const outputPngFile = `result/png/${outputFileBases[i]}.png`;
      const outputSvgFile = `result/svg/${outputFileBases[i]}.svg`;
      await svgElement.screenshot({
        path: outputPngFile,
        type: 'png',
      });
      const svgText: string = await page.$eval('#container', container => container.innerHTML);
      fs.writeFileSync(outputSvgFile, svgText);
    } catch (e) {
      console.error(e);
    }
  }
  await browser.close();
};

const main = async () => {
  const N = 100;
  const lineNumMax = 500;

  rimraf.sync('result');
  if (!fs.existsSync('result/random_src')) {
    fs.mkdirSync('result/random_src', {recursive: true});
  }
  if (!fs.existsSync('result/png')) {
    fs.mkdirSync('result/png', {recursive: true});
  }
  if (!fs.existsSync('result/svg')) {
    fs.mkdirSync('result/svg', {recursive: true});
  }
  if (!fs.existsSync('result/json')) {
    fs.mkdirSync('result/json', {recursive: true});
  }
  if (!fs.existsSync('result/failure/random_src')) {
    fs.mkdirSync('result/failure/random_src', {recursive: true});
  }
  if (!fs.existsSync('result/failure/png')) {
    fs.mkdirSync('result/failure/png', {recursive: true});
  }
  if (!fs.existsSync('result/failure/svg')) {
    fs.mkdirSync('result/failure/svg', {recursive: true});
  }
  if (!fs.existsSync('result/failure/json')) {
    fs.mkdirSync('result/failure/json', {recursive: true});
  }

  const srcs: string[] = [];
  const outputFileBases: string[] = [];
  for (let i = 0; i < N; i++) {
    const iStr = `0000000${i}`.slice(-5);
    outputFileBases.push(iStr);
    const lineNum = Math.floor(Math.random() * (lineNumMax - 1)) + 1;
    const src = createRandomSrc({
      lineNum,
    }).join('\n') + '\nend\n';
    // confirm no error when parsing.
    parse(src, defaultConfig);
    fs.writeFileSync(`result/random_src/${iStr}.txt`, src);
    srcs.push(src);
  }
  
  await launch(srcs, outputFileBases, defaultConfig);

  let ok = 0;
  let ng = 0;
  outputFileBases.forEach((outputFileBase, idx) => {
    console.log(`checking flowchart... ${idx}`);
    const svgFile = `result/svg/${outputFileBase}.svg`;
    const pngFile = `result/png/${outputFileBase}.png`;
    const srcFile = `result/random_src/${outputFileBase}.txt`;
    const jsonFile = `result/json/${outputFileBase}.json`;
    let failFile = '';
    let result = 'OK';
    // result = checkSVGFile(svgFile, {
    //   // NOTE: diamond is skipped
    //   hlineDistMax: defaultConfig.flowchart.hlineMargin - 1e-3
    // });
    if (result === 'OK') {
      result = checkJSONObj(
        JSON.parse(fs.readFileSync(jsonFile, 'utf-8')),
        {
          hlineDistMax: 14 / 2 - 1e-3, // font-size/2 = d(diamondTop - diamondMid)
        }
      );
      if (result !== 'OK') {
        failFile = jsonFile;
      }
    } else {
      failFile = svgFile;
    }

    if (result !== 'OK') {
      console.log(`fail in ${failFile}`);
      console.log(result);
      fs.copyFileSync(svgFile, `result/failure/svg/${outputFileBase}.svg`);
      fs.copyFileSync(pngFile, `result/failure/png/${outputFileBase}.png`);
      fs.copyFileSync(srcFile, `result/failure/random_src/${outputFileBase}.txt`);
      fs.copyFileSync(jsonFile, `result/failure/json/${outputFileBase}.json`);
      ng++;
    } else {
      ok++;
    }
  });
  console.log(`OK: ${ok}/${ok+ng}, NG: ${ng}/${ok+ng}`);
}

main();
