import * as THREE from 'three';
import './style.css'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'dat.gui'
import { FirstPersonControlsEnchanted } from './FirstPersonControlsEnchanted'
import { TileManager } from './TileManager';


let scene, camera, renderer, controls
let stats
let gui
let guiParams = {
                  general: {
                  },
                }

let tileDim = 100
let centerId = 4
const clock = new THREE.Clock()

let fov = 60
let aspect = window.innerWidth / window.innerHeight
let near = 1
let far = 10000

let tileManager

init()
animate()


function init() {
  const container = document.getElementById( 'container' )

  createGUI()

  camera = new THREE.PerspectiveCamera(fov, aspect, near, far)

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xaaaaaa)

  const sunlight = new THREE.DirectionalLight( 0xfff3e3)
  const nightlight = new THREE.DirectionalLight( 0xc2c1e3)
  sunlight.position.y = 100
  nightlight.position.y = 100
  sunlight.castShadow = false
  nightlight.castShadow = false
  scene.add(sunlight)
  // scene.add(nightlight)

  camera.position.set( 0, 50, 0)
  // camera.rotateX(5)

  // camera.position.set( 0, 20, 20 )

  renderer = new THREE.WebGLRenderer({antialias: true,})
  renderer.setPixelRatio( window.devicePixelRatio )
  renderer.setSize( window.innerWidth, window.innerHeight )
  container.appendChild( renderer.domElement )

  generatePlainTerrain()

  controls = new FirstPersonControlsEnchanted( camera, renderer.domElement )
  controls.enabled = false
  controls.movementSpeed = 60
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

  window.addEventListener('changeCenterTile', updateTiles)
}

function onPositionChange() {
  notifyManager(camera.position.clone().floor(), centerId)
}

function onClick(e) {
  // e.preventDefault();
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
  controls.update( clock.getDelta() )
  renderer.render( scene, camera )
}

function createGUI() {
  gui = new GUI()

  const generalRollup = gui.addFolder('General')
  gui.close()
}

function generatePlainTerrain() {
  tileManager = new TileManager(tileDim, scene, gui, guiParams)
  // tileManager.createTiles(1)
  tileManager.createTiles(9)
}

function notifyManager(newPos, centerId) {
  tileManager.checkNewEntries(newPos, centerId)
}

function updateTiles(e) {
  centerId = e.detail
  tileManager.updateTiles(centerId, camera.position.toArray())
  renderer.render( scene, camera )
}



