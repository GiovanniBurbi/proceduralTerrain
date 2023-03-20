import * as THREE from 'three';
import './style.css'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'dat.gui'
import { FirstPersonControlsEnchanted } from './FirstPersonControlsEnchanted'
import { TileManager } from './TileManager';
import { Fog } from './fog';
import {World_Sky} from './sky'


let scene, camera, renderer, controls
let sky
let stats
let gui
let guiParams = {
                  general: {
                  },
                }

let tileDim = 300
let centerId = 4
const clock = new THREE.Clock()

let fov = 60
let aspect = window.innerWidth / window.innerHeight
let near = 1
let far = 1000000

let tileManager

init()
animate()


function init() {
  const container = document.getElementById( 'container' )

  createGUI()

  camera = new THREE.PerspectiveCamera(fov, aspect, near, far)

  scene = new THREE.Scene()
  // scene.background = new THREE.Color(0x8080FF)

  // scene.fog = new THREE.FogExp2( 0xefd1b5, 0.0025 )

  const sunlight = new THREE.DirectionalLight( 0xfff3e3)
  sunlight.position.y = 100
  sunlight.castShadow = true

  sunlight.shadow.mapSize.width = 512;
  sunlight.shadow.mapSize.height = 512;
  sunlight.shadow.camera.near = 0.5;
  sunlight.shadow.camera.far = 500;

  scene.add(sunlight)

  camera.position.set( 0, 50, 0)
  // camera.rotateX(5)

  renderer = new THREE.WebGLRenderer({antialias: true,})
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.setPixelRatio( window.devicePixelRatio )
  renderer.setSize( window.innerWidth, window.innerHeight )
  container.appendChild( renderer.domElement )

  const fog = new Fog(scene, 0.00025)

  sky = new World_Sky(scene, renderer, gui, guiParams)

  generatePlainTerrain()

  controls = new FirstPersonControlsEnchanted( camera, renderer.domElement )
  controls.enabled = false
  controls.movementSpeed = 120
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
  tileManager.updateTiles(centerId)
  renderer.render( scene, camera )
}



