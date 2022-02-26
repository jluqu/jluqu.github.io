var canvas = document.getElementById('thecanvas')
var ctx = canvas.getContext('2d')
var BORDER = 10
var clock = 0

var CANVAS_WIDTH = 1200
var CANVAS_HEIGHT = 850

var SECTOR_WIDTH = 32
var SECTOR_HEIGHT = 32
var SECTOR_ROWS = 6
var SECTOR_COLS = 9

var WORLD_CELL_SIZE = 55
var WORLD_VIEW_ROWS = 14
var WORLD_VIEW_COLS = 20
var WORLD_VIEW_WIDTH = 2*BORDER + WORLD_CELL_SIZE*WORLD_VIEW_COLS
var WORLD_VIEW_HEIGHT = 2*BORDER + WORLD_CELL_SIZE*WORLD_VIEW_ROWS

var MAP_CELL_SIZE = 4
var MAP_COLS = SECTOR_WIDTH*SECTOR_COLS + 1
var MAP_ROWS = SECTOR_HEIGHT*SECTOR_ROWS + 1

var MAP_WIDTH = 2*BORDER + MAP_COLS*MAP_CELL_SIZE
var MAP_HEIGHT = 2*BORDER + MAP_ROWS*MAP_CELL_SIZE


//var CANVAS_WIDTH = Math.max(WORLD_VIEW_WIDTH, MAP_WIDTH)
//var CANVAS_HEIGHT = Math.max(WORLD_VIEW_HEIGHT, MAP_HEIGHT)

var elevation = []
//var layer1 = []
var water_level = 8
var mountain_level = 18
var path_levelness_threshold = 2
var num_streams = 5
var show_map = true
var curC = 0
var curR = 0

function get_discrete_elevation(elev) {
    //levels = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230]
    return Math.max(0, Math.floor(elev/10))
    //for (i = 0; i < levels.length; i++) {
    //    if (

    //if (elev <= 80) {
    //    return 0
    //} else if (elev > 230)
    //    return 6
    //}
    //    else if (elev< 110) {
    //    return 1
    //} else if (elev< 150) {
    //    return 2
    //} else if (elev< 200) {
    //    return 3
    //} else if (elev< 215) {
    //    return 4
    //} else if (elev< 230) {
    //    return 5
    //} else {
    //    return 6
    //}
}

function init() {
    var r, c
    console.log("Initializing")

    for (r = 0; r < MAP_ROWS; r++) {
        elevation.push(new Array(MAP_COLS))
        //layer1.push(new Array(MAP_COLS))
        for (c = 0; c < MAP_COLS; c++) {
            elevation[r][c] = 1
            //layer1[r][c] = 0
        }
    }

    // Initial grid
    for (r = 0; r < MAP_ROWS; r += 32) {
        for (c = 0; c < MAP_COLS; c += 32) {
            elevation[r][c] = Math.random()*240
            // Make it an island
            if (c === 0 || r === 0 || c === MAP_COLS-1 || r === MAP_ROWS-1) {
                elevation[r][c] = -50
            }
        }
    }


    spacing = 32
    while (spacing > 1) {
        half_spacing = spacing/2
        d_displacement = spacing*5
        s_displacement = d_displacement/Math.sqrt(2)
        // Diamond step
        for (r = 0; r < MAP_ROWS-1; r += spacing) {
            for (c = 0; c < MAP_COLS-1; c += spacing) {
                avg = (elevation[r][c] + elevation[r+spacing][c] + elevation[r][c+spacing] + elevation[r+spacing][c+spacing])/4
                elevation[r+half_spacing][c+half_spacing] = avg + Math.random()*d_displacement - d_displacement/2
            }
        }

        // Square step
        for (r = 0; r < MAP_ROWS; r += half_spacing) {
            for (c = 0; c < MAP_COLS; c += half_spacing) {
                if ((c % spacing == 0 && r % spacing == 0) || (c % spacing == half_spacing && r % spacing == half_spacing)) {
                    continue
                }
                total = 0
                n = 0
                if (r - half_spacing >= 0) { total += elevation[r-half_spacing][c]; n++ }
                if (r + half_spacing < MAP_ROWS) { total += elevation[r+half_spacing][c]; n++ }
                if (c - half_spacing >= 0) { total += elevation[r][c-half_spacing]; n++ }
                if (c + half_spacing < MAP_COLS) { total += elevation[r][c+half_spacing]; n++ }
                avg = Math.floor(total/n)
                elevation[r][c] = avg + Math.random()*s_displacement - s_displacement/2
            }
        }
        spacing /= 2
    }
    console.log("Discretizing")
    
    // Discretize the elevation
    for (r = 0; r < MAP_ROWS; r++) {
        for (c = 0; c < MAP_COLS; c++) {
            elevation[r][c] = get_discrete_elevation(elevation[r][c])
        }
    }

    console.log("Smoothing")
    // Smooth layer boundaries
    smooth_thresholds = [5, 6, 8]
    for (i = 0; i < smooth_thresholds.length; i++) {
        for (r = 0; r < MAP_ROWS; r++) {
            for (c = 0; c < MAP_COLS; c++) {
                neighbors_above = 0
                neighbors_below = 0
                if (r > 0) {
                    if (elevation[r-1][c] > elevation[r][c]) neighbors_above++
                    if (elevation[r-1][c] < elevation[r][c]) neighbors_below++
                }
                if (c > 0) {
                    if (elevation[r][c-1] > elevation[r][c]) neighbors_above++
                    if (elevation[r][c-1] < elevation[r][c]) neighbors_below++
                }
                if (r < MAP_ROWS-1) {
                    if (elevation[r+1][c] > elevation[r][c]) neighbors_above++
                    if (elevation[r+1][c] < elevation[r][c]) neighbors_below++
                }
                if (c < MAP_COLS-1) {
                    if (elevation[r][c+1] > elevation[r][c]) neighbors_above++
                    if (elevation[r][c+1] < elevation[r][c]) neighbors_below++
                }

                if (r > 0 && c > 0) {
                    if (elevation[r-1][c-1] > elevation[r][c]) neighbors_above++
                    if (elevation[r-1][c-1] < elevation[r][c]) neighbors_below++
                }
                if (r < MAP_ROWS-1 && c > 0) {
                    if (elevation[r+1][c-1] > elevation[r][c]) neighbors_above++
                    if (elevation[r+1][c-1] < elevation[r][c]) neighbors_below++
                }
                if (r > 0 && c < MAP_COLS-1) {
                    if (elevation[r-1][c+1] > elevation[r][c]) neighbors_above++
                    if (elevation[r-1][c+1] < elevation[r][c]) neighbors_below++
                }
                if (r < MAP_ROWS-1 && c < MAP_COLS-1) {
                    if (elevation[r+1][c+1] > elevation[r][c]) neighbors_above++
                    if (elevation[r+1][c+1] < elevation[r][c]) neighbors_below++
                }

                if (neighbors_above >= smooth_thresholds[i]) {
                    elevation[r][c]++
                } else if (neighbors_below >= smooth_thresholds[i]) {
                    elevation[r][c]--
                }
            }
        }
    }

    //// create streams
    //for (n = 0; n < num_streams; n++) {
    //    start_elev = 0
    //    while (start_elev < 150) {
    //        sr = Math.floor(Math.random() * MAP_ROWS)
    //        sc = Math.floor(Math.random() * MAP_COLS)
    //        start_elev = elevation[sr][sc]
    //    }
    //    layer1[sr][sc] = 1
    //    next_dr = -1
    //    next_dc = 0
    //    for (flow = 0; flow < 100; flow++) {
    //        lowest_neighbor_e = elevation[sr][sc]
    //        if (sr > 0 && elevation[sr-1][sc] < lowest_neighbor_e && layer1[sr-1][sc] == 0) {
    //            next_dr = -1
    //            next_dc = 0
    //            lowest_neighbor_e = elevation[sr-1][sc]
    //        }
    //        if (sc > 0 && elevation[sr][sc-1] < lowest_neighbor_e && layer1[sr][sc-1] == 0) {
    //            next_dr = 0
    //            next_dc = -1
    //            lowest_neighbor_e = elevation[sr][sc-1]
    //        }
    //        if (sr < MAP_ROWS-1 && elevation[sr+1][sc] < lowest_neighbor_e && layer1[sr+1][sc] == 0) {
    //            next_dr = 1
    //            next_dc = 0
    //            lowest_neighbor_e = elevation[sr+1][sc]
    //        }
    //        if (sc < MAP_COLS-1 && elevation[sr][sc+1] < lowest_neighbor_e && layer1[sr][sc+1] == 0) {
    //            next_dr = 0
    //            next_dc = 1
    //            lowest_neighbor_e = elevation[sr][sc+1]
    //        }
    //        if (sr > 0 && sc > 0 && elevation[sr-1][sc-1] < lowest_neighbor_e && layer1[sr-1][sc-1] == 0) {
    //            next_dr = -1
    //            next_dc = -1
    //            lowest_neighbor_e = elevation[sr-1][sc-1]
    //        }
    //        if (sr > 0 && sc < MAP_COLS-1 && elevation[sr-1][sc+1] < lowest_neighbor_e && layer1[sr-1][sc+1] == 0) {
    //            next_dr = -1
    //            next_dc = 1
    //            lowest_neighbor_e = elevation[sr-1][sc+1]
    //        }
    //        if (sr < MAP_ROWS-1 && sc > 0 && elevation[sr+1][sc-1] < lowest_neighbor_e && layer1[sr+1][sc-1] == 0) {
    //            next_dr = 1
    //            next_dc = -1
    //            lowest_neighbor_e = elevation[sr+1][sc-1]
    //        }
    //        if (sr < MAP_ROWS-1 && sc < MAP_COLS-1 && elevation[sr+1][sc+1] < lowest_neighbor_e && layer1[sr+1][sc+1] == 0) {
    //            next_dr = 1
    //            next_dc = 1
    //            lowest_neighbor_e = elevation[sr+1][sc+1]
    //        }
    //        sr += next_dr
    //        sc += next_dc
    //        if (sr < 0 || sr >= MAP_ROWS || sc < 0 || sc >= MAP_COLS) {
    //            break
    //        }
    //        //console.log("Stream " + n.toString() + " moving to " + sr.toString() + ", " + sc.toString())
    //        layer1[sr][sc] = 1
    //        if (elevation[sr][sc] <= water_level) {
    //            break
    //        }
    //    }
    //}
    
    while (elevation[curR][curC] < water_level) {
        curC = Math.floor(Math.random() * (MAP_COLS-40)) + 20
        curR = Math.floor(Math.random() * (MAP_ROWS-40)) + 20
    }
}

function get_color(elev) {

    if (elev < water_level) {
        return "#0000A0"
    } else if (elev < mountain_level) {
        return "#00" + Math.floor(elev*.8).toString(16) + "000"
    } else {
        val = Math.min(255, Math.floor(elev*15)-100).toString(16)
        return "#" + val + val + val
    }

    //else if (elev === 2) {
    //    return "#009000"
    //} else if (elev === 3) {
    //    return "#00B000"
    //} else if (elev === 4) {
    //    return "#707070"
    //} else if (elev === 5) {
    //    return "#A0A0A0"
    //} else {
    //    return "#D0D0D0"
    //}
}

function update() {
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    map_left = Math.floor(CANVAS_WIDTH/2 - MAP_WIDTH/2)
    map_top = Math.floor(CANVAS_HEIGHT/2 - MAP_HEIGHT/2)
    world_left = Math.floor(CANVAS_WIDTH/2 - WORLD_VIEW_WIDTH/2)
    world_top = Math.floor(CANVAS_HEIGHT/2 - WORLD_VIEW_HEIGHT/2)

    var r, c
    if (show_map) {
        // Map mode
        for (r = 0; r < MAP_ROWS; r++) {
            for (c = 0; c < MAP_COLS; c++) {
                ctx.fillStyle = get_color(elevation[r][c])
                ctx.fillRect(map_left + c*MAP_CELL_SIZE, map_top + r*MAP_CELL_SIZE - Math.max(7, elevation[r][c])*MAP_CELL_SIZE/2, MAP_CELL_SIZE, MAP_CELL_SIZE)
            }
        }
        // Draw the current view as a yellow rectangle
        ctx.strokeStyle = "#FFFF80"
        ctx.strokeRect(map_left + curC*MAP_CELL_SIZE - WORLD_VIEW_COLS/2*MAP_CELL_SIZE,
                       map_top + curR*MAP_CELL_SIZE - WORLD_VIEW_ROWS/2*MAP_CELL_SIZE - Math.max(7, elevation[curR][curC])*MAP_CELL_SIZE/2,
                       WORLD_VIEW_COLS*MAP_CELL_SIZE,
                       WORLD_VIEW_ROWS*MAP_CELL_SIZE)
        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect(map_left + curC*MAP_CELL_SIZE, map_top + curR*MAP_CELL_SIZE - Math.max(7, elevation[curR][curC])*MAP_CELL_SIZE/2, MAP_CELL_SIZE, MAP_CELL_SIZE)

    } else {
        // Draw the world
        e2 = Math.ceil((Math.max(7, elevation[curR][curC])-10)*WORLD_CELL_SIZE/2)
        // Draw a few rows above and below, since elevation changes can result in gaps
        for (r = -14; r < WORLD_VIEW_ROWS+14; r++) {
            for (c = 0; c < WORLD_VIEW_COLS; c++) {
                cell_r = curR-WORLD_VIEW_ROWS/2+r
                cell_c = curC-WORLD_VIEW_COLS/2+c
                if (cell_r >= 0 && cell_r < MAP_ROWS) {
                    el = Math.ceil((Math.max(7, elevation[cell_r][cell_c])-10)*WORLD_CELL_SIZE/2)
                    cell_top = world_top + r*WORLD_CELL_SIZE - el + e2
                    cell_left = world_left + c*WORLD_CELL_SIZE
                    ctx.fillStyle = get_color(elevation[cell_r][cell_c])
                    ctx.fillRect(cell_left, cell_top, WORLD_CELL_SIZE, WORLD_CELL_SIZE)
                    ctx.strokeStyle = "#000000"
                    if (cell_r > 0 && elevation[cell_r-1][cell_c] < elevation[cell_r][cell_c] && elevation[cell_r][cell_c] >= water_level) {
                        ctx.strokeRect(cell_left, cell_top, WORLD_CELL_SIZE, 1)
                    }
                    if (cell_c > 0 && elevation[cell_r][cell_c-1] < elevation[cell_r][cell_c] && elevation[cell_r][cell_c] >= water_level) {
                        ctx.strokeRect(cell_left, cell_top, 1, WORLD_CELL_SIZE)
                    }
                    if (cell_c < MAP_COLS-1 && elevation[cell_r][cell_c+1] < elevation[cell_r][cell_c] && elevation[cell_r][cell_c] >= water_level) {
                        ctx.strokeRect(cell_left+WORLD_CELL_SIZE-1.5, cell_top, 1, WORLD_CELL_SIZE)
                    }
                    if (cell_r == curR && cell_c == curC) {
                        cell_center_x = cell_left + WORLD_CELL_SIZE/2
                        cell_center_y = cell_top + WORLD_CELL_SIZE/2
                        // Draw the guy
                        ctx.fillStyle = "#A0A0FF"
                        ctx.fillRect(cell_center_x-6, cell_center_y-10, 12, 16)
                        ctx.fillStyle = "#808080"
                        ctx.fillRect(cell_center_x-4, cell_center_y+6, 8, 10)
                        ctx.fillStyle = "#FFF0D0"
                        ctx.beginPath()
                        ctx.arc(cell_center_x, cell_center_y-13, 3, 0, 2*Math.PI)
                        ctx.fill()

                    }
                }
            }
        }
    }


    ctx.fillStyle = "#FFFFFF"
    ctx.font = "12px Arial"
    //ctx.fillText("map_left: " + map_left.toString(), 10, 400)
    //ctx.fillText("map_top: " + map_top.toString(), 10, 450)

    //ctx.fillText("WORLD_VIEW_WIDTH: " + WORLD_VIEW_WIDTH.toString(), 10, 500)
    //ctx.fillText("WORLD_VIEW_HEIGHT: " + WORLD_VIEW_HEIGHT.toString(), 10, 515)
    //ctx.fillText("MAP_WIDTH: " + MAP_WIDTH.toString(), 10, 530)
    //ctx.fillText("MAP_HEIGHT: " + MAP_HEIGHT.toString(), 10, 545)

    ctx.fillText("curR: " + curR.toString(), 10, 750)
    ctx.fillText("curC: " + curC.toString(), 10, 765)
    ctx.fillText("elev: " + elevation[curR][curC], 10, 780)
    //ctx.fillText("Path levelness threshold: " + path_levelness_threshold.toString(), 10, 705)

}

canvas.width = CANVAS_WIDTH
canvas.height = CANVAS_HEIGHT

init()

document.addEventListener('keydown', function(event) {
    if (event.keyCode == 37) {  // left
        if (curC > SECTOR_WIDTH/2 && elevation[curR][curC-1] >= water_level) {
            curC--
        }
    }
    if (event.keyCode == 39) {  // right
        if (curC < MAP_COLS-SECTOR_WIDTH/2-1 && elevation[curR][curC+1] >= water_level) {
            curC++
        }
    }
    if (event.keyCode == 38) {  // up
        if (curR > WORLD_VIEW_ROWS/2 && elevation[curR-1][curC] >= water_level) {
            curR--
        }
    }
    if (event.keyCode == 40) {  // down
        if (curR < MAP_ROWS-WORLD_VIEW_COLS/2-1 && elevation[curR+1][curC] >= water_level) {
            curR++
        }
    }
    if (event.keyCode == 77) {  // M to toggle map
        show_map = !show_map
    }
});

setInterval(update, 50)
