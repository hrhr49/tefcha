const downloadAsPNGFile = (svgEl: SVGElement, fileName: string = 'image.png') => {
  const backupStyle = svgEl.getAttribute('style');
  // remove style befor saving image
  svgEl.setAttribute('style', '');

  const svgData = new XMLSerializer().serializeToString(svgEl);
  const canvas = document.createElement("canvas");
  canvas.width = (svgEl as any).width.baseVal.value;
  canvas.height = (svgEl as any).height.baseVal.value;

  const ctx = canvas.getContext("2d");
  const image = new Image;
  image.onload = function(){
    ctx.drawImage( image, 0, 0 );
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.setAttribute("download", fileName);
    a.dispatchEvent(new MouseEvent("click"));

    svgEl.setAttribute('style', backupStyle);
  }
  image.src = "data:image/svg+xml;charset=utf-8;base64," 
    + btoa(unescape(encodeURIComponent(svgData))); 
};

const downloadAsSVGFile = (svgEl: SVGElement, fileName: string = 'image.svg') => {
  const backupStyle = svgEl.getAttribute('style');
  // remove style befor saving image
  svgEl.setAttribute('style', '');

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

export {
  downloadAsPNGFile,
  downloadAsSVGFile,
  downloadAsJSONFile,
}
