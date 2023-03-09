// https://github.com/simondevyoutube/ProceduralTerrain_Part3/tree/master/src
import perlin from 'https://cdn.jsdelivr.net/gh/mikechambers/es6-perlin-module/perlin.js'
import { createNoise2D } from 'simplex-noise';

import {math} from './math.js';

export const noise = (function() {

  class PerlinWrapper {
    constructor() {
    }

    noise2D(x, y) {
      return perlin(x, y) * 2.0 - 1.0;
    }
  }

  class SimplexWrapper {
    constructor(seed) {
      this.simplex = createNoise2D(seed)
    }

    noise2D(x, y) {
      return this.simplex(x, y);
    }
  }

  class RandomWrapper {
    constructor() {
      this.values = {};
    }

    rand(x, y) {
      const k = x + '.' + y;
      if (!(k in this.values)) {
        this.values[k] = Math.random() * 2 - 1;
      }
      return this.values[k];
    }

    noise2D(x, y) {
      // Bilinear filter
      const x1 = Math.floor(x);
      const y1 = Math.floor(y);
      const x2 = x1 + 1;
      const y2 = y1 + 1;
    
      const xp = x - x1;
      const yp = y - y1;
    
      const p11 = this.rand(x1, y1);
      const p21 = this.rand(x2, y1);
      const p12 = this.rand(x1, y2);
      const p22 = this.rand(x2, y2);
    
      const px1 = math.lerp(xp, p11, p21);
      const px2 = math.lerp(xp, p12, p22);
    
      return math.lerp(yp, px1, px2);
    }
  }

  //FBM
  class NoiseGenerator {
    constructor(params) {
      this.params = params;
      this.init();
    }

    init() {
      this.noise = {
        simplex: new SimplexWrapper(this.params.seed),
        perlin: new PerlinWrapper(),
        rand: new RandomWrapper(),
      };
    }

    Get(x, y) {
      const xs = x / this.params.scale;
      const ys = y / this.params.scale;
      const noiseFunc = this.noise[this.params.noiseType];
      const G = 2.0 ** (-this.params.persistence);
      let amplitude = 1.0;
      let frequency = 1.0;
      let normalization = 0;
      let total = 0;
      for (let o = 0; o < this.params.octaves; o++) {
        const noiseValue = noiseFunc.noise2D(
            xs * frequency, ys * frequency) * 0.5 + 0.5;
        total += noiseValue * amplitude;
        normalization += amplitude;
        amplitude *= G;
        frequency *= this.params.lacunarity;
      }
      total /= normalization;
      return Math.pow(
          total, this.params.exponentiation) * this.params.height;
    }
  }

  return {
    Noise: NoiseGenerator
  }
})();