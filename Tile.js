import * as THREE from 'three';
import { Perlin } from 'three-noise';

export class Tile {
  constructor(center, dim) {
    this.center = center
    this.dim = dim

    this.segments = 30
    this.geometry = new THREE.PlaneGeometry( this.dim, this.dim, this.segments, this.segments)
    this.material = new THREE.MeshStandardMaterial( {
      wireframe: false,
      vertexColors: true,
      transparent : true,
    } )
    this.mesh = new THREE.Mesh( this.geometry, this.material )
    this.mesh.rotateX( - Math.PI / 2)

    this.mesh.castShadow = false;
    this.mesh.receiveShadow = true;

    this.mesh.position.copy(new THREE.Vector3().fromArray(center))

    this.width = this.mesh.geometry.attributes.position.count / (this.segments + 1 )

// 
// 

    this.geometry2 = new THREE.PlaneGeometry( this.dim, this.dim, this.segments, this.segments)
    this.material2 = new THREE.MeshStandardMaterial( {
      wireframe: false,
      vertexColors: true,
      transparent : true,
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

    this.noise = new Perlin(36)

    this.noiseMap()
    this.visualizeMap()
  }

  noiseMap() {
    const rand = 40
    let vertices = this.mesh.geometry.attributes.position.array.slice()
    const scale = 5.3

    this.height = new Array(this.mesh.geometry.attributes.position.count)
    let pn
    let yOff = 0
    for (let y = 0; y < this.width; y++){
      let xOff = 0
      for(let x = 0; x < this.width; x++){
        // pn = this.noise.get2(new THREE.Vector2(xOff, yOff))
        xOff = x / scale
        yOff = y / scale
        pn = Math.abs(this.noise.get2(new THREE.Vector2(xOff, yOff))) 
        this.height[y * this.width + x] = pn 
        // xOff += 0.2
      }
      // yOff += 0.2
    }

    for(let i = 0; i < this.height.length; i++){
      vertices[i * 3 + 2] = this.height[i] * (rand + rand) - rand
    }

    this.mesh.geometry.setAttribute('position', new THREE.BufferAttribute( new Float32Array(vertices), 3 ))

    this.mesh.geometry.elementsNeedUpdate = true;
    this.mesh.geometry.verticesNeedUpdate = true;
    this.mesh.geometry.computeVertexNormals();

    return vertices
  }

  visualizeMap() {
    // use value of height vector to create a new smaller mesh so that the noise 
    // can be visualized
    let a

    this.mesh2.geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.width*this.width*4, 4))
    this.mesh.geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.width*this.width*4, 4))

    for (let y = 0; y < this.width; y++){
      for(let x = 0; x < this.width; x++){
        let p = y * this.width + x
        //  multiply per 2 to increase contrast
        a = Math.abs(this.height[p]) * 2
        this.mesh2.geometry.attributes.color.setXYZW( p, 1, 1, 1, a)
        this.mesh.geometry.attributes.color.setXYZW( p, a/2, 0, 0, 1)
      }
    }

    this.mesh2.geometry.materialNeedUpdate = true
    this.mesh.geometry.materialNeedUpdate = true
  }
}