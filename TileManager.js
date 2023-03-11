import * as THREE from "three"
import { Tile } from "./Tile"
import { Noise } from "./noise"
import { VertexNormalsHelper } from 'three/addons/helpers/VertexNormalsHelper.js'

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

    this.noise = new Noise(params)

    this.initGUI(gui, params)

    // this.createTiles(1)
    this.createTiles(9)

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
      offsetY: 0,
    }

    this.params.terrain = {
      maxHeight: 20,
      minHeight: 0,
      showNormals: false,
      showWireframe: false
    }

    const onParamsChange = () =>  {
      for (let tile of this.tiles){
        tile.rebuild(this.params.terrain.minHeight, this.params.terrain.maxHeight)
        this.updateNormals()
        this.updateWireframe()
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
        let i = 0
        for (let tile of this.tiles) {
          var geo = new THREE.EdgesGeometry( tile.mesh.geometry )
          var mat = new THREE.LineBasicMaterial( { color: 0xffffff } )
          this.wireframes[i] = new THREE.LineSegments( geo, mat )
          tile.mesh.add(this.wireframes[i])
          i++
        }
      } else {
        let i = 0
        for (let tile of this.tiles) {
          tile.mesh.remove(this.wireframes[i])
          i++
        }
      }
    }

    this.createNoiseRollup(onParamsChange, onNormalViewChange, onWireframeViewChange)
  }

  updateWireframe() {
    if (this.params.terrain.showWireframe) {
      let i = 0
        for (let tile of this.tiles) {
          tile.mesh.remove(this.wireframes[i])
          var geo = new THREE.EdgesGeometry( tile.mesh.geometry )
          var mat = new THREE.LineBasicMaterial( { color: 0xffffff } )
          this.wireframes[i] = new THREE.LineSegments( geo, mat )
          tile.mesh.add(this.wireframes[i])
          i++
        }
    }
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
    rollup.add(this.params.noise, 'octaves', 1, 10, 1) .onChange(funcChange)
    rollup.add(this.params.noise, 'persistance', 0.1, 1.0, 0.1).onChange(funcChange)
    rollup.add(this.params.noise, 'lacunarity', 1, 10, 0.1).onChange(funcChange)
    rollup.add(this.params.noise, 'scale', 0.3, 30).onChange(funcChange)
    rollup.add(this.params.noise, 'offsetX', 0.0, 50, 0.1).onChange(funcChange)
    rollup.add(this.params.noise, 'offsetY', 0.0, 50, 0.1).onChange(funcChange)

    const terrainRollup = this.gui.addFolder('Terrain')
    terrainRollup.add(this.params.terrain, 'maxHeight', 0, 30, 1).onChange(funcChange)
    terrainRollup.add(this.params.terrain, 'minHeight', -30, 0).onChange(funcChange)
    terrainRollup.add(this.params.terrain, 'showNormals').onFinishChange(funcChange2)
    terrainRollup.add(this.params.terrain, 'showWireframe').onFinishChange(funcChange3)
  }

  createTiles(num_chunks) {
    let tilePos = [-this.tileDim, 0, -this.tileDim]

    if (num_chunks === 1) {
      tilePos = [0,0,0]
    }
    
    for(let i = 0; i < num_chunks; i++){
      this.tiles.push(new Tile(tilePos, this.tileDim, this.noise, this.params))
      tilePos[0] = tilePos[0] + this.tileDim
      if (i === 2 || i === 5) {
        tilePos[0] = -this.tileDim
        tilePos[2] = tilePos[2] + this.tileDim
    }
    this.tileGroup.add(this.tiles[i].mesh)
    }
  }
}