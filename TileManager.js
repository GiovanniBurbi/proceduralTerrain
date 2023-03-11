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

    // this.createTiles(1)
    this.createTiles(9)

    this.fixEdges()
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
    }

    const onParamsChange = () =>  {
      for (let tile of this.tiles){
        tile.rebuild(this.params.terrain.minHeight, this.params.terrain.maxHeight)
      }
    }

    this.createNoiseRollup(onParamsChange)
  }

  createNoiseRollup(funcChange) {
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
    this.group.add(this.tiles[i].mesh)
    }
  }

  fixEdges() {
    // let means_up = []
    // let means_down = []
    // let means_left = []
    // let means_right = []
    // let values = []

    // for (let tile of this.tiles) {
    //   let vertices = tile.mesh.geometry.attributes.color.array.slice()
    //   let valuesX_0 = []
    //   let valuesX_W = []
    //   let valuesY_0 = []
    //   let valuesY_W = []
    //   for (let y = 0; y < tile.width; y++){
    //     for(let x = 0; x < tile.width; x++){
    //       if (x === 0) {
    //         valuesX_0.push(vertices[(y * tile.width + x) * 3 + 2])
    //       }
    //       if (y === 0) {
    //         valuesY_0.push(vertices[(y * tile.width + x) * 3 + 2])
    //       }
    //       if (x === tile.width - 1) {
    //         valuesX_W.push(vertices[(y * tile.width + x) * 3 + 2])
    //       }
    //       if (y === tile.width - 1) {
    //         valuesY_W.push(vertices[(y * tile.width + x) * 3 + 2])
    //       }
    //     }
    //   }
    //   values.push([valuesX_0, valuesX_W, valuesY_0, valuesY_W])
    // }


    // for (let i = 0; i < this.tiles[0].width; i++){
    //     means_up[i] = (values[4][2][i] + values[1][3][i]) / 2
    //     means_down[i] = (values[4][3][i] + values[7][2][i]) / 2
    //     means_left[i] = (values[4][0][i] + values[3][1][i]) / 2
    //     means_right[i] = (values[4][1][i] + values[5][0][i]) / 2
    // }

    // let newColors = this.tiles[4].mesh.geometry.attributes.color.array.slice()
    // let newColors3 = this.tiles[3].mesh.geometry.attributes.color.array.slice()

    // let l=0,k=0,g=0,w=0

    // for (let y = 0; y < this.tiles[4].width; y++){
    //   for(let x = 0; x < this.tiles[4].width; x++){
    //     if (x === 0) {
    //       newColors[(y * this.tiles[4].width + x) * 3] = means_left[l]
    //       newColors[(y * this.tiles[4].width + x) * 3 + 1] = means_left[l]
    //       newColors[(y * this.tiles[4].width + x) * 3 + 2] = means_left[l]
    //       newColors3[(y * this.tiles[4].width + x) * 3] = means_left[l]
    //       newColors3[(y * this.tiles[4].width + x) * 3 + 1] = means_left[l]
    //       newColors3[(y * this.tiles[4].width + x) * 3 + 2] = means_left[l]
    //       l+=1
    //     }
    //     if (y === 0) {
    //       newColors[(y * this.tiles[4].width + x) * 3] = means_up[k]
    //       newColors[(y * this.tiles[4].width + x) * 3 + 1] = means_up[k]
    //       newColors[(y * this.tiles[4].width + x) * 3 + 2] = means_up[k]
    //       k+=1
    //     }
    //     if (x === this.tiles[4].width - 1) {
    //       newColors[(y * this.tiles[4].width + x) * 3] = means_right[g]
    //       newColors[(y * this.tiles[4].width + x) * 3 + 1] = means_right[g]
    //       newColors[(y * this.tiles[4].width + x) * 3 + 2] = means_right[g]
    //       g+=1
    //     }
    //     if (y === this.tiles[4].width - 1) {
    //       newColors[(y * this.tiles[4].width + x) * 3] = means_down[w]
    //       newColors[(y * this.tiles[4].width + x) * 3 + 1] = means_down[w]
    //       newColors[(y * this.tiles[4].width + x) * 3 + 2] = means_down[w]
    //       w+=1
    //     }
    //   }
    // }  

    // for (let y = 0; y < this.tiles[4].width; y++){
    //   for(let x = 0; x < this.tiles[4].width; x++){
    //     if (newColors[(y*this.tiles[4].width +x)*3] === newColors3[(y*this.tiles[4].width +x)*3]) {
    //       console.log('x: ' + x + ' - y: ' + y)
    //     }  
    //   }
    // }

    // console.log(newColors)
    // console.log(newColors3)
      
    // // this.tiles[4].mesh.geometry.setAttribute('position', new THREE.BufferAttribute( new Float32Array(newVertices), 3 ))
    // this.tiles[4].mesh.geometry.setAttribute('color', new THREE.Float32BufferAttribute(newColors, 3))
    // this.tiles[3].mesh.geometry.setAttribute('color', new THREE.Float32BufferAttribute(newColors3, 3))
    
    // this.tiles[4].mesh.geometry.elementsNeedUpdate = true;
    // this.tiles[4].mesh.geometry.verticesNeedUpdate = true;
    // this.tiles[4].mesh.geometry.computeVertexNormals();

    // this.tiles[3].mesh.geometry.elementsNeedUpdate = true;
    // this.tiles[3].mesh.geometry.verticesNeedUpdate = true;
    // this.tiles[3].mesh.geometry.computeVertexNormals();
  }
}