//"use strict";

var player = {r: MAP_ROWS/2, c: MAP_COLS/2, hp: 10, inventory: {weapons: ['dagger'], potions: [], armor: []}} 

var canvas = document.getElementById("thecanvas");
var ctx = canvas.getContext("2d");

var scratch_canvas = document.getElementById("scratch");
var scratch_ctx = canvas.getContext("2d");

var NUM_MAP_AREAS = 6;
var map;
var curMapArea = 3;

var monster_types = [
    {name: 'bat', symbol: 'b', color: '#808080', hp: 5},
    {name: 'sentient cabbage', symbol: 'c', color: '#80FF80', hp: 7},
    {name: 'troll', symbol: 't', color: '#5080A0', hp: 15},
]
var monsters = []


initGameData();

function movePlayer(dx, dy) {
    if (player.c + dx >= 0 && player.c + dx <= MAP_COLS) {
        if (player.r + dy >= 0 && player.r + dy <= MAP_ROWS) {
            if (map[curMapArea][player.r + dy][player.c + dx].fg === EMPTY_SPACE) {
                player.c += dx;
                player.r += dy;
                compute_dist_map(map[curMapArea], player.r, player.c)
            }
        }
    }
}

function redraw() {
    var r, c;
    ctx.fillStyle = "#000000"
    ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT)
    compute_shadows(map[curMapArea], player)

    for (r = 0; r < SCREEN_ROWS; r++) {
        for (c = 0; c < SCREEN_COLS; c++) {
            var map_r = player.r + r - HALF_SCREEN_ROWS
            var map_c = player.c + c - HALF_SCREEN_COLS
            if (in_bounds(map_r, map_c)) {
                cur_cell = map[curMapArea][map_r][map_c]
                switch (cur_cell.bg) {
                    case GRASS1:
                        putBgColor(c, r, "#008000"); break;
                    case GRASS2:
                        putBgColor(c, r, "#008500"); break;
                    case GRASS3:
                        putBgColor(c, r, "#009000"); break;
                    case CAVE_FLOOR1:
                        putBgColor(c, r, "#151540"); break;
                    case CAVE_FLOOR2:
                        putBgColor(c, r, "#151548"); break;
                }
                switch (cur_cell.fg) {
                    case PINE_TREE:
                        drawShape(PINE_TREE, c, r, {top_color: "#006000", trunk_color: "#303000"}); break;
                    case GRAY_BLOCK:
                        drawShape(BLOCK, c, r, {color: "#808080", highlight: "#B0B0B0", shadow: "#505050", edge_width: 3}); break;
                    case CAVE_WALL:
                        //drawShape(BLOCK, c, r, {color: "#404070", highlight: "#6060B0", shadow: "#202050", edge_width: 3}); break;
                        
                        putBgColor(c, r, "#404070")
                        if (map_r < MAP_ROWS-1 && map[curMapArea][map_r+1][map_c].fg !== CAVE_WALL) {
                            ctx.fillStyle = "#202050"
                            ctx.fillRect(c*CELL_WIDTH, (r+1)*CELL_HEIGHT-3, CELL_WIDTH, 3)
                        }
                        if (map_c < MAP_COLS-1 && map[curMapArea][map_r][map_c+1].fg !== CAVE_WALL) {
                            ctx.fillStyle = "#202050"
                            ctx.fillRect((c+1)*CELL_WIDTH-3, r*CELL_HEIGHT, 3, CELL_HEIGHT)
                        }
                        if (map_r > 0 && map[curMapArea][map_r-1][map_c].fg !== CAVE_WALL) {
                            ctx.fillStyle = "#6060B0"
                            ctx.fillRect(c*CELL_WIDTH, r*CELL_HEIGHT, CELL_WIDTH, 3)
                        }
                        if (map_c > 0 && map[curMapArea][map_r][map_c-1].fg !== CAVE_WALL) {
                            ctx.fillStyle = "#6060B0"
                            ctx.fillRect(c*CELL_WIDTH, r*CELL_HEIGHT, 3, CELL_HEIGHT)
                        }
                }
                // Adjust lighting
                if (cur_cell.lighting.alpha > 0) {
                    ctx.globalAlpha = cur_cell.lighting.alpha
                    ctx.fillStyle = get_color_code(cur_cell.lighting)
                    ctx.fillRect(c*CELL_WIDTH, r*CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
                    ctx.globalAlpha = 1.0
                }
            }

            //// Debug output distance numbers
            //ctx.font = "10px Arial"
            //ctx.fillStyle = "#A0A0A0"
            //if (map_r >= 0 && map_c >= 0 && map_r < MAP_ROWS && map_c < MAP_COLS) {
            //    ctx.fillText(map[curMapArea][map_r][map_c].dist.toString(), c*CELL_WIDTH + 8, r * CELL_HEIGHT + 18)
            //}

        }
    }
    drawShape(PLAYER, HALF_SCREEN_COLS, HALF_SCREEN_ROWS)
    //putChar("@", HALF_SCREEN_COLS, HALF_SCREEN_ROWS, "#00FFFF")

    //ctx.font = "10px Arial"
    //ctx.fillText("player.r = " + player.r.toString(), 10, 10)
    //ctx.fillText("player.c = " + player.c.toString(), 10, 20)
}

function get_color_code(color) {
    // This should support r, g, b and alpha all being floating point numbers between 0 and 1
    // This might be inefficient though, probably a better way to do this
    return "rgb(" + parseInt(255*color.r).toString() + "," + parseInt(255*color.g).toString() + "," + parseInt(255*color.b).toString() + ")"
}

function distance(source_r, source_c, dest_r, dest_c) {
    return Math.sqrt(Math.abs(source_r - dest_r)**2 + Math.abs(source_c - dest_c)**2)
}

function distance_falloff_visibility(player_pos, map_r, map_c) {
    var dist = distance(player_pos.r, player_pos.c, map_r, map_c)
    var max_visible_dist = 30
    var visibility = Math.max(0.0, (max_visible_dist - dist)/max_visible_dist)
    return visibility
}

function line_of_sight_visibility(area, source_pos, map_r, map_c) {
    var cur_pos = {r: source_pos.r, c: source_pos.c}
    var dist = distance(source_pos.r, source_pos.c, map_r, map_c)
    var num_steps = parseInt(dist*2)
    var dr = (map_r - source_pos.r)/num_steps
    var dc = (map_c - source_pos.c)/num_steps
    var visibility = 1.0
    for (var i = 0; i < num_steps; i++) {
        var r = parseInt(cur_pos.r)
        var c = parseInt(cur_pos.c)
        visibility -= area[r][c].opacity * 0.2
        cur_pos.r += dr
        cur_pos.c += dc
    }
    return Math.max(visibility, 0.0)
}

function compute_shadows(area, source) {

    var r, c, map_r, map_c
    // Initialize all cells on screen to be in shadow
    for (r = 0; r < SCREEN_ROWS; r++) {
        for (c = 0; c < SCREEN_COLS; c++) {
            map_r = player.r + r - HALF_SCREEN_ROWS
            map_c = player.c + c - HALF_SCREEN_COLS
            if (in_bounds(map_r, map_c)) {
                area[map_r][map_c].lighting.alpha = 1.0 - distance_falloff_visibility(player, map_r, map_c) * line_of_sight_visibility(area, player, map_r, map_c)
            }
        }
    }
}


function in_bounds(map_r, map_c) {
    return map_r >= 0 && map_c >= 0 && map_r < MAP_ROWS && map_c < MAP_COLS
}

window.addEventListener("keydown", function(event) {
    if (event.defaultPrevented) {
        return;  // Do nothing if the event was already processed
    }
    switch (event.key) {
        case "ArrowDown":
        case "j":
            movePlayer(0, 1);
            break;
        case "ArrowUp":
        case "k":
            movePlayer(0, -1);
            break;
        case "ArrowLeft":
        case "h":
            movePlayer(-1, 0);
            break;
        case "ArrowRight":
        case "l":
            movePlayer(1, 0);
            break;
        case "Space":
            movePlayer(0, 0);
            break;
        default:
           return;
    }
    redraw()
    event.preventDefault(); // Don't allow events to be handled twice
});


window.addEventListener("load", function(event) {
    initGameData();
    redraw();
})

// resize the canvas to fill browser window dynamically
//window.addEventListener('resize', resizeCanvas, false);

//function resizeCanvas() {
//    canvas.width = window.innerWidth;
//    canvas.height = window.innerHeight;
//}
//resizeCanvas();



// Define the maps
function initGameData() {
    map = []

    for (var area = 0; area < NUM_MAP_AREAS; area++) {
        map[area] = []
        for (r = 0; r < MAP_ROWS; r++) {
            map[area][r] = []
            for (c = 0; c < MAP_COLS; c++) {
                map[area][r][c] = {fg: EMPTY_SPACE,
                                   bg: EMPTY_SPACE,
                                   seen: false,
                                   dist: -1,
                                   lighting: {alpha: 0.0, r: 0.0, g: 0.0, b: 0.0},
                                   opacity: 0.0
                                  }
            }
        }
    }
    //init_castle(map[0])
    //init_castle_walls(map[1], map[0])
    init_forest(map[2])
    init_cave(map[3])
    //init_surreal(map[4])
    //init_dungeon(map[5])
}
