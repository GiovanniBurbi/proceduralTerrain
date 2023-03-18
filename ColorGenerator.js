import { math } from './math'

export class ColorGenerator{
  constructor(params) {
    this.params = params
    this.startHeights = [0.1, 0.15, 0.2, 0.5]
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
          color.push(0,0,0)
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