import * as THREE from 'three'
import { Tile } from "./Tile"
import { Noise } from "./noise"

export class TileManager {
  constructor(tileDim, group, gui, params) {
    this.tiles = []
    this.tileDim = tileDim
    this.group = group

    this.noise = new Noise(params)

    this.initGUI(gui, params)

    this.createTiles(1)
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
      maxHeight: 10,
      minHeight: -10,
    }

    const onParamsChange = () =>  {
      this.tiles[0].rebuild(this.params.terrain.minHeight, this.params.terrain.maxHeight)
    }

    this.createNoiseRollup(onParamsChange)
  }

  createNoiseRollup(funcChange) {
    const rollup = this.gui.addFolder('Noise')
    rollup.add(this.params.noise, 'octaves', 1, 10, 1) .onChange(funcChange)
    rollup.add(this.params.noise, 'persistance', 0.1, 1.0, 0.1).onChange(funcChange)
    rollup.add(this.params.noise, 'lacunarity', 1, 10, 0.1).onChange(funcChange)
    rollup.add(this.params.noise, 'scale', 0.3, 30).onChange(funcChange)
    rollup.add(this.params.noise, 'offsetX', 0.0, 20, 0.1).onChange(funcChange)
    rollup.add(this.params.noise, 'offsetY', 0.0, 20, 0.1).onChange(funcChange)

    const terrainRollup = this.gui.addFolder('Terrain')
    terrainRollup.add(this.params.terrain, 'maxHeight', 2, 30, 1).onChange(funcChange)
    terrainRollup.add(this.params.terrain, 'minHeight', -30, -2).onChange(funcChange)
  }

  createTiles(num_chunks) {
    let tilePos = [0,0,0]
    // tilePos = [-this.tileDim, 0, -this.tileDim]
    
    for(let i = 0; i < num_chunks; i++){
      this.tiles.push(new Tile(tilePos, this.tileDim, this.noise, this.params))
      tilePos[0] = tilePos[0] + this.tileDim
      if (i === 2 || i === 5) {
        tilePos[0] = -this.tileDim
        tilePos[2] = tilePos[2] + this.tileDim
    }
    this.group.add(this.tiles[i].mesh)
    }
  }
}