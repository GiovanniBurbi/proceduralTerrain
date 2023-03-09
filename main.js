import * as THREE from 'three';
import './style.css'
import Stats from 'three/examples/jsm/libs/stats.module'
// import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls'
import { FirstPersonControlsEnchanted } from './FirstPersonControlsEnchanted'
import { Chunk } from './Chunk';
import { GUI } from 'dat.gui'
import { Tile } from './Tile';


let scene, camera, renderer, controls
let stats, gui, guiParams
let chunks = []
let colors = ['#FF69B4', '#0000FF', '#808080',
              '#008000', '#800080', '#FF0000',
              '#F0F8FF', '#B22222', '#FFFACD'
            ]
// let colors = ['#FF69B4', '#FF69B4', '#FF69B4', '#FF69B4', '#FF69B4', '#FF69B4', 
//               '#FF69B4', '#FF69B4', '#FF69B4']

let chunkDim = 200
let terrainCenter = [0, 0, 0]
let centerId = 4
const clock = new THREE.Clock()

let group = new THREE.Group()

let fov = 60
let aspect = window.innerWidth / window.innerHeight
let near = 1
let far = 10000

init()
animate()


function init() {
  const container = document.getElementById( 'container' )

  camera = new THREE.PerspectiveCamera(fov, aspect, near, far)

  scene = new THREE.Scene()
  // scene.background = new THREE.Color(0xffffff);
  scene.add(group)

  scene.add(new THREE.AmbientLight( 0x404040 ))

  camera.position.set( 0, chunkDim, 0 )
  camera.rotateX(150)

  // camera.position.set( 0, 20, 20 )

  renderer = new THREE.WebGLRenderer()
  renderer.setPixelRatio( window.devicePixelRatio )
  renderer.setSize( window.innerWidth, window.innerHeight )
  container.appendChild( renderer.domElement )

  generatePlainTerrain()

  // controls = new FirstPersonControls( camera, renderer.domElement )
  controls = new FirstPersonControlsEnchanted( camera, renderer.domElement )
  controls.enabled = false
  controls.movementSpeed = 100
  controls.lookSpeed = 0.1
  // controls.lookVertical = false

  // controls.constrainVertical = true
  // controls.verticalMin = Math.PI / 1.7
  // controls.verticalMax = Math.PI / 2.3

  stats = new Stats()
  container.appendChild( stats.dom )
  
  window.addEventListener('resize', onWindowResize )
  
  window.addEventListener('mousedown', onClick )

  window.addEventListener('positionChanged', onPositionChange)

  window.addEventListener('changeCenterTile', updateTerrain)
}

function onPositionChange() {
  // console.log(camera.position)
  // updateTerrain(camera.position)
  notifyChunks(camera.position.clone().floor())
}

function onClick(e) {
  e.preventDefault();
  if (e.which == 2) {
    controls.enabled = !controls.enabled
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize( window.innerWidth, window.innerHeight )
  controls.handleResize()
}

function animate() {
  requestAnimationFrame( animate )
  render()
  stats.update()
}


function render() {
  // console.log(camera.position)
  controls.update( clock.getDelta() )
  renderer.render( scene, camera )
}

function generatePlainTerrain() {
  // let chunkPos = new THREE.Vector3(-chunkDim, 0, -chunkDim)
  // for (let i = 0; i < 9; i++) {
  //   chunks.push(new Chunk(chunkDim, colors[i] , i, chunkPos))
  //   chunkPos.setX(chunkPos.x + chunkDim)
  //   if (i === 2 || i === 5) {
  //     chunkPos.setX(-chunkDim)
  //     chunkPos.setZ(chunkPos.z + chunkDim)
  //   }

  //   group.add(chunks[i].mesh)
  // }
  let center = new Array(3)
  center[0] = 0
  center[1] = 0
  center[2] = -200
  const tile = new Tile(center, chunkDim)
  group.add(tile.mesh)
  group.add(tile.mesh2)
}

function notifyChunks(newPos) {
  chunks.forEach(el => {
    el.checkNewEntries(newPos, centerId)
  });
}

function updateTerrain(e) {
  centerId = e.detail
  terrainCenter = chunks[centerId].center.slice()
  chunks.forEach(el => {
    el.changePosition(terrainCenter, camera.position.toArray())
  });

  renderer.render( scene, camera )
}



