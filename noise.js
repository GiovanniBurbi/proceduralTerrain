import { math } from './math';
import perlin from 'https://cdn.jsdelivr.net/gh/mikechambers/es6-perlin-module/perlin.js'

export class Noise {
  constructor(params) {
    this.params = params
    this.randOff = Math.random() * 20000 - 10000
  }

  computeHeight(x, y, width) {
    let amplitude = 1
    let frequency = 1
    let noiseHeight = 0

    let noiseValue

    const halfW = width / 2
    const halfH = width / 2

    for(let i = 0; i < this.params.noise.octaves; i++){
      let xOff = (x - halfW) / this.params.noise.scale * frequency + this.params.noise.offsetX + this.randOff
      let yOff = (y - halfH) / this.params.noise.scale * frequency + this.params.noise.offsetY + this.randOff

      noiseValue = perlin(xOff, yOff) * 2 - 1
      noiseHeight += noiseValue * amplitude

      amplitude *= this.params.noise.persistance
      frequency *= this.params.noise.lacunarity
    }

    return noiseHeight
  }

  generateNoiseMap(width, dim) {
    const heights = new Array(dim)

    let maxNoiseHeight = Number.NEGATIVE_INFINITY 
    let minNoiseHeight = Number.POSITIVE_INFINITY

    for (let y = 0; y < width; y++){
      for(let x = 0; x < width; x++){
        let noiseValue = this.computeHeight(x, y, width)

        heights[y * width + x] = noiseValue 

        if (noiseValue > maxNoiseHeight) {
          maxNoiseHeight = noiseValue
        }
        if (noiseValue < minNoiseHeight) {
          minNoiseHeight = noiseValue
        }
      }
    }

    for (let y = 0; y < width; y++){
      for(let x = 0; x < width; x++){
        heights[y * width + x] = math.invLerp(heights[y * width + x], minNoiseHeight, maxNoiseHeight)
      }
    }
    return heights
  }
}