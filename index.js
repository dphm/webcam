(async function() {
  const WIDTH = 320;
  const HEIGHT = 240;

  const wasm = await fetch('webcam.gc.wasm');
  const bytes = await wasm.arrayBuffer();
  const module = await WebAssembly.instantiate(bytes);
  const mod = module.instance;

  let byteSize = WIDTH * HEIGHT * 4;
  let pointer = mod.exports.alloc(byteSize);
  let imageBytes = new Uint8ClampedArray(mod.exports.memory.buffer, pointer, byteSize);
  let img = new ImageData(imageBytes, WIDTH, HEIGHT);

  const video = document.createElement('video');
  const input = document.createElement('canvas');
  const output = document.querySelector('canvas');
  const inputCtx = input.getContext('2d', { alpha: false });
  const outputCtx = output.getContext('2d', { alpha: false });

  video.width = input.width = WIDTH;
  video.height = input.height = HEIGHT;

  function handleSuccess(stream) {
    video.srcObject = stream;
    video.play();
    drawStream();
  }

  function handleError(err) {
    console.error(err);
  }

  function drawStream() {
    inputCtx.drawImage(video, 0, 0);
    imageBytes.set(inputCtx.getImageData(0, 0, WIDTH, HEIGHT).data);

    mod.exports.transform_grayscale(pointer, WIDTH, HEIGHT);
    outputCtx.putImageData(img, 0, 0);

    requestAnimationFrame(drawStream);
  }

  navigator.mediaDevices.getUserMedia({ video: { width: WIDTH, height: HEIGHT } })
    .then(handleSuccess)
    .catch(handleError);
})();
