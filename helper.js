import * as THREE from 'three'
import { math } from './math';

export class HeightGenerator {
  constructor(generator, position, minRadius, maxRadius) {
    this._position = position.clone();
    this._radius = [minRadius, maxRadius];
    this._generator = generator;
  }

  Get(x, y) {
    const distance = this._position.distanceTo(new THREE.Vector2(x, y));
    let normalization = 1.0 - math.sat(
        (distance - this._radius[0]) / (this._radius[1] - this._radius[0]));
    normalization = normalization * normalization * (3 - 2 * normalization);

    return [this._generator.Get(x, y), normalization];
  }
}