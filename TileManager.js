import * as THREE from "three"
import { Tile } from "./Tile"
import { noise } from "./noise"
import { VertexNormalsHelper } from 'three/addons/helpers/VertexNormalsHelper.js'
import { ColorGenerator } from "./ColorGenerator"
import { Fog } from './fog';


const event = new Event('needRender')
export class TileManager {
  constructor(tileDim, scene, gui, params) {
    this.tiles = []
    this.borderTiles = []
    this.tileDim = tileDim
    this.tileGroup = new THREE.Group()
    this.scene = scene
    this.scene.add(this.tileGroup)
    this.helperGroup = new THREE.Group()
    this.scene.add(this.helperGroup)
    this.helpers = []
    this.wireframes = []

    this.fog = new Fog(this.scene)

    this.centerId = 4
    this.centerTerrain = [0,0,0]

    this.ColorGen = new ColorGenerator(params)
    
    this.initGUI(gui, params)
    this.noise = new noise.NoiseGenerator(params)

    this.fog.get_fog(this.params.terrain.fog_type)
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
      showWireframe: false,
      noColors: false,
      fixNormals: true,
      fog_type: 'none',
    }

    const onParamsChange = () =>  {
      for (let tile of this.tiles){
        tile.rebuild()
      }

      if(this.params.terrain.fixNormals){
        this.fixNormals()
      }

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
          this.scene.background = new THREE.Color(0x000000)
        }
      }
    }

    const onFogChange = () => {
      this.fog.get_fog(this.params.terrain.fog_type)
      window.dispatchEvent(event)
    }

    this.createNoiseRollup(onParamsChange, onNormalViewChange, onWireframeViewChange, onFogChange)
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

  createNoiseRollup(funcChange, funcChange2, funcChange3, funcChange4) {
    const rollup = this.gui.addFolder('Noise')
    rollup.add(this.params.noise, 'type', ['perlin', 'simplex']).onFinishChange(funcChange)
    rollup.add(this.params.noise, 'octaves', 1, 20, 1) .onChange(funcChange)
    rollup.add(this.params.noise, 'persistance', 0.25, 1.0).onChange(funcChange)
    rollup.add(this.params.noise, 'lacunarity', 1.0, 3.0).onChange(funcChange)
    rollup.add(this.params.noise, 'exponentiation', 1.0, 5.0).onChange(funcChange)
    rollup.add(this.params.noise, 'scale', 5.0, 200.0).onChange(funcChange)
    rollup.add(this.params.noise, 'offsetX', 0.0, 250, 0.1).onChange(funcChange)
    rollup.add(this.params.noise, 'offsetY', 0.0, 250, 0.1).onChange(funcChange)

    const terrainRollup = this.gui.addFolder('Terrain')
    terrainRollup.add(this.params.terrain, 'maxHeight', 0, 1024).onChange(funcChange)
    terrainRollup.add(this.params.terrain, 'showNormals').onFinishChange(funcChange2)
    terrainRollup.add(this.params.terrain, 'showWireframe').onFinishChange(funcChange3)
    terrainRollup.add(this.params.terrain, 'noColors').onFinishChange(funcChange)
    terrainRollup.add(this.params.terrain, 'fixNormals').onFinishChange(funcChange)
    terrainRollup.add(this.params.terrain, 'fog_type', ['none', 'linear', 'exp', 'volumetric', 'volum_domain_wrapping']).onFinishChange(funcChange4)
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
    if(num_chunks !== 1){
      if(this.params.terrain.fixNormals){
        this.fixNormals()
      }
    }
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

    this.tiles.forEach(el => {
      el.changePosition(this.centerTerrain)
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

    if(this.params.terrain.fixNormals){
      this.fixNormals()
    }

    this.tiles.forEach(() => {
      if (this.params.terrain.showNormals) {
        this.updateNormals()
      }
    });
  }

  getRelevantEdges(norms, width){
    let data = {}
    data['0r'] = []
    data['0b'] = []
    data['1l'] = []
    data['1b'] = []
    data['1r'] = []
    data['2l'] = []
    data['2b'] = []
    data['3t'] = []
    data['3r'] = []
    data['3b'] = []
    data['4t'] = []
    data['4r'] = []
    data['4b'] = []
    data['4l'] = []
    data['5t'] = []
    data['5b'] = []
    data['5l'] = []
    data['6r'] = []
    data['6t'] = []
    data['7t'] = []
    data['7r'] = []
    data['7l'] = []
    data['8t'] = []
    data['8l'] = []

    for(let y = 0; y < width; y++) {
      for(let x = 0; x < width; x++){
        if (x===width-1){
          data['0r'].push(norms[0][y*width + x])
          data['1r'].push(norms[1][y*width + x])
          data['3r'].push(norms[3][y*width + x])
          data['4r'].push(norms[4][y*width + x])
          data['6r'].push(norms[6][y*width + x])
          data['7r'].push(norms[7][y*width + x])
        }
        if (x === 0){
          data['1l'].push(norms[1][y*width + x])
          data['2l'].push(norms[2][y*width + x])
          data['4l'].push(norms[4][y*width + x])
          data['5l'].push(norms[5][y*width + x])
          data['7l'].push(norms[7][y*width + x])
          data['8l'].push(norms[8][y*width + x])
        }
        if (y === width-1){
          data['0b'].push(norms[0][y*width + x])
          data['1b'].push(norms[1][y*width + x])
          data['2b'].push(norms[2][y*width + x])
          data['3b'].push(norms[3][y*width + x])
          data['4b'].push(norms[4][y*width + x])
          data['5b'].push(norms[5][y*width + x])
        }
        if (y===0){
          data['3t'].push(norms[3][y*width + x])
          data['4t'].push(norms[4][y*width + x])
          data['5t'].push(norms[5][y*width + x])
          data['6t'].push(norms[6][y*width + x])
          data['7t'].push(norms[7][y*width + x])
          data['8t'].push(norms[8][y*width + x])
        }
      }
    }

    return data
  }

  computeRelevantMeans(data, width){
    let means = {}
    means['01'] = []
    means['03'] = []
    means['12'] = []
    means['14'] = []
    means['25'] = []
    means['34'] = []
    means['36'] = []
    means['45'] = []
    means['47'] = []
    means['58'] = []
    means['67'] = []
    means['78'] = []
    for (let i = 0; i < width; i++){
      means['01'].push([(data['0r'][i][0] + data['1l'][i][0])/2, (data['0r'][i][1] + data['1l'][i][1])/2, (data['0r'][i][2] + data['1l'][i][2])/2])
      means['03'].push([(data['0b'][i][0] + data['3t'][i][0])/2, (data['0b'][i][1] + data['3t'][i][1])/2, (data['0b'][i][2] + data['3t'][i][2])/2])
      means['12'].push([(data['1r'][i][0] + data['2l'][i][0])/2, (data['1r'][i][1] + data['2l'][i][1])/2, (data['1r'][i][2] + data['2l'][i][2])/2])
      means['14'].push([(data['1b'][i][0] + data['4t'][i][0])/2, (data['1b'][i][1] + data['4t'][i][1])/2, (data['1b'][i][2] + data['4t'][i][2])/2])
      means['25'].push([(data['2b'][i][0] + data['5t'][i][0])/2, (data['2b'][i][1] + data['5t'][i][1])/2, (data['2b'][i][2] + data['5t'][i][2])/2])
      means['34'].push([(data['3r'][i][0] + data['4l'][i][0])/2, (data['3r'][i][1] + data['4l'][i][1])/2, (data['3r'][i][2] + data['4l'][i][2])/2])
      means['36'].push([(data['3b'][i][0] + data['6t'][i][0])/2, (data['3b'][i][1] + data['6t'][i][1])/2, (data['3b'][i][2] + data['6t'][i][2])/2])
      means['45'].push([(data['5l'][i][0] + data['4r'][i][0])/2, (data['5l'][i][1] + data['4r'][i][1])/2, (data['5l'][i][2] + data['4r'][i][2])/2])
      means['47'].push([(data['7t'][i][0] + data['4b'][i][0])/2, (data['7t'][i][1] + data['4b'][i][1])/2, (data['7t'][i][2] + data['4b'][i][2])/2])
      means['58'].push([(data['5b'][i][0] + data['8t'][i][0])/2, (data['5b'][i][1] + data['8t'][i][1])/2, (data['5b'][i][2] + data['8t'][i][2])/2])
      means['67'].push([(data['6r'][i][0] + data['7l'][i][0])/2, (data['6r'][i][1] + data['7l'][i][1])/2, (data['6r'][i][2] + data['7l'][i][2])/2])
      means['78'].push([(data['7r'][i][0] + data['8l'][i][0])/2, (data['7r'][i][1] + data['8l'][i][1])/2, (data['7r'][i][2] + data['8l'][i][2])/2])
    }

    return means
  }

  updateNormals(norms, means, width){
    let newNorms = []
    for(let i = 0; i < norms.length; i++){
      newNorms.push(norms[i].slice())
    }

    let p = 0
    let o = 0
    let k = 0
    let f = 0
    for(let y = 0; y < width; y++) {
      for(let x = 0; x < width; x++){
        if (x===width-1){
          newNorms[0][y*width + x] = means['01'][p]
          newNorms[1][y*width + x] = means['12'][p]
          newNorms[3][y*width + x] = means['34'][p]
          newNorms[4][y*width + x] = means['45'][p]
          newNorms[6][y*width + x] = means['67'][p]
          newNorms[7][y*width + x] = means['78'][p]
          p+=1
        }
        if (x === 0){
          newNorms[1][y*width + x] = means['01'][o]
          newNorms[2][y*width + x] = means['12'][o]
          newNorms[4][y*width + x] = means['34'][o]
          newNorms[5][y*width + x] = means['45'][o]
          newNorms[7][y*width + x] = means['67'][o]
          newNorms[8][y*width + x] = means['78'][o]
          o+=1
        }
        if(y === width-1){
          newNorms[0][y*width + x] = means['03'][k]
          newNorms[1][y*width + x] = means['14'][k]
          newNorms[2][y*width + x] = means['25'][k]
          newNorms[3][y*width + x] = means['36'][k]
          newNorms[4][y*width + x] = means['47'][k]
          newNorms[5][y*width + x] = means['58'][k]
          k+=1
        }
        if (y === 0){
          newNorms[3][y*width + x] = means['03'][f]
          newNorms[4][y*width + x] = means['14'][f]
          newNorms[5][y*width + x] = means['25'][f]
          newNorms[6][y*width + x] = means['36'][f]
          newNorms[7][y*width + x] = means['47'][f]
          newNorms[8][y*width + x] = means['58'][f]
          f+=1
        }
      }
    }

    for (let i = 0; i < newNorms.length; i++){
      newNorms[i] = this.reverseComponents(newNorms[i])
    }

    return newNorms
  }

  fixNormals() {
    const width = this.tiles[0].mesh.geometry.attributes.position.count / (this.tiles[0].mesh.geometry.parameters.heightSegments + 1 )

    let norms = []

    this.tiles.forEach(el => {
      norms.push(this.getComponents(el.mesh.geometry.attributes.normal.array.slice()))      
    });

    let data = this.getRelevantEdges(norms, width)

    let means = this.computeRelevantMeans(data, width)

    let newNorms = this.updateNormals(norms, means, width)
    
    let i = 0
    this.tiles.forEach(el => {
      el.mesh.geometry.setAttribute('normal', new THREE.BufferAttribute( new Float32Array(newNorms[i]), 3 ))
      el.mesh.geometry.attributes.normal.needsUpdate = true;
      i += 1
    });
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