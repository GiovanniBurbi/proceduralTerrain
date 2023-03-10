import * as THREE from 'three';
import { math } from './math';
import perlin from 'https://cdn.jsdelivr.net/gh/mikechambers/es6-perlin-module/perlin.js'

export class Tile {
  constructor(center, dim, gui, params) {
    this.gui = gui
    this.params = params

    this.params.noise = {
      octaves: 4,
      persistance: 0.5,
      lacunarity: 2,
      scale: 8,
      offsetX: 0,
      offsetY: 0
    }

    

    this.randOff = Math.random() * 20000 - 10000

    const onNoiseChange = () =>  {
      this.visualizeMap()
      this.buildTerrain()
    }

    this.createNoiseRollup(onNoiseChange)

    this.center = center
    this.dim = dim

    this.segments = 30
    this.geometry = new THREE.PlaneGeometry( this.dim, this.dim, this.segments, this.segments)
    this.material = new THREE.MeshStandardMaterial( {
      wireframe: false,
      vertexColors: true,
    } )
    this.mesh = new THREE.Mesh( this.geometry, this.material )
    this.mesh.rotateX( - Math.PI / 2)

    this.mesh.castShadow = false;
    this.mesh.receiveShadow = true;

    this.mesh.position.copy(new THREE.Vector3().fromArray(center))

    this.width = this.mesh.geometry.attributes.position.count / (this.segments + 1 )

    this.buildTerrain()
    this.visualizeMap()
  }

  generateNoiseMap() {
    const heights = new Array(this.mesh.geometry.attributes.position.count)

    let maxNoiseHeight = Number.NEGATIVE_INFINITY 
    let minNoiseHeight = Number.POSITIVE_INFINITY

    for (let y = 0; y < this.width; y++){
      for(let x = 0; x < this.width; x++){
        let noiseValue = this.computeHeight(x, y)

        heights[y * this.width + x] = noiseValue 

        if (noiseValue > maxNoiseHeight) {
          maxNoiseHeight = noiseValue
        }
        if (noiseValue < minNoiseHeight) {
          minNoiseHeight = noiseValue
        }
      }
    }

    for (let y = 0; y < this.width; y++){
      for(let x = 0; x < this.width; x++){
        heights[y * this.width + x] = math.invLerp(heights[y * this.width + x], minNoiseHeight, maxNoiseHeight)
      }
    }
    return heights
  }

  computeHeight(x, y) {

    let amplitude = 1
    let frequency = 1
    let noiseHeight = 0

    let perlinNoise

    const halfW = this.width / 2
    const halfH = this.width / 2

    for(let i = 0; i < this.params.noise.octaves; i++){
      let xOff = (x - halfW) / this.params.noise.scale * frequency + this.params.noise.offsetX + this.randOff
      let yOff = (y - halfH) / this.params.noise.scale * frequency + this.params.noise.offsetY + this.randOff

      // this noise return values between -1 and 1
      perlinNoise = perlin(xOff, yOff) * 2 - 1
      noiseHeight += perlinNoise * amplitude

      amplitude *= this.params.noise.persistance
      frequency *= this.params.noise.lacunarity
    }

    return noiseHeight
  }

  buildTerrain() {
    const rand = 10
    let vertices = this.mesh.geometry.attributes.position.array.slice()
    
    const heights = this.generateNoiseMap()

    for(let i = 0; i < heights.length; i++){
      // vertices[i * 3 + 2] = heights[i]
      vertices[i * 3 + 2] = heights[i] * (rand + rand) - rand
    }

    this.mesh.geometry.setAttribute('position', new THREE.BufferAttribute( new Float32Array(vertices), 3 ))

    this.mesh.geometry.elementsNeedUpdate = true;
    this.mesh.geometry.verticesNeedUpdate = true;
    this.mesh.geometry.computeVertexNormals();
  }

  visualizeMap() {
    const heights = this.generateNoiseMap()

    let colors = []

    for (let y = 0; y < this.width; y++){
      for(let x = 0; x < this.width; x++){
        let c = heights[y * this.width + x]
        colors.push(c,c,c)
      }
    }

    this.mesh.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

    this.mesh.geometry.materialNeedUpdate = true
  }

  createNoiseRollup(funcChange) {
    const rollup = this.gui.addFolder('Noise')
    rollup.add(this.params.noise, 'octaves', 1, 10, 1) .onChange(funcChange)
    rollup.add(this.params.noise, 'persistance', 0.1, 1.0, 0.1).onChange(funcChange)
    rollup.add(this.params.noise, 'lacunarity', 1, 10, 0.1).onChange(funcChange)
    rollup.add(this.params.noise, 'scale', 0.3, 30).onChange(funcChange)
    rollup.add(this.params.noise, 'offsetX', 0.0, 20, 0.1).onChange(funcChange)
    rollup.add(this.params.noise, 'offsetY', 0.0, 20, 0.1).onChange(funcChange)
  }
}