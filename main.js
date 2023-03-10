import * as THREE from 'three';
import './style.css'
import Stats from 'three/examples/jsm/libs/stats.module'
// import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls'
import { FirstPersonControlsEnchanted } from './FirstPersonControlsEnchanted'
import { Chunk } from './Chunk';
import { GUI } from 'dat.gui'



let scene, camera, renderer, controls
let stats, gui, guiParams
let chunks = []
let colors = ['#FF69B4', '#0000FF', '#808080',
              '#008000', '#800080', '#FF0000',
              '#F0F8FF', '#B22222', '#FFFACD'
            ]

let chunkDim = 100
let terrainCenter = [0, 0, 0]
let centerId = 4
const clock = new THREE.Clock()

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

  generatePlainTerrain(scene)

  scene.add(new THREE.AmbientLight( 0x404040 ))

  camera.position.set( 0, 10, 0 )
  // camera.rotateX(100)

  // camera.position.set( 0, 20, 20 )

  renderer = new THREE.WebGLRenderer()
  renderer.setPixelRatio( window.devicePixelRatio )
  renderer.setSize( window.innerWidth, window.innerHeight )
  container.appendChild( renderer.domElement )

  // controls = new FirstPersonControls( camera, renderer.domElement )
  controls = new FirstPersonControlsEnchanted( camera, renderer.domElement )
  controls.enabled = false
  controls.movementSpeed = 50
  controls.lookSpeed = 0.05
  controls.lookVertical = false

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

function generatePlainTerrain(scene) {
  let chunkPos = new THREE.Vector3(-chunkDim, 0, -chunkDim)
  for (let i = 0; i < 9; i++) {
    chunks.push(new Chunk(chunkDim, colors[i] , i, scene, chunkPos))
    chunkPos.setX(chunkPos.x + chunkDim)
    if (i === 2 || i === 5) {
      chunkPos.setX(-chunkDim)
      chunkPos.setZ(chunkPos.z + chunkDim)
    }
  }
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
    el.changePosition(terrainCenter)
  });

  renderer.render( scene, camera )
}



