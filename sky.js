import * as THREE from 'three'
import { Sky } from 'three/examples/jsm/objects/Sky.js';

export class World_Sky {
  constructor(scene, renderer, gui, guiParams) {
    this.init(scene, renderer, gui, guiParams)
  }

  init(scene, renderer, gui, guiParams) {
    this.sky = new Sky()
    this.sky.scale.setScalar(10000)
    scene.add(this.sky)

    this.sun = new THREE.Vector3()

    guiParams.sky = {
      turbidity: 0,
      rayleigh: 0.060,
      mieCoefficient: 0.094,
      mieDirectionalG: 0.16,
    }

    guiParams.sun = {
      elevation: 82,
      azimuth: -120,
      exposure: renderer.toneMappingExposure,
    }

    const onShaderChange = () => {
      const uniforms = this.sky.material.uniforms
      uniforms[ 'turbidity' ].value = guiParams.sky.turbidity;
      uniforms[ 'rayleigh' ].value = guiParams.sky.rayleigh;
      uniforms[ 'mieCoefficient' ].value = guiParams.sky.mieCoefficient;
      uniforms[ 'mieDirectionalG' ].value = guiParams.sky.mieDirectionalG;
    };

    const onSunChange = () => {
      const phi = THREE.MathUtils.degToRad( 90 - guiParams.sun.elevation );
      const theta = THREE.MathUtils.degToRad( guiParams.sun.azimuth );

      this.sun.setFromSphericalCoords( 1, phi, theta );

      this.sky.material.uniforms['sunPosition'].value.copy(this.sun);
      renderer.toneMappingExposure = guiParams.sun.exposure
    };

    // const skyRollup = gui.addFolder('Sky');
    // skyRollup.add(guiParams.sky, "turbidity", 0.0, 20.0, 0.1).onChange(
    //     onShaderChange);
    // skyRollup.add(guiParams.sky, "rayleigh", 0.0, 4, 0.001).onChange(
    //     onShaderChange);
    // skyRollup.add(guiParams.sky, "mieCoefficient",0.0, 0.1, 0.001).onChange(
    //     onShaderChange);
    // skyRollup.add(guiParams.sky, "mieDirectionalG", 0.0, 1, 0.001).onChange(
    //     onShaderChange);
    
    // const sunRollup = gui.addFolder('Sun');
    // sunRollup.add(guiParams.sun, "elevation", 0, 90, 0.1).onChange(
    //   onSunChange);
    // sunRollup.add(guiParams.sun, "azimuth", - 180, 180, 0.1).onChange(
    //   onSunChange);
    // sunRollup.add(guiParams.sun, "exposure", 0, 1, 0.0001).onChange(
    //   onSunChange);

    onShaderChange();
    onSunChange();
  }
}