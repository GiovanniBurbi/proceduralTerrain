import * as THREE from 'three';
import { HeightGenerator } from './helper';
import { noise } from './noise';
import alea from 'alea';

export class Chunk {
  constructor(dim, color, id, pos) {
    this.id = id
    this.center = pos.toArray()
    this.dim = dim
    this.halfDim = dim / 2

    this.segments = 128
    this.geometry = new THREE.PlaneGeometry( dim, dim, this.segments, this.segments )
    this.material = new THREE.MeshStandardMaterial( {
      wireframe: false,
      color: color
    } )
    this.mesh = new THREE.Mesh( this.geometry, this.material )
    this.mesh.rotateX( - Math.PI / 2)

    this.mesh.castShadow = false;
    this.mesh.receiveShadow = true;

    this.mesh.position.copy(pos)
    
    this.offset_x_dx = this.center[0] + this.halfDim
    this.offset_x_sx = this.center[0] - this.halfDim
    this.offset_z_up = this.center[2] + this.halfDim
    this.offset_z_down = this.center[2] - this.halfDim

    let noiseParams = {
      octaves: 6,
      persistence: 0.707,
      lacunarity: 1.8,
      exponentiation: 4.5,
      height: 300.0,
      scale: 800.0,
      noiseType: 'simplex',
      seed: alea(100)
    };
    
    this.noise = new noise.Noise(noiseParams);
    this.offset = new THREE.Vector2(this.center[0], this.center[2])


    // console.log(this.mesh.geometry)
    this.heightGen = new HeightGenerator(this.noise, this.offset, 100000, 100000 + 1)

    this.rebuild()
  }

  checkNewEntries(position, centerId) { 
    if (centerId !== this.id) {
      if (position.x < this.offset_x_dx && position.x > this.offset_x_sx &&
          position.z < this.offset_z_up && position.z > this.offset_z_down ) {
            this.sendNewCenter(this.id)
          }
    }   
  }

  sendNewCenter(id){
    const event = new CustomEvent('changeCenterTile', {detail: id})
    window.dispatchEvent(event)
  }

  changePosition(newCenterPos) {
    const dist = []
    for (let i = 0; i < this.center.length; i++) {
      dist.push(this.center[i] - newCenterPos[i])
    }
    
    if (Math.abs(dist[0]) < 2*this.dim && Math.abs(dist[2]) < 2*this.dim) return
    
    const distDelta = this.dim * 3
    let origin = new THREE.Vector3().fromArray(this.center)
    let dx, dz
    let newCenter

    if (Math.abs(dist[0]) === 2*this.dim && Math.abs(dist[2]) !== 2*this.dim) {
      dx = distDelta * Math.sign(dist[0]) * -1
      newCenter = origin.add(new THREE.Vector3(dx,0,0))
    }

    if(Math.abs(dist[2]) === 2*this.dim && Math.abs(dist[0]) !== 2*this.dim) {
      dz = distDelta * Math.sign(dist[2]) * - 1
      newCenter = origin.add(new THREE.Vector3(0,0,dz))
    }

    if(Math.abs(dist[2]) === 2*this.dim && Math.abs(dist[0]) === 2*this.dim) {
      dx = distDelta * Math.sign(dist[0]) * -1
      dz = distDelta * Math.sign(dist[2]) * -1
      newCenter = origin.add(new THREE.Vector3(dx,0,dz))
    }

    this.center = newCenter.toArray()
    this.updateBorders()
    this.mesh.position.copy(newCenter)
    this.rebuild()
  }

  updateBorders() {
    this.offset_x_dx = this.center[0] + this.halfDim
    this.offset_x_sx = this.center[0] - this.halfDim
    this.offset_z_up = this.center[2] + this.halfDim
    this.offset_z_down = this.center[2] - this.halfDim
  }

  rebuild() {
    let vertices = this.mesh.geometry.attributes.position.array.slice()
    for (let i = 0; i < vertices.length; i+=3) {
      const heightPairs = []
      let norm = 0
      vertices[i+2] = 0
      heightPairs.push(this.heightGen.Get(vertices[i] + this.offset.x, vertices[i+1] + this.offset.y))
      norm += heightPairs[heightPairs.length-1][1];
      if (norm > 0) {
        for(let h of heightPairs) {
          vertices[i+2] += h[0] * h[1] / norm
        }
      }
    }

    this.mesh.geometry.setAttribute('position', new THREE.BufferAttribute( vertices, 3 ))

    this.mesh.geometry.elementsNeedUpdate = true;
    this.mesh.geometry.verticesNeedUpdate = true;
    this.mesh.geometry.computeVertexNormals();
  }
}