import * as THREE from 'three';
import { Noise } from './noise';

export class Tile {
  constructor(center, dim, gui, params) {

    this.initGUI(gui, params)

    this.noise = new Noise(params)

    this.hScale = 10

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

    this.num_vertex = this.mesh.geometry.attributes.position.count

    this.mesh.castShadow = false;
    this.mesh.receiveShadow = true;

    this.mesh.position.copy(new THREE.Vector3().fromArray(center))

    this.width = this.mesh.geometry.attributes.position.count / (this.segments + 1 )

    this.heightMap = this.noise.generateNoiseMap(this.width, this.num_vertex)
    this.buildTerrain()
    this.visualizeMap()
  }

  initGUI(gui, params) {
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

    const onNoiseChange = () =>  {
      this.heightMap = this.noise.generateNoiseMap(this.width, this.num_vertex)
      this.visualizeMap()
      this.buildTerrain()
    }

    this.createNoiseRollup(onNoiseChange)
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

  buildTerrain() {
    let vertices = this.mesh.geometry.attributes.position.array.slice()

    for(let i = 0; i < this.heightMap.length; i++){
      vertices[i * 3 + 2] = this.heightMap[i] * (2 * this.hScale) - this.hScale
    }

    this.mesh.geometry.setAttribute('position', new THREE.BufferAttribute( new Float32Array(vertices), 3 ))

    this.mesh.geometry.elementsNeedUpdate = true;
    this.mesh.geometry.verticesNeedUpdate = true;
    this.mesh.geometry.computeVertexNormals();
  }

  visualizeMap() {
    let colors = []

    for (let y = 0; y < this.width; y++){
      for(let x = 0; x < this.width; x++){
        let c = this.heightMap[y * this.width + x]
        colors.push(c,c,c)
      }
    }

    this.mesh.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

    this.mesh.geometry.materialNeedUpdate = true
  }
}