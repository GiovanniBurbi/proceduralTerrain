import perlin from 'https://cdn.jsdelivr.net/gh/mikechambers/es6-perlin-module/perlin.js'
import { createNoise2D } from 'simplex-noise'
import 'https://cdn.jsdelivr.net/npm/simplex-noise@2.4.0/simplex-noise.js'
import { Vector2 } from 'three'
import alea from 'alea'


export const noise = (function() {

  class PerlinWrapper {
    constructor() {}

    noiseValue(x, y) {
      return perlin(x, y) * 2.0 - 1.0
    }
  }

  class SimplexWrapper {
    constructor(seed) {
      // this.simplex = new SimplexNoise(seed);
      this.simplex = createNoise2D(alea(seed));
    }

    noiseValue(x, y) {
      // return this.simplex.noise2D(x, y)
      return this.simplex(x, y)
    }
  }

  class Noise {
    constructor(params) {
      this.params = params
      this.octaveOffset = []
      for (let i = 0; i < 20; i++){
        let offX = Math.random() * 200000 - 100000
        let offY = Math.random() * 200000 - 100000
        this.octaveOffset[i] = new Vector2(offX, offY)
      }
      this.noise = {
        simplex: new SimplexWrapper(1),
        perlin: new PerlinWrapper(),
      }
    }
  
    computeHeight(x, y, width, coords, noiseFunc) {
      let amplitude = 1
      let frequency = 1
      let noiseHeight = 0
  
      let noiseValue
  
      const halfW = width / 2
      const halfH = width / 2

      const G = 2.0 ** (- this.params.noise.persistance)
      let norm = 0

      const yp = (y + coords[1] * (width - 1) - this.params.noise.offsetY - halfH) / this.params.noise.scale
      const xp = (x + coords[0] * (width - 1) + this.params.noise.offsetX - halfW) / this.params.noise.scale
      
      for(let i = 0; i < this.params.noise.octaves; i++){
        
        noiseValue = noiseFunc.noiseValue(xp * frequency + this.octaveOffset[i].x, yp * frequency + this.octaveOffset[i].y)
        // noiseValue = noiseFunc.noiseValue(xp * frequency + this.octaveOffset[i].x, yp * frequency + this.octaveOffset[i].y) * this.octaveOffset * 0.5 + 0.5
        noiseHeight += noiseValue * amplitude
  
        amplitude *= this.params.noise.persistance
        frequency *= this.params.noise.lacunarity
      }
  
      return noiseHeight
      // return Math.pow(noiseHeight, this.params.noise.exponentiation) * this.params.terrain.maxHeight
    }

    generateNoiseMap(coords, width, dim) {
      const heights = new Array(dim)
  
      let maxLocalNoiseHeight = Number.NEGATIVE_INFINITY 
      let minLocalNoiseHeight = Number.POSITIVE_INFINITY
  
      let maxPossibleHeight = 0
      let amplitude = 1

      const noiseFunc = this.noise[this.params.noise.type]
  
      for (let i = 0; i < this.params.noise.octaves; i++){
        maxPossibleHeight += amplitude
        amplitude *= this.params.noise.persistance
      }
  
      for (let y = 0; y < width; y++){
        for(let x = 0; x < width; x++){
          let noiseValue = this.computeHeight(x, y, width, coords, noiseFunc)
  
          heights[y * width + x] = noiseValue 
  
          if (noiseValue > maxLocalNoiseHeight) {
            maxLocalNoiseHeight = noiseValue
          }
          if (noiseValue < minLocalNoiseHeight) {
            minLocalNoiseHeight = noiseValue
          }
        }
      }
  
      for (let y = 0; y < width; y++){
        for(let x = 0; x < width; x++){
          // local normalization
          // heights[y * width + x] = math.invLerp(heights[y * width + x], minLocalNoiseHeight, maxLocalNoiseHeight)
  
          let normHeight = (heights[y * width + x] + 1) / (2*maxPossibleHeight)
          heights[ y * width + x] = normHeight
        }
      }
      return heights
    }
  }

  return {
    NoiseGenerator: Noise
  }

})();