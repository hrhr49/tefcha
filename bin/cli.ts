#!/usr/bin/env node
import {program} from 'commander'
import fs from 'fs'
import path from 'path'
import puppeteer from 'puppeteer'
import chalk from 'chalk'

declare global {
  interface Window {
    tefcha: any;
  }
}

const main = () => {
  program
    .usage('[options] [file]')
    .description('convert psedo code to flowchart. if input file is not given, use stdin instead.')
    .option('-o --output-file <file>', 'output file name (if not given, use stdout).')

  program.parse(process.argv);
  const inputFile = program.args[0];
  const outputFile = program.outputFile;

  if (inputFile && !fs.existsSync(inputFile)) {
    console.error(chalk.red(`Cannot find input file "${inputFile}"`));
    return;
  }

  const src: string = fs.readFileSync(inputFile || 0).toString();

  const launch = async () => {
    const browser = await puppeteer.launch({
      // headless: false,
    });
    const page = await browser.newPage();
    const htmlFile = path.join(__dirname, 'index.html');
    page.setViewport({width: 500, height: 500});
    await page.goto(`file://${htmlFile}`);
    await page.evaluate(`document.body.style.background = '${'white'}'`);

    const result = await page.$eval('#container', (container, src, _x2, _x3) => {
      container.textContent = src;
      try {
        window.tefcha.initialize();
      } catch (error) {
        return {status: 'error', error, message: error.message};
      }
    }, src, null, null);

    if (result && result.status === 'error') {
      console.error(chalk.red(result.message))
    }

    const svg = await page.$eval('#container', container => container.innerHTML);
    if (outputFile) {
      fs.writeFileSync(outputFile, svg);
    } else {
      console.log(svg);
    }
    await browser.close();
  };

  launch();
}

main();
