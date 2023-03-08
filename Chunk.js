import * as THREE from 'three';

export class Chunk {
  constructor(dim, color, id, pos) {
    this.id = id
    this.center = pos.toArray()
    this.dim = dim
    this.halfDim = dim / 2
    this.geometry = new THREE.PlaneGeometry( dim, dim )
    this.material = new THREE.MeshStandardMaterial( {
      wireframe: false,
      color: color
    } )
    this.mesh = new THREE.Mesh( this.geometry, this.material )
    this.mesh.rotateX( - Math.PI / 2)

    this.mesh.position.copy(pos)
    
    this.offset_x_dx = this.center[0] + this.halfDim
    this.offset_x_sx = this.center[0] - this.halfDim
    this.offset_z_up = this.center[2] + this.halfDim
    this.offset_z_down = this.center[2] - this.halfDim
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
  }

  updateBorders() {
    this.offset_x_dx = this.center[0] + this.halfDim
    this.offset_x_sx = this.center[0] - this.halfDim
    this.offset_z_up = this.center[2] + this.halfDim
    this.offset_z_down = this.center[2] - this.halfDim
  }
}