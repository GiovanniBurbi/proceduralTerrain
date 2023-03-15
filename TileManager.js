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
        this.updateNormals()
      }
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
  }

  checkNewEntries(newPos, centerId) {
    this.tiles.forEach(el => {
      el.isCenter(newPos, centerId)
    });
  }

  updateTiles(newCenterId, camPos) {
    this.centerId = newCenterId
    this.centerTerrain = this.tiles[this.centerId].mesh.position.toArray().slice()
    this.tiles.forEach(el => {
      el.changePosition(this.centerTerrain, camPos)
      if (this.params.terrain.showNormals) {
        this.updateNormals()
      }
    });
  }
}