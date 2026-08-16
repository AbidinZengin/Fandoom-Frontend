import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { AdditiveBlending, Color } from 'three';
import { FIRE_STOPS } from './Flame.data';
import styles from './Flame.module.css';

// Prosedürel alev — tek tam-ekran quad + fragment shader (tek draw call).
// learned-rules [motion]: atmosfer efektleri feTurbulence ile üretilmez;
// o filtre yönsüz/izotropik gürültü verdiği için sünger dokusu çıkıyordu.
// Buradaki üç şey onu alev yapan fark:
//   1) YAVAŞ YÜKSELİŞ + YANAL SALINIM — noise alanı yukarı akarken bir
//      yandan da salınır (salınım tabanda sıfır, yukarı çıktıkça artar),
//      böylece alev dikey fırlamak yerine dalgalanır.
//   2) DOMAIN WARPING — noise koordinatı ikinci bir noise alanıyla
//      saptırılır; alevin kıvrılıp yalama hareketi buradan gelir.
//   3) BLACKBODY RAMPASI — ısı değeri renge eşlenir. Tek rengi opaklıkla
//      soldurmak gerçekçi durmuyor; gerçek ateşin rengi sıcaklığa bağlı.

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// snoise: Ashima Arts / Stefan Gustavson simplex noise (public domain).
const fragmentShader = /* glsl */ `
  varying vec2 vUv;
  uniform float u_time;
  uniform float u_aspect;
  uniform float u_intensity;
  uniform float u_waveAmp;
  uniform float u_waveFreq;
  uniform vec3 u_ember;
  uniform vec3 u_mid;
  uniform vec3 u_hot;
  uniform vec3 u_core;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                            + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                            dot(x12.zw, x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // 4 oktav — 5. oktav ince/telaşlı detay katıyordu, smooth görünüm için
  // bilerek düşürüldü.
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * snoise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }

  vec3 fireRamp(float h) {
    vec3 c = mix(u_ember, u_mid, smoothstep(0.0, 0.32, h));
    c = mix(c, u_hot, smoothstep(0.28, 0.60, h));
    c = mix(c, u_core, smoothstep(0.62, 1.0, h));
    return c;
  }

  void main() {
    vec2 uv = vUv;
    float t = u_time;

    // Dikeyde hafif gerdirme — eskisinden AZ (2.4/0.85 idi): alev daha
    // az sivri, daha geniş dalgalar hâlinde okunuyor.
    vec2 q = vec2(uv.x * u_aspect * 1.7, uv.y * 1.05);

    // Yavaş yükseliş.
    q.y -= t * 0.42;

    // Yanal salınım — tabanda sıfır (alev kökten kaymaz), yukarı çıktıkça
    // artar. "Dikey fırlama" hissini dalgalanmaya çeviren asıl terim.
    q.x += sin(uv.y * u_waveFreq + t * 0.5) * u_waveAmp * uv.y;

    // Domain warping — yavaşlatıldı (0.30/0.45 idi).
    vec2 warp = vec2(
      fbm(q + vec2(0.0, t * 0.10)),
      fbm(q + vec2(5.2, 1.3) - vec2(0.0, t * 0.16))
    );
    float n = fbm(q + warp * 0.62) * 0.5 + 0.5;

    // Isı alanı: tabanda sıcak, yukarı çıktıkça sönüyor; kenarlara doğru
    // da yumuşakça biter, böylece dikdörtgen bir kutu gibi kesilmez.
    float rise  = 1.0 - smoothstep(0.02, 0.92, uv.y);
    float sides = 1.0 - smoothstep(0.30, 1.0, abs(uv.x - 0.5) * 2.0);

    float heat = n * rise * sides;
    // Yumuşatıldı (1.7 idi) — keskin alev dilleri yerine yumuşak geçişler.
    heat = pow(max(heat, 0.0), 1.35) * u_intensity;

    float alpha = smoothstep(0.015, 0.22, heat);
    gl_FragColor = vec4(fireRamp(clamp(heat, 0.0, 1.0)), alpha);
  }
`;

function FlameQuad({ speed, intensity, waveAmp, waveFreq, colors, frozen }) {
  const materialRef = useRef(null);
  const { viewport } = useThree();

  // Uniform objesinin kimliği stabil kalmalı — yeniden yaratmak materyali
  // her değişimde yeniden derletir.
  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_aspect: { value: 1 },
      u_intensity: { value: 1 },
      u_waveAmp: { value: 0 },
      u_waveFreq: { value: 0 },
      u_ember: { value: new Color() },
      u_mid: { value: new Color() },
      u_hot: { value: new Color() },
      u_core: { value: new Color() },
    }),
    []
  );

  // Renkler her frame değil, yalnız değiştiklerinde yazılır.
  useEffect(() => {
    uniforms.u_ember.value.set(colors.ember);
    uniforms.u_mid.value.set(colors.mid);
    uniforms.u_hot.value.set(colors.hot);
    uniforms.u_core.value.set(colors.core);
  }, [uniforms, colors]);

  useFrame((state, delta) => {
    const u = materialRef.current?.uniforms;
    if (!u) return;
    if (!frozen) u.u_time.value += delta * speed;
    u.u_aspect.value = viewport.width / viewport.height;
    u.u_intensity.value = intensity;
    u.u_waveAmp.value = waveAmp;
    u.u_waveFreq.value = waveFreq;
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </mesh>
  );
}

export function Flame({
  speed = 0.55,
  intensity = 1.25,
  waveAmp = 0.5,
  waveFreq = 2.2,
  colors = FIRE_STOPS,
}) {
  const frozen =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className={styles.flame} aria-hidden="true">
      <Canvas orthographic camera={{ position: [0, 0, 1], zoom: 1 }} dpr={[1, 2]}>
        <FlameQuad
          speed={speed}
          intensity={intensity}
          waveAmp={waveAmp}
          waveFreq={waveFreq}
          colors={colors}
          frozen={frozen}
        />
      </Canvas>
    </div>
  );
}
