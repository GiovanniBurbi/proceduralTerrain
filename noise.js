import perlin from 'https://cdn.jsdelivr.net/gh/mikechambers/es6-perlin-module/perlin.js'
import { createNoise2D } from 'simplex-noise'
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
      this.simplex = createNoise2D(alea(seed));
    }

    noiseValue(x, y) {
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
  
      const halfW = width / 2
      const halfH = width / 2

      const yp = (y + coords[1] * (width - 1) - this.params.noise.offsetY - halfH) / this.params.noise.scale
      const xp = (x + coords[0] * (width - 1) + this.params.noise.offsetX - halfW) / this.params.noise.scale
      
      for(let i = 0; i < this.params.noise.octaves; i++){
        
        let noiseValue = noiseFunc.noiseValue(xp * frequency + this.octaveOffset[i].x, yp * frequency + this.octaveOffset[i].y)

        noiseHeight += noiseValue * amplitude
        amplitude *= this.params.noise.persistance
        frequency *= this.params.noise.lacunarity
      }

      return noiseHeight
    }

    generateNoiseMap(coords, width, dim) {
      const heights = new Array(dim)
      const noiseFunc = this.noise[this.params.noise.type]
      
      let maxPossibleHeight = 0
      let amplitude = 1
      for (let i = 0; i < this.params.noise.octaves; i++){
        maxPossibleHeight += amplitude
        amplitude *= this.params.noise.persistance
      }
  
      for (let y = 0; y < width; y++){
        for(let x = 0; x < width; x++){
          heights[y * width + x] = this.computeHeight(x, y, width, coords, noiseFunc)
        }
      }
  
      for (let y = 0; y < width; y++){
        for(let x = 0; x < width; x++){  
          let normHeight = (heights[y * width + x] + 1) / (2 * maxPossibleHeight)
          if (normHeight < 0) {
            normHeight = 0
          }
          heights[y * width + x] = Math.round((Math.pow(normHeight, this.params.noise.exponentiation) * this.params.terrain.maxHeight) * 100) / 100 
        }
      }
      return heights
    }

    generateNoiseMapNormalized(coords, width, dim) {
      const heights = new Array(dim)
      const noiseFunc = this.noise[this.params.noise.type]
      
      let maxPossibleHeight = 0
      let amplitude = 1
      for (let i = 0; i < this.params.noise.octaves; i++){
        maxPossibleHeight += amplitude
        amplitude *= this.params.noise.persistance
      }
  
      for (let y = 0; y < width; y++){
        for(let x = 0; x < width; x++){
          heights[y * width + x] = this.computeHeight(x, y, width, coords, noiseFunc)
        }
      }
  
      for (let y = 0; y < width; y++){
        for(let x = 0; x < width; x++){  
          let normHeight = (heights[y * width + x] + 1) / (2 * maxPossibleHeight)
          if (normHeight < 0) {
            normHeight = 0
          }
          heights[y * width + x] = normHeight
        }
      }
      return heights
    }
  }

  return {
    NoiseGenerator: Noise
  }

})();