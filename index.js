(async function() {
  const video = document.querySelector('video');
  const input = document.querySelector('canvas#input');
  const output = document.querySelector('canvas#output');
  const inputCtx = input.getContext('2d', { alpha: false });
  const outputCtx = output.getContext('2d', { alpha: false });

  const wasm = await fetch('webcam.gc.wasm');
  const bytes = await wasm.arrayBuffer();
  const module = await WebAssembly.instantiate(bytes);
  const mod = module.instance;

  let byteSize = output.width * output.height * 4;
  let pointer = mod.exports.alloc(byteSize);
  let imageBytes = new Uint8ClampedArray(mod.exports.memory.buffer, pointer, byteSize);
  let img = new ImageData(imageBytes, output.width, output.height);

  function handleSuccess(stream) {
    video.srcObject = stream;
    drawStream();
  }

  function handleError(err) {
    console.error(err);
  }

  function drawStream() {
    drawVideoFrameToCanvas();
    drawImageDataToCanvas();

    requestAnimationFrame(drawStream);
  }

  function drawVideoFrameToCanvas() {
    inputCtx.drawImage(video, 0, 0, input.width, input.height);
  }

  function drawImageDataToCanvas() {
    let imageData = inputCtx.getImageData(0, 0, input.width, input.height);
    for (var i in imageData.data) {
      imageBytes[i] = imageData.data[i];
    }

    mod.exports.transform_grayscale(pointer, output.width, output.height);
    outputCtx.putImageData(img, 0, 0);
  }

  navigator.mediaDevices.getUserMedia({ video: true })
    .then(handleSuccess)
    .catch(handleError);
})();
