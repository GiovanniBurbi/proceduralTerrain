import * as THREE from 'three';

export class Tile {
  constructor(id, center, dim, noiseGen, params, colorGenerator) {
    this.id = id
    this.noise = noiseGen
    this.colorGen = colorGenerator

    this.uc = [[1,1,1], [1,1,1], [1,1,1], [1,1,1], [1,1,1], [1,1,1], [1,1,1], [1,1,1], [1,1,1]]
    // this.uc = [[1,1,1], [1,0,0],[0,1,0],[0,0.5,1],[1,1,0], [1,0,1], [0,1,1],[0.5,1,0.5], [1,0.5,0.5]]

    this.center = center
    this.dim = dim
    this.halfDim = dim / 2

    this.coords = [this.center[0]/this.dim, this.center[2]/this.dim]

    this.segments = 32
    this.geometry = new THREE.PlaneGeometry( this.dim, this.dim, this.segments, this.segments)
    this.material = new THREE.MeshStandardMaterial( {
      wireframe: false,
      vertexColors: true,
    } )

    this.heightMap = []

    this.width = this.geometry.attributes.position.count / (this.segments + 1 )

    for (let y = 0; y < this.width; y++){
      for(let x = 0; x < this.width; x++){
        this.heightMap[y * this.width + x] = 0
      }
    }

    this.mesh = new THREE.Mesh( this.geometry, this.material )
    this.mesh.rotateX( - Math.PI / 2)

    this.num_vertex = this.mesh.geometry.attributes.position.count

    this.mesh.castShadow = false;
    this.mesh.receiveShadow = true;

    this.mesh.position.copy(new THREE.Vector3().fromArray(center))

    this.params = params

    this.offset_x_dx = this.center[0] + this.halfDim
    this.offset_x_sx = this.center[0] - this.halfDim
    this.offset_z_up = this.center[2] + this.halfDim
    this.offset_z_down = this.center[2] - this.halfDim

    this.rebuild()
  }

  buildTerrain() {
    let vertices = this.mesh.geometry.attributes.position.array.slice()

    for(let i = 0; i < this.heightMap.length; i++){
      vertices[i * 3 + 2] = this.heightMap[i]
    }

    this.mesh.geometry.setAttribute('position', new THREE.BufferAttribute( new Float32Array(vertices), 3 ))

    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();
    this.mesh.geometry.attributes.normal.needsUpdate = true;
  }

  colorTerrain() {
    let colors = null
    if (this.params.terrain.noColors){
      colors = this.colorGen.uniformMap(this.width, this.uc[this.id]) 
    } else {
      colors = this.colorGen.colorMap(this.heightMap, this.width) 
    }

    this.mesh.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

    this.mesh.geometry.materialNeedUpdate = true
  }

  setNormals(normal) {
    this.mesh.geometry.setAttribute('normal', new THREE.BufferAttribute( new Float32Array(normal), 3 ))
    this.mesh.geometry.elementsNeedUpdate = true;
    this.mesh.geometry.verticesNeedUpdate = true;
  }

  rebuild() {
    this.heightMap = this.noise.generateNoiseMap(this.coords, this.width, this.num_vertex)

    this.buildTerrain()
    this.colorTerrain()
  }

  isCenter(position, centerId) {
    if (centerId !== this.id) {
      if (position.x < this.offset_x_dx && position.x > this.offset_x_sx &&
          position.z < this.offset_z_up && position.z > this.offset_z_down ) {
            this.signalNewCenter(this.id)
          }
    }
  }

  signalNewCenter(id){
    const event = new CustomEvent('changeCenterTile', {detail: id})
    window.dispatchEvent(event)
  }

  changePosition(newCenterPos) {
    const dist = []
    const tilePos = this.mesh.position.toArray().slice()
    for (let i = 0; i < this.center.length; i++) {
      dist.push(tilePos[i] - newCenterPos[i])
    }

    if (Math.abs(dist[0]) < 2 * this.dim && Math.abs(dist[2]) < 2 * this.dim) return
    
    const distDelta = this.dim * 3
    let origin = this.mesh.position.clone()

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
    this.coords = [this.center[0]/this.dim, this.center[2]/this.dim]
    this.mesh.position.copy(newCenter)
  }

  updateBorders() {
    this.offset_x_dx = this.center[0] + this.halfDim
    this.offset_x_sx = this.center[0] - this.halfDim
    this.offset_z_up = this.center[2] + this.halfDim
    this.offset_z_down = this.center[2] - this.halfDim
  }
}