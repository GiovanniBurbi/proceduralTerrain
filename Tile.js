import * as THREE from 'three';
import { Noise } from './noise';

export class Tile {
  constructor(center, dim, noiseGen, params) {
    this.noise = noiseGen

    this.threshold = 0

    this.center = center
    this.dim = dim

    this.coords = [this.center[0]/this.dim, this.center[2]/this.dim]

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

    this.params = params

    this.heightMap = this.noise.generateNoiseMap(this.coords, this.width, this.num_vertex)
    this.buildTerrain()
    this.visualizeMap()
  }

  evaluate(v) {
    //  math curve for water, use some sort of spline bezier
      if (v < this.threshold) {
        return 0
      } else {
        return v
      }
  }

  buildTerrain() {
    let vertices = this.mesh.geometry.attributes.position.array.slice()

    for(let i = 0; i < this.heightMap.length; i++){      
      vertices[i * 3 + 2] = this.evaluate(this.heightMap[i]) * this.params.terrain.maxHeight
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
        if (c < 0.3){
          colors.push(c,c,c)
        } else {
          colors.push(c,c,c)
        }
      }
    }

    this.mesh.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

    this.mesh.geometry.materialNeedUpdate = true
  }

  rebuild() {
    this.heightMap = this.noise.generateNoiseMap(this.coords, this.width, this.num_vertex)

    this.buildTerrain()
    this.visualizeMap()
  }
}