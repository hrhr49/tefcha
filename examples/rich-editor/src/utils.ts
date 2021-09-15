import extract from 'png-chunks-extract';
import encode from 'png-chunks-encode';
import text from 'png-chunk-text';

const PNG_TEXT_CHUNK_KEY = 'tefcha';

interface TefchaData {
  config: any;
  src: string;
}

interface ImageFileOption {
  fileName?: string;
  metaData?: TefchaData;
}

const utf8ToBase64 = (utf8Str: string) => window.btoa(unescape(encodeURIComponent(utf8Str)));
const base64ToUtf8 = (base64Str: string) => decodeURIComponent(escape(window.atob(base64Str)));

const appendMetaDataToPNG = (
  pngData: Uint8Array,
  metaData: TefchaData,
): Uint8Array => {
  const chunks = extract(pngData);
  const metaDataBase64 = utf8ToBase64(JSON.stringify(metaData));
  chunks.splice(-1, 0, text.encode(PNG_TEXT_CHUNK_KEY, metaDataBase64));
  return encode(chunks);
};

const extractMetaDataFromPNG = (
  pngData: Uint8Array,
): TefchaData => {
  const chunks = extract(pngData);
  const textChunks = chunks
    .filter((chunk: any) => chunk.name === 'tEXt')
    .map((chunk: any) => text.decode(chunk.data))
    .filter((chunk: any) => chunk.keyword === PNG_TEXT_CHUNK_KEY);

  if (textChunks.length === 0) {
    throw 'Cannot find tefcha data from file';
  } else if (textChunks.length > 1) {
    console.warn('Multiple tefcha data found. First data will be used');
  }

  const textChunk = textChunks[0];
  return JSON.parse(base64ToUtf8(textChunk.text));
};

const canvasToBlob = async (canvas: HTMLCanvasElement): Promise<Blob> => {
  const promise = new Promise<Blob>((resolve) => {
    canvas.toBlob((blob: Blob) => {
      resolve(blob);
    });
  });
  return await promise;
};

const blobToUint8Array = async (blob: Blob): Promise<Uint8Array> => {
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
};

const downloadAsPNGFile = async (
  svgEl: SVGElement,
  option?: ImageFileOption
) => {
  const {
    fileName = 'image.png',
    metaData = null,
  } = option ?? {};
  const backupStyle = svgEl.getAttribute('style');
  // remove style before saving image
  svgEl.setAttribute('style', '');

  const svgData = new XMLSerializer().serializeToString(svgEl);
  const canvas = document.createElement("canvas");
  canvas.width = (svgEl as any).width.baseVal.value;
  canvas.height = (svgEl as any).height.baseVal.value;

  const ctx = canvas.getContext("2d");
  const image = new Image;

  image.src = "data:image/svg+xml;charset=utf-8;base64," 
    + btoa(unescape(encodeURIComponent(svgData))); 

  await new Promise<void>((resolve) => {
    image.onload = () => resolve();
  });

  ctx.drawImage( image, 0, 0 );
  const a = document.createElement("a");

  const pngBlob = await canvasToBlob(canvas);
  const pngUint8Array = await blobToUint8Array(pngBlob);

  const pngAndMetaDataUint8Array = metaData 
    ? appendMetaDataToPNG(pngUint8Array, metaData)
    : pngUint8Array;

  const pngAndMetaDataBlob = new Blob(
    [pngAndMetaDataUint8Array.buffer],
    {
      type: 'image/png'
    },
  );

  a.href = URL.createObjectURL(pngAndMetaDataBlob);
  a.setAttribute("download", fileName);
  a.dispatchEvent(new MouseEvent("click"));

  svgEl.setAttribute('style', backupStyle);
};

const downloadAsSVGFile = (
  svgEl: SVGElement,
  option?: ImageFileOption,
) => {
  const {
    fileName = 'image.svg',
    metaData = null,
  } = option ?? {};
  const backupStyle = svgEl.getAttribute('style');
  // remove style before saving image
  svgEl.setAttribute('style', '');

  if (metaData) {
    svgEl.setAttribute('content', JSON.stringify(metaData));
  }
  const svgData = new XMLSerializer().serializeToString(svgEl);
  let blob = new Blob([svgData], {type: "image/svg"});
  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  document.body.appendChild(a); // for Firefox
  a.download = fileName;
  a.click();
  document.body.removeChild(a); // for Firefox
  URL.revokeObjectURL(a.href);

  svgEl.setAttribute('style', backupStyle);
  if (svgEl.hasAttribute('content')) {
    svgEl.removeAttribute('content');
  }
};

const downloadAsJSONFile = (jsonData: any, fileName: string = 'data.json') => {
  let blob = new Blob([JSON.stringify(jsonData, null, '  ')], {type: "application/json"});
  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  document.body.appendChild(a); // for Firefox
  a.download = fileName;
  a.click();
  document.body.removeChild(a); // for Firefox
  URL.revokeObjectURL(a.href);
};

const loadTefchaFile = async (file: File): Promise<Partial<TefchaData>> => {
  switch (file.type) {
    case 'image/png': {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      const pngData = await (new Promise<Uint8Array>((resolve, reject) => {
        reader.onload = () => {
          if (typeof(reader.result) === 'string') {
            reject('invalid png file.');
          } else {
            resolve(new Uint8Array(reader.result));
          }
        }
        reader.onerror = (e) => {
          reject(e);
        }
      }));
      return extractMetaDataFromPNG(pngData);
    }
    case 'image/svg+xml': {
      const reader = new FileReader();
      reader.readAsText(file);
      const text = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          if (typeof(reader.result) !== 'string') {
            reject('invalid txt file.');
          } else {
            resolve(reader.result);
          }
        }
      });
      const parser = new DOMParser();
      const dom = parser.parseFromString(text, "application/xml");
      const svgEls = dom.getElementsByTagName('svg');
      if (svgEls.length === 0) {
        throw 'Cannot find <svg> tag';
      }
      const svgEl = svgEls[0];

      if (!svgEl.hasAttribute('content')) {
        throw 'Cannot find tefcha data in svg file';
      }

      return JSON.parse(svgEl.getAttribute('content'));
    }
    case 'text/plain': {
      const reader = new FileReader();
      reader.readAsText(file);
      const text = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          if (typeof(reader.result) !== 'string') {
            reject('invalid txt file.');
          } else {
            resolve(reader.result);
          }
        }
      });
      return {
        src: text,
      };
    }
    default: {
      throw 'not supported file';
    }
  }
};

export {
  downloadAsPNGFile,
  downloadAsSVGFile,
  downloadAsJSONFile,
  loadTefchaFile,
}
