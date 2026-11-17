// Tomoyo's liquid-chrome material. The silhouette remains fixed; a rounded
// surface reflects a moving silver studio with a narrow cobalt light source.
export const metallicTextFragmentShader = `
precision highp float;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform vec2 u_surfaceTexel;
uniform float u_time;
uniform sampler2D u_content;
uniform sampler2D u_shape;

float surface(vec2 uv) {
  return dot(texture2D(u_shape, uv).rg, vec2(256.0 / 257.0, 1.0 / 257.0));
}

vec3 studio(float position, float softness) {
  float p = fract(position);
  vec3 ink = vec3(0.025, 0.035, 0.065);
  vec3 steel = vec3(0.24, 0.28, 0.36);
  vec3 silver = vec3(0.66, 0.70, 0.77);
  vec3 white = vec3(0.99, 0.995, 1.0);
  vec3 cobalt = vec3(0.095, 0.22, 0.78);
  vec3 color = mix(ink, steel, smoothstep(0.02, 0.12, p));
  color = mix(color, silver, smoothstep(0.12, 0.23, p));
  color = mix(color, white, smoothstep(0.24, 0.29, p));
  color = mix(color, silver, smoothstep(0.33, 0.42, p));
  color = mix(color, steel, smoothstep(0.42, 0.48, p));
  color = mix(color, cobalt, smoothstep(0.48, 0.55, p));
  color = mix(color, ink, smoothstep(0.57 - softness, 0.64 + softness, p));
  color = mix(color, steel, smoothstep(0.67, 0.72, p));
  color = mix(color, white, smoothstep(0.735, 0.775, p));
  color = mix(color, steel, smoothstep(0.79, 0.92, p));
  return mix(color, ink, smoothstep(0.92, 1.0, p));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float alpha = texture2D(u_content, uv).a;
  if (alpha < 0.002) { gl_FragColor = vec4(0.0); return; }

  float height = surface(uv);
  vec2 sampleOffset = 1.5 * u_surfaceTexel;
  vec2 slope = vec2(
    surface(uv + vec2(sampleOffset.x, 0.0)) - surface(uv - vec2(sampleOffset.x, 0.0)),
    surface(uv + vec2(0.0, sampleOffset.y)) - surface(uv - vec2(0.0, sampleOffset.y))
  ) * 3.4;

  vec2 p = vec2(uv.x * 3.0884, uv.y);
  float t = u_time;
  // Broad, slow undulations bend the reflected light without wobbling the text.
  vec2 liquid = vec2(
    sin(p.x * 3.2 + p.y * 4.3 + t * 0.46) + 0.45 * sin(p.y * 8.0 - t * 0.32),
    cos(p.x * 2.6 - p.y * 5.1 - t * 0.37) + 0.40 * sin(p.x * 6.0 + t * 0.29)
  ) * 0.105 * smoothstep(0.0, 0.28, height);
  vec2 tilt = (u_mouse - 0.5) * vec2(0.30, 0.22);
  vec2 surfaceSlope = -slope + liquid + tilt;
  vec3 normal = normalize(vec3(surfaceSlope, 1.0));
  // Angular reflection coordinates stay monotonic around a rounded stroke.
  // Projecting reflected.xy instead folds at grazing angles and repeats the
  // same lights into foil-like concentric outlines.
  vec2 environment = 2.0 * atan(surfaceSlope);

  float flowing = 0.035 * sin(environment.x * 2.0 + p.x * 1.2 + t * 0.31);
  float phase = environment.y * 0.20 + environment.x * 0.08;
  phase += height * 0.22 + p.y * 0.10 + p.x * 0.065;
  phase += flowing - t * 0.065 + 0.12;
  float softness = max(0.005, 1.15 / u_resolution.y);
  vec3 color = studio(phase, softness);

  // A secondary softbox leaves a hairline white highlight on grazing curves.
  float grazing = pow(1.0 - max(normal.z, 0.0), 2.0);
  float softbox = pow(max(dot(normal, normalize(vec3(-0.5, 0.8, 0.7))), 0.0), 18.0);
  color += vec3(0.10, 0.115, 0.14) * softbox;
  color = mix(color, vec3(0.91, 0.95, 1.0), grazing * 0.20);
  float edge = 1.0 - smoothstep(0.025, 0.13, height);
  // Keep the last few contour pixels neutral. Saturated reflections belong on
  // the broad face, where they read as a light source rather than blue speckles.
  float neutral = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(color, vec3(neutral) * vec3(0.93, 0.97, 1.0), edge * 0.85);
  color *= 1.0 - edge * 0.12;

  gl_FragColor = vec4(clamp(color, 0.0, 1.0) * alpha, alpha);
}
`;
