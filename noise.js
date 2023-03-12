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
      for (let i = 0; i < 10; i++){
        let offX = Math.random() * 200000 - 100000
        let offY = Math.random() * 200000 - 100000
        this.octaveOffset[i] = new Vector2(offX, offY)
      }
      this.noise = {
        simplex: new SimplexWrapper(200),
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
  
      for(let i = 0; i < this.params.noise.octaves; i++){
  
        let xOff = ((x + coords[0] * (width - 1) + this.params.noise.offsetX) - halfW) / this.params.noise.scale * frequency + this.octaveOffset[i].x
        let yOff = ((y + coords[1] * (width - 1) - this.params.noise.offsetY) - halfH) / this.params.noise.scale * frequency + this.octaveOffset[i].y
  
        noiseValue = noiseFunc.noiseValue(xOff, yOff)
        noiseHeight += noiseValue * amplitude
  
        amplitude *= this.params.noise.persistance
        frequency *= this.params.noise.lacunarity
      }
  
      return noiseHeight
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
  
          let normHeight = (heights[y * width + x] + 1) / (2*maxPossibleHeight/1.65)
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