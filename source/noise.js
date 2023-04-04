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

      // fixed terrain at every refresh
      
      // const offsets = [
      //   {
      //       "x": 95820.23101539508,
      //       "y": -22016.60029684956
      //   },
      //   {
      //       "x": -55820.21158356874,
      //       "y": -72769.2252462992
      //   },
      //   {
      //       "x": 30532.425386991104,
      //       "y": -55639.51162387437
      //   },
      //   {
      //       "x": -65110.189891071714,
      //       "y": 48938.4810224144
      //   },
      //   {
      //       "x": -82839.44163978698,
      //       "y": -89522.01802760187
      //   },
      //   {
      //       "x": 21382.05801609611,
      //       "y": 97047.93487324569
      //   },
      //   {
      //       "x": -56875.936656426566,
      //       "y": 12927.159248583965
      //   },
      //   {
      //       "x": 78590.73310458401,
      //       "y": 16183.635652242505
      //   },
      //   {
      //       "x": 97251.3806384035,
      //       "y": 42939.11142527408
      //   },
      //   {
      //       "x": -23535.605210458365,
      //       "y": 69402.64850714538
      //   },
      //   {
      //       "x": 47735.88218386483,
      //       "y": -72093.5279068466
      //   },
      //   {
      //       "x": 61760.24244038481,
      //       "y": -95376.37444496516
      //   },
      //   {
      //       "x": 74099.70948868102,
      //       "y": -28993.975947100655
      //   },
      //   {
      //       "x": 32381.586477710953,
      //       "y": -87609.26757903853
      //   },
      //   {
      //       "x": -90809.23372637293,
      //       "y": 73992.2488727943
      //   },
      //   {
      //       "x": 25099.836787095643,
      //       "y": -14369.29525290495
      //   },
      //   {
      //       "x": -47061.811529645944,
      //       "y": 77777.59561706657
      //   },
      //   {
      //       "x": -90576.96645502666,
      //       "y": 11744.198253185445
      //   },
      //   {
      //       "x": 52968.102767495,
      //       "y": 63741.984713895974
      //   },
      //   {
      //       "x": -34332.435732511396,
      //       "y": -40108.781196455864
      //   }
      // ]

      // this.octaveOffset = []
      // for (let i = 0; i < 20; i++){
      //   let x = offsets[i].x
      //   let y = offsets[i].y
      //   this.octaveOffset[i] = new Vector2(x, y)
      // }

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
  }

  return {
    NoiseGenerator: Noise
  }

})();