// A rounded height field, rather than a distance-to-edge bevel. Solving the
// Poisson equation inside the silhouette gives every stroke continuous curvature,
// including the joins and counters where a raw distance field forms creases.
const yieldTask = () =>
  new Promise<void>((resolve) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => {
      channel.port1.close();
      channel.port2.close();
      resolve();
    };
    channel.port2.postMessage(null);
  });

export async function createTextSurface(
  mask: ImageData,
  isCurrent: () => boolean,
) {
  const { width, height, data } = mask;
  const field = new Float32Array(width * height);
  const even: number[] = [];
  const odd: number[] = [];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const index = y * width + x;
      if (data[index * 4 + 3] < 128) continue;
      ((x + y) % 2 ? odd : even).push(index);
    }
  }

  // The working mask is 664 × 215 for both placements. Yield between batches so
  // first activation cannot block the catalogue's hover or loading feedback.
  for (let iteration = 0; iteration < 120; iteration++) {
    for (const cells of [even, odd]) {
      for (const index of cells) {
        const average =
          (field[index - 1] +
            field[index + 1] +
            field[index - width] +
            field[index + width] +
            1) /
          4;
        field[index] += 1.82 * (average - field[index]);
      }
    }
    if (iteration % 8 === 7) {
      await yieldTask();
      if (!isCurrent()) return null;
    }
  }

  let peak = 1;
  for (const value of field) peak = Math.max(peak, value);
  const scale = Math.sqrt(peak + 4) - 2;
  for (let index = 0; index < field.length; index++) {
    field[index] = (Math.sqrt(Math.max(0, field[index]) + 4) - 2) / scale;
  }

  // Only the curvature field is softened; the independent supersampled alpha
  // keeps the lettering crisp. Extending this smooth height just outside the
  // mask removes tiny pixel-shaped normals along circular outlines.
  const horizontal = new Float32Array(field.length);
  const weights = [0.035, 0.11, 0.215, 0.28, 0.215, 0.11, 0.035];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let value = 0;
      for (let offset = -3; offset <= 3; offset++) {
        value +=
          field[y * width + Math.max(0, Math.min(width - 1, x + offset))] *
          weights[offset + 3];
      }
      horizontal[y * width + x] = value;
    }
  }
  await yieldTask();
  if (!isCurrent()) return null;
  const surface = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let heightValue = 0;
      for (let offset = -3; offset <= 3; offset++) {
        heightValue +=
          horizontal[
            Math.max(0, Math.min(height - 1, y + offset)) * width + x
          ] * weights[offset + 3];
      }
      const packed = Math.round(Math.min(1, heightValue) * 65535);
      // A 16-bit height in two ordinary texture channels keeps smooth gradients
      // without depending on floating-point texture/filtering extensions.
      const target = ((height - y - 1) * width + x) * 4;
      surface[target] = packed >> 8;
      surface[target + 1] = packed & 255;
      surface[target + 3] = 255;
    }
  }
  return surface;
}
