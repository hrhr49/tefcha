import * as sharp from 'sharp';

const sizes = [72, 96, 120, 128, 144, 152, 180, 192, 384, 512];

sizes.forEach(size => {
  sharp('scripts/icon.png')
    .resize(size, size)
    .toFile(`icons/icon-${size}x${size}.png`, (err: any, info: any) => {
      if (err) {
        throw err
      }
      console.log(info);
    });
});
