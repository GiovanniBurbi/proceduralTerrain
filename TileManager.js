import * as THREE from "three"
import { Tile } from "./Tile"
import { noise } from "./noise"
import { VertexNormalsHelper } from 'three/addons/helpers/VertexNormalsHelper.js'
import { ColorGenerator } from "./ColorGenerator"

export class TileManager {
  constructor(tileDim, scene, gui, params) {
    this.tiles = []
    this.tileDim = tileDim
    this.tileGroup = new THREE.Group()
    this.scene = scene
    this.scene.add(this.tileGroup)
    this.helperGroup = new THREE.Group()
    this.scene.add(this.helperGroup)
    this.helpers = []
    this.wireframes = []

    this.centerId = 4
    this.centerTerrain = [0,0,0]

    this.ColorGen = new ColorGenerator(params)
    
    this.initGUI(gui, params)
    this.noise = new noise.NoiseGenerator(params)
 }

  initGUI(gui, params) {
    this.gui = gui
    this.params = params

    this.params.noise = {
      type: 'simplex',
      octaves: 8,
      persistance: 0.4,
      lacunarity: 2,
      exponentiation: 3,
      scale: 65.0,
      offsetX: 0,
      offsetY: 0,
    }

    this.params.terrain = {
      maxHeight: 700.0,
      showNormals: false,
      showWireframe: false
    }

    const onParamsChange = () =>  {
      for (let tile of this.tiles){
        tile.rebuild()
      }

      this.fixNormals()

      this.tiles.forEach(() => {
        if (this.params.terrain.showNormals) {
          this.updateNormals()
        }
      })
    }

    const onNormalViewChange = () => {
      if (this.params.terrain.showNormals) {
        for (let i = 0; i < this.tiles.length; i++) {
          this.helpers[i] = new VertexNormalsHelper( this.tiles[i].mesh, 1, 0xff0000 );
          this.helperGroup.add(this.helpers[i])
        }
        
      } else {
        for (let i = 0; i < this.helpers.length; i++) {
          this.helperGroup.remove(this.helpers[i])
        }
      }
    }

    const onWireframeViewChange = () => {
      if (this.params.terrain.showWireframe) {
        for (let tile of this.tiles) {
          tile.mesh.material.wireframe = true
          tile.mesh.material.vertexColors = false
          this.scene.background = new THREE.Color(0x000000)
        }
      } else {
        for (let tile of this.tiles) {
          tile.mesh.material.wireframe = false
          tile.mesh.material.vertexColors = true
          this.scene.background = new THREE.Color(0xaaaaaa)
        }
      }
    }

    this.createNoiseRollup(onParamsChange, onNormalViewChange, onWireframeViewChange)
  }

  updateNormals() {
    if (this.params.terrain.showNormals) {
      for (let i = 0; i < this.tiles.length; i++) {
        this.helperGroup.remove(this.helpers[i])
        this.helpers[i] = new VertexNormalsHelper( this.tiles[i].mesh, 1, 0xff0000 );
        this.helperGroup.add(this.helpers[i])
      }
    }
  }

  createNoiseRollup(funcChange, funcChange2, funcChange3) {
    const rollup = this.gui.addFolder('Noise')
    rollup.add(this.params.noise, 'type', ['perlin', 'simplex']).onFinishChange(funcChange)
    rollup.add(this.params.noise, 'octaves', 1, 20, 1) .onChange(funcChange)
    rollup.add(this.params.noise, 'persistance', 0.25, 1.0).onChange(funcChange)
    rollup.add(this.params.noise, 'lacunarity', 1.0, 3.0).onChange(funcChange)
    rollup.add(this.params.noise, 'exponentiation', 2.0, 5.0).onChange(funcChange)
    rollup.add(this.params.noise, 'scale', 5.0, 200.0).onChange(funcChange)
    rollup.add(this.params.noise, 'offsetX', 0.0, 250, 0.1).onChange(funcChange)
    rollup.add(this.params.noise, 'offsetY', 0.0, 250, 0.1).onChange(funcChange)

    const terrainRollup = this.gui.addFolder('Terrain')
    terrainRollup.add(this.params.terrain, 'maxHeight', 0, 1024).onChange(funcChange)
    terrainRollup.add(this.params.terrain, 'showNormals').onFinishChange(funcChange2)
    terrainRollup.add(this.params.terrain, 'showWireframe').onFinishChange(funcChange3)
  }

  createTiles(num_chunks) {
    let tilePos = [-this.tileDim, 0, -this.tileDim]

    if (num_chunks === 1) {
      tilePos = [0,0,0]
    }
    
    for(let i = 0; i < num_chunks; i++){
      this.tiles.push(new Tile(i, tilePos, this.tileDim, this.noise, this.params, this.ColorGen))
      tilePos[0] = tilePos[0] + this.tileDim
      if (i === 2 || i === 5) {
        tilePos[0] = -this.tileDim
        tilePos[2] = tilePos[2] + this.tileDim
    }
    this.tileGroup.add(this.tiles[i].mesh)
    }

    this.fixNormals()
  }

  checkNewEntries(newPos, centerId) {
    this.tiles.forEach(el => {
      el.isCenter(newPos, centerId)
    });
  }

  updateTiles(newCenterId) {
    this.centerId = newCenterId
    this.tiles.forEach(el => {
      if (el.id === newCenterId){
        this.centerTerrain = el.mesh.position.toArray().slice()
      }
    })
    // this.centerTerrain = this.tiles[this.centerId].mesh.position.toArray().slice()
    // const centerCoords = [this.centerTerrain[0]/this.tileDim,this.centerTerrain[2]/this.tileDim]
    // console.log('update new center: ' + centerCoords)

    this.tiles.forEach(el => {
      el.changePosition(this.centerTerrain, newCenterId)
      el.rebuild()
    });

    const centerCoords = [this.centerTerrain[0]/this.tileDim, this.centerTerrain[2]/this.tileDim]
    let tilesList = new Array(9)
    this.tiles.forEach(el => {
      let relPos = [el.coords[0] - centerCoords[0], el.coords[1] - centerCoords[1]]
      if (relPos[0] === 0){
        if (relPos[1] === 0){
          tilesList[4] = el
        } else if (relPos[1] === -1){
          tilesList[1] = el
        } else {
          tilesList[7] = el
        }
      } else if(relPos[0] === -1){
        if(relPos[1] === 0){
          tilesList[3] = el
        } else if(relPos[1] === -1){
          tilesList[0] = el
        } else {
          tilesList[6] = el
        }
      } else {
        if(relPos[1] === 0){
          tilesList[5] = el
        } else if(relPos[1] === -1){
          tilesList[2] = el
        } else {
          tilesList[8] = el
        }
      }
    });

    this.tiles = tilesList

    this.fixNormals()

    this.tiles.forEach(el => {
      if (this.params.terrain.showNormals) {
        this.updateNormals()
      }
    });
  }

  fixNormals() {
    let norm0 = this.tiles[0].mesh.geometry.attributes.normal.array.slice()
    let norm1 = this.tiles[1].mesh.geometry.attributes.normal.array.slice()
    let norm2 = this.tiles[2].mesh.geometry.attributes.normal.array.slice()
    let norm3 = this.tiles[3].mesh.geometry.attributes.normal.array.slice()
    let norm4 = this.tiles[4].mesh.geometry.attributes.normal.array.slice()
    let norm5 = this.tiles[5].mesh.geometry.attributes.normal.array.slice()
    let norm6 = this.tiles[6].mesh.geometry.attributes.normal.array.slice()
    let norm7 = this.tiles[7].mesh.geometry.attributes.normal.array.slice()
    let norm8 = this.tiles[8].mesh.geometry.attributes.normal.array.slice()

    let n0 = this.getComponents(norm0)
    let n1 = this.getComponents(norm1)
    let n2 = this.getComponents(norm2)
    let n3 = this.getComponents(norm3)
    let n4 = this.getComponents(norm4)
    let n5 = this.getComponents(norm5)
    let n6 = this.getComponents(norm6)
    let n7 = this.getComponents(norm7)
    let n8 = this.getComponents(norm8)

    const width = n3.length / (this.tiles[3].mesh.geometry.parameters.heightSegments + 1 )

    let mean0r = []
    let mean0b = []
    let mean1b = []
    let mean1l = []
    let mean1r = []
    let mean2l = []
    let mean2b = []
    let mean3r = []
    let mean3t = []
    let mean3b = []
    let mean4l = []
    let mean4t = []
    let mean4r = []
    let mean4b = []
    let mean5l = []
    let mean5b = []
    let mean5t = []
    let mean6t = []
    let mean6r = []
    let mean7t = []
    let mean7l = []
    let mean7r = []
    let mean8t = []
    let mean8l = []

    for(let y = 0; y < width; y++) {
      for(let x = 0; x < width; x++){
        if (x===width-1){
          mean0r.push(n0[y*width + x])
          mean1r.push(n1[y*width + x])
          mean3r.push(n3[y*width + x])
          mean4r.push(n4[y*width + x])
          mean6r.push(n6[y*width + x])
          mean7r.push(n7[y*width + x])
        }
        if (x === 0){
          mean1l.push(n1[y*width + x])
          mean2l.push(n2[y*width + x])
          mean4l.push(n4[y*width + x])
          mean5l.push(n5[y*width + x])
          mean7l.push(n7[y*width + x])
          mean8l.push(n8[y*width + x])
        }
        if (y === width-1){
          mean0b.push(n0[y*width + x])
          mean1b.push(n1[y*width + x])
          mean2b.push(n2[y*width + x])
          mean3b.push(n3[y*width + x])
          mean4b.push(n4[y*width + x])
          mean5b.push(n5[y*width + x])
        }
        if (y===0){
          mean3t.push(n3[y*width + x])
          mean4t.push(n4[y*width + x])
          mean5t.push(n5[y*width + x])
          mean6t.push(n6[y*width + x])
          mean7t.push(n7[y*width + x])
          mean8t.push(n8[y*width + x])
        }
      }
    }

    let mean01 = []
    let mean03 = []
    let mean12 = []
    let mean14 = []
    let mean25 = []
    let mean34 = []
    let mean36 = []
    let mean45 = []
    let mean47 = []
    let mean58 = []
    let mean67 = []
    let mean78 = []
    for (let i = 0; i < width; i++){
      mean01.push([(mean0r[i][0] + mean1l[i][0])/2, (mean0r[i][1] + mean1l[i][1])/2, (mean0r[i][2] + mean1l[i][2])/2])
      mean03.push([(mean0b[i][0] + mean3t[i][0])/2, (mean0b[i][1] + mean3t[i][1])/2, (mean0b[i][2] + mean3t[i][2])/2])
      mean12.push([(mean1r[i][0] + mean2l[i][0])/2, (mean1r[i][1] + mean2l[i][1])/2, (mean1r[i][2] + mean2l[i][2])/2])
      mean14.push([(mean1b[i][0] + mean4t[i][0])/2, (mean1b[i][1] + mean4t[i][1])/2, (mean1b[i][2] + mean4t[i][2])/2])
      mean25.push([(mean2b[i][0] + mean5t[i][0])/2, (mean2b[i][1] + mean5t[i][1])/2, (mean2b[i][2] + mean5t[i][2])/2])
      mean34.push([(mean3r[i][0] + mean4l[i][0])/2, (mean3r[i][1] + mean4l[i][1])/2, (mean3r[i][2] + mean4l[i][2])/2])
      mean36.push([(mean3b[i][0] + mean6t[i][0])/2, (mean3b[i][1] + mean6t[i][1])/2, (mean3b[i][2] + mean6t[i][2])/2])
      mean45.push([(mean5l[i][0] + mean4r[i][0])/2, (mean5l[i][1] + mean4r[i][1])/2, (mean5l[i][2] + mean4r[i][2])/2])
      mean47.push([(mean7t[i][0] + mean4b[i][0])/2, (mean7t[i][1] + mean4b[i][1])/2, (mean7t[i][2] + mean4b[i][2])/2])
      mean58.push([(mean5b[i][0] + mean8t[i][0])/2, (mean5b[i][1] + mean8t[i][1])/2, (mean5b[i][2] + mean8t[i][2])/2])
      mean67.push([(mean6r[i][0] + mean7l[i][0])/2, (mean6r[i][1] + mean7l[i][1])/2, (mean6r[i][2] + mean7l[i][2])/2])
      mean78.push([(mean7r[i][0] + mean8l[i][0])/2, (mean7r[i][1] + mean8l[i][1])/2, (mean7r[i][2] + mean8l[i][2])/2])
    }
    
    let n0m = n0.slice()
    let n1m = n1.slice()
    let n2m = n2.slice()
    let n3m = n3.slice()
    let n4m = n4.slice()
    let n5m = n5.slice()
    let n6m = n6.slice()
    let n7m = n7.slice()
    let n8m = n8.slice()

    let p = 0
    let o = 0
    let k = 0
    let f = 0
    for(let y = 0; y < width; y++) {
      for(let x = 0; x < width; x++){
        if (x===width-1){
          n0m[y*width + x] = mean01[p]
          n1m[y*width + x] = mean12[p]
          n3m[y*width + x] = mean34[p]
          n4m[y*width + x] = mean45[p]
          n6m[y*width + x] = mean67[p]
          n7m[y*width + x] = mean78[p]
          p+=1
        }
        if (x === 0){
          n1m[y*width + x] = mean01[o]
          n2m[y*width + x] = mean12[o]
          n4m[y*width + x] = mean34[o]
          n5m[y*width + x] = mean45[o]
          n7m[y*width + x] = mean67[o]
          n8m[y*width + x] = mean78[o]
          o+=1
        }
        if(y === width-1){
          n0m[y*width + x] = mean03[k]
          n1m[y*width + x] = mean14[k]
          n2m[y*width + x] = mean25[k]
          n3m[y*width + x] = mean36[k]
          n4m[y*width + x] = mean47[k]
          n5m[y*width + x] = mean58[k]
          k+=1
        }
        if (y === 0){
          n3m[y*width + x] = mean03[f]
          n4m[y*width + x] = mean14[f]
          n5m[y*width + x] = mean25[f]
          n6m[y*width + x] = mean36[f]
          n7m[y*width + x] = mean47[f]
          n8m[y*width + x] = mean58[f]
          f+=1
        }
      }
    }

    let newNorm1 = this.reverseComponents(n1m)
    let newNorm2 = this.reverseComponents(n2m)
    let newNorm3 = this.reverseComponents(n3m) 
    let newNorm4 = this.reverseComponents(n4m)
    let newNorm5 = this.reverseComponents(n5m)
    let newNorm6 = this.reverseComponents(n6m)
    let newNorm7 = this.reverseComponents(n7m)
    let newNorm8 = this.reverseComponents(n8m)

    this.tiles[1].mesh.geometry.setAttribute('normal', new THREE.BufferAttribute( new Float32Array(newNorm1), 3 ))
    this.tiles[2].mesh.geometry.setAttribute('normal', new THREE.BufferAttribute( new Float32Array(newNorm2), 3 ))
    this.tiles[3].mesh.geometry.setAttribute('normal', new THREE.BufferAttribute( new Float32Array(newNorm3), 3 ))
    this.tiles[4].mesh.geometry.setAttribute('normal', new THREE.BufferAttribute( new Float32Array(newNorm4), 3 ))
    this.tiles[5].mesh.geometry.setAttribute('normal', new THREE.BufferAttribute( new Float32Array(newNorm5), 3 ))
    this.tiles[6].mesh.geometry.setAttribute('normal', new THREE.BufferAttribute( new Float32Array(newNorm6), 3 ))
    this.tiles[7].mesh.geometry.setAttribute('normal', new THREE.BufferAttribute( new Float32Array(newNorm7), 3 ))
    this.tiles[8].mesh.geometry.setAttribute('normal', new THREE.BufferAttribute( new Float32Array(newNorm8), 3 ))

    this.tiles[1].mesh.geometry.attributes.normal.needsUpdate = true;
    this.tiles[2].mesh.geometry.attributes.normal.needsUpdate = true;
    this.tiles[3].mesh.geometry.attributes.normal.needsUpdate = true;
    this.tiles[4].mesh.geometry.attributes.normal.needsUpdate = true;
    this.tiles[5].mesh.geometry.attributes.normal.needsUpdate = true;
    this.tiles[6].mesh.geometry.attributes.normal.needsUpdate = true;
    this.tiles[7].mesh.geometry.attributes.normal.needsUpdate = true;
    this.tiles[8].mesh.geometry.attributes.normal.needsUpdate = true;
  }

  getComponents(vector) {
    let v = []
    for(let i = 0; i < vector.length; i+=3){
      v.push([vector[i], vector[i+1], vector[i+2]])   
    }
    return v
  }

  reverseComponents(vector){
    let v = []
    for(let i = 0; i < vector.length; i++){
      v.push(vector[i][0], vector[i][1], vector[i][2])
    }
    return v
  }
}