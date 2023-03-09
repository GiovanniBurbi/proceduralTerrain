import * as THREE from 'three';
import { Vector2 } from 'three';
import { Perlin } from 'three-noise';

export class Tile {
  constructor(center, dim) {
    this.center = center
    this.dim = dim + 300

    this.segments = 30
    this.geometry = new THREE.PlaneGeometry( this.dim, this.dim, this.segments, this.segments)
    this.material = new THREE.MeshStandardMaterial( {
      wireframe: true,
    } )
    this.mesh = new THREE.Mesh( this.geometry, this.material )
    this.mesh.rotateX( - Math.PI / 2)

    this.mesh.castShadow = false;
    this.mesh.receiveShadow = true;

    this.mesh.position.copy(new THREE.Vector3().fromArray(center))

// 
// 

    this.geometry2 = new THREE.PlaneGeometry( this.dim, this.dim, this.segments, this.segments)
    this.material2 = new THREE.MeshStandardMaterial( {
      wireframe: false,
      vertexColors: true
    } )
    this.mesh2 = new THREE.Mesh( this.geometry2, this.material2 )
    this.mesh2.rotateX( - Math.PI / 2)

    this.mesh2.castShadow = false;
    this.mesh2.receiveShadow = true;

    let center2 = new Array(3)
    center2[0]=center[0]
    center2[1]=center[1]
    center2[2]=center[2] - this.dim

    this.mesh2.position.copy(new THREE.Vector3().fromArray(center2))

    this.noise = new Perlin(5)

    this.noiseMap()
    this.visualizeMap()
  }

  noiseMap() {
    const rand = 50
    let vertices = this.mesh.geometry.attributes.position.array.slice()
    const width = this.mesh.geometry.attributes.position.count / (this.segments + 1 )
    // console.log(width)

    let height = new Array(this.mesh.geometry.attributes.position.count)
    let pn
    let yOff = 0
    for (let y = 0; y < width; y++){
      let xOff = 0
      for(let x = 0; x < width; x++){
        pn = this.noise.get2(new THREE.Vector2(xOff, yOff))
        height[y * width + x] = pn * (rand + rand) - rand
        xOff += 0.35
      }
      yOff += 0.35
    }

    for(let i = 0; i < height.length; i++){
      vertices[i * 3 + 2] = height[i]
    }

    this.mesh.geometry.setAttribute('position', new THREE.BufferAttribute( new Float32Array(vertices), 3 ))

    this.mesh.geometry.elementsNeedUpdate = true;
    this.mesh.geometry.verticesNeedUpdate = true;
    this.mesh.geometry.computeVertexNormals();

    return vertices
  }

  visualizeMap() {
    let vertices = this.noiseMap()
    let colors = []
    const width = this.mesh.geometry.attributes.position.count / (this.segments + 1 )
    const rand = 50

    let r=0, g=0, b=0

    let yOff = 0
    for (let y = 0; y < width; y++){
      let xOff = 0
      for(let x = 0; x < width; x++){
        r = this.noise.get2(new THREE.Vector2(xOff, yOff))
        if (r < 0.8) {
          r += 0.1
        }
        colors.push(r, g, b)
        xOff +=0.35
      }
      yOff += 0.35
    }

    this.mesh2.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

    this.mesh.geometry.materialNeedUpdate = true
  }
}