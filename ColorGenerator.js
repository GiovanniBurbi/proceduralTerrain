import { math } from './math'
import { spline } from './spline';
import * as THREE from 'three'

// const _WHITE = new THREE.Color(0x808080);
// const _OCEAN = new THREE.Color(0xd9d592);
// const _BEACH = new THREE.Color(0xd9d592);
// const _SNOW = new THREE.Color(0xFFFFFF);
// const _FOREST_TROPICAL = new THREE.Color(0x4f9f0f);
// const _FOREST_TEMPERATE = new THREE.Color(0x2b960e);
// const _FOREST_BOREAL = new THREE.Color(0x29c100);
// const _SEA = new THREE.Color(0x006994)
// 
// export class ColorGenerator2{
//   constructor(params){
//     const colourLerp = (t, p0, p1) => {
//       const c = p0.clone();

//       return c.lerpHSL(p1, t);
//     };

//     this.colourSpline = [
//       new spline.LinearSpline(colourLerp),
//       new spline.LinearSpline(colourLerp)
//     ];
//     // Arid
//     this.colourSpline[0].AddPoint(0.0, new THREE.Color(0xb7a67d));
//     this.colourSpline[0].AddPoint(0.5, new THREE.Color(0xf1e1bc));
//     this.colourSpline[0].AddPoint(1.0, _SNOW);

//     // Humid
//     this.colourSpline[1].AddPoint(0.0, _FOREST_BOREAL);
//     this.colourSpline[1].AddPoint(0.5, new THREE.Color(0xcee59c));
//     this.colourSpline[1].AddPoint(1.0, _SNOW);
//   }

//   _ChooseColour(x, y, z) {
//     const m = z / 50;
//     const h = z / 100.0;

//     if (h < 0.05) {
//       // return _SEA;
//       return _OCEAN;
//     }

//     const c1 = this.colourSpline[0].Get(h);
//     const c2 = this.colourSpline[1].Get(h);

//     return c1.lerpHSL(c2, m);
//   }

//   colorMap(vertices, width){
//     const colours = []
//     let colorMap = []

//     for(let i = 0; i < vertices.length / 3; i++){
//       colours.push(this._ChooseColour(vertices[i*3], vertices[i*3+1], vertices[i*3+2]))
//     }

//     for (let y = 0; y < width; y++){
//       for (let x = 0; x < width; x++){
//         let color = colours[y*width + x]
//         colorMap.push(color.r, color.g, color.b)
//       }
//     }

//     return colorMap
//   }
// }
export class ColorGenerator{
  constructor(params) {
    this.params = params
    this.startHeights = [0.1, 0.15, 0.3, 0.5]
    this.colors = [[125/255,107/255,94/255], [0.76,0.40,0.16], [0.2,0.2,0.2], [1,1,1]]
    this.blends = [0.1,0.1,0.1,0.1]
  }

  inverseLerp(x, a, b) {
    // return (x - a)/(b - a)
    return math.sat((x - a)/(b - a))
  }

  colorMap(map, width){
    let colorMap = []
    let minHeight = 0
    let maxHeight = 500

    for (let y = 0; y < width; y++){
      for (let x = 0; x < width; x++){
        let valuePercent = this.inverseLerp(map[y*width + x], minHeight, maxHeight)
        
        let color = []
        for (let i = 0; i < this.colors.length; i++){
          color.push(1,1,1)
        }
        for (let i = 0; i < this.colors.length; i++) {
          // let colorLevel = math.sat(Math.sign(valuePercent - this.startHeights[i]))

          let colorLevel = this.inverseLerp(-this.blends[i]/2 - 0.00001, this.blends[i]/2 + 0.00001, (valuePercent - this.startHeights[i]))
          color[0] = color[0] * (1 - colorLevel) + this.colors[i][0] * colorLevel
          color[1] = color[1] * (1 - colorLevel) + this.colors[i][1] * colorLevel
          color[2] = color[2] * (1 - colorLevel) + this.colors[i][2] * colorLevel
        }

        // colorMap.push(0.2,0.2,0.2)
        colorMap.push(color[0], color[1], color[2])

        // colorMap.push(0.2, 0.2, 0.2)
      }
    }
    
    // console.log(colorMap)

    return colorMap
  }
}