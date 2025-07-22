
var canvas = document.getElementById('thecanvas')
var ctx = canvas.getContext('2d')
var BORDER = 10
var clock = 0
var size = "medium"    // "small", "medium" or "large"

var CELL_SIZE = 90
var CELL_SIZE = 90
var ARENA_COLS = 12
var ARENA_ROWS = 8

if (size === "medium") {
    CELL_SIZE = 45
    CELL_SIZE = 45
    ARENA_COLS = 20
    ARENA_ROWS = 16
} else if (size === "large") {
    CELL_SIZE = 27
    CELL_SIZE = 27
    ARENA_COLS = 60
    ARENA_ROWS = 30
}

var ARENA_WIDTH = 2*BORDER + ARENA_COLS*CELL_SIZE
var ARENA_HEIGHT = 2*BORDER + ARENA_ROWS*CELL_SIZE
var TURN_SPEED = 0.4
var MOVE_SPEED = 0.25
var NUM_CHEESES = 1
var arena = []
var mouse_sprite = new Image()
var floor_sprite = new Image()
var cheese_sprite = new Image()
var mouse_cheese_sprite = new Image()
mouse_sprite.src = "mouse.png"
floor_sprite.src = "floor.png"
cheese_sprite.src = "cheese.png"
mouse_cheese_sprite.src = "mouse_cheese.jpg"
var remaining_cheeses = NUM_CHEESES
nom_nom = new Audio('nom_nom.mp3')

var move_info = [{delta_r: 0, delta_c: 1, target_theta: 0},
                 {delta_r: -1, delta_c: 0, target_theta: Math.PI/2},
                 {delta_r: 0, delta_c: -1, target_theta: Math.PI},
                 {delta_r: 1, delta_c: 0, target_theta: -Math.PI/2}]

var move_queue = []

var player = {
    r: 2,
    c: 2,
    target_r: 2,
    target_c: 2,
    theta: 0,
    target_theta: 0,
    sprite: mouse_sprite
}

function init_arena() {
    var r, c, cell
    for (r = 0; r < ARENA_ROWS; r++) {
        arena.push([])
        for (c = 0; c < ARENA_COLS; c++) {
            cell = {
                visited: false,
                has_cheese: false,
                cell_above: null,
                cell_below: null,
                cell_left: null,
                cell_right: null,
                r: r,
                c: c
            }
            arena[r].push(cell)
        }
    }

    // Maze generation
    var total_nodes = ARENA_ROWS*ARENA_COLS
    var cur_cell = arena[player.r][player.c]
    cur_cell.visited = true
    var num_visited = 1
    var visited_stack = []
    visited_stack.push(cur_cell)
    var directions = [{r: 0, c: 1}, {r: -1, c: 0}, {r: 0, c: -1}, {r: 1, c: 0}]
    while (num_visited < total_nodes) {

        // Pick a random direction and spin from there checking for open directions
        //var rand = Math.floor(Math.random() * 4)
        var rand = Math.floor(Math.random() * 16)
        if (rand > 9) {
            if (cur_cell.c > ARENA_COLS/2) {
                rand = 1
            } else {
                rand = 0
            }
        } else if (rand > 3) {
            if (cur_cell.c > ARENA_COLS/2) {
                rand = 3
            } else {
                rand = 2
            }
        }

        var found_one = false
        for (i = 0; i < 4; i++) {
            var choice_dir = directions[(rand + i) % 4]
            var choice_r = cur_cell.r + choice_dir.r
            var choice_c = cur_cell.c + choice_dir.c

            // If the chosen cell is in the grid and hasn't yet been visited, move there
            if (choice_c > -1 && choice_c < ARENA_COLS && choice_r > -1 && choice_r < ARENA_ROWS && !arena[choice_r][choice_c].visited) {
                found_one = true
                new_cell = arena[choice_r][choice_c]

                if (choice_dir.r === -1) {   // Up
                    cur_cell.cell_above = new_cell
                    new_cell.cell_below = cur_cell
                } else if (choice_dir.r === 1) {  // Down
                    cur_cell.cell_below = new_cell
                    new_cell.cell_above = cur_cell
                } else if (choice_dir.c === -1) {  // Left
                    cur_cell.cell_left = new_cell
                    new_cell.cell_right = cur_cell
                } else if (choice_dir.c === 1) {  // Right
                    cur_cell.cell_right = new_cell
                    new_cell.cell_left = cur_cell
                }

                new_cell.visited = true
                visited_stack.push(new_cell)
                cur_cell = new_cell
                num_visited++
                break
            }
        }
        // If there were no viable options, back track
        if (!found_one) {
            visited_stack.pop()
            cur_cell = visited_stack[visited_stack.length-1]
        }
    }

    for (i = 0; i < NUM_CHEESES; i++) {
        r = Math.floor(Math.random() * ARENA_ROWS)
        c = Math.floor(Math.random() * ARENA_COLS/2) + ARENA_COLS/2-1
        console.log("r = " + r.toString() + ", c = " + c.toString())
        while (arena[r][c].has_cheese) {
            r = Math.floor(Math.random() * ARENA_ROWS)
            c = Math.floor(Math.random() * ARENA_COLS/2) + ARENA_COLS/2-1
            console.log("r = " + r.toString() + ", c = " + c.toString())
        }
        arena[r][c].has_cheese = true
    }
}

function draw_player() {
    var x = BORDER + (player.c+0.5)*CELL_SIZE
    var y = BORDER + (player.r+0.5)*CELL_SIZE

    var theta_diff = player.target_theta - player.theta
    var r_diff = player.target_r - player.r
    var c_diff = player.target_c - player.c
    //console.log(r_diff)

    if (r_diff === 0 && c_diff === 0 && theta_diff === 0 && move_queue.length > 0) {
        move_index = move_queue.shift()
        move = move_info[move_index]
        if (move.target_theta < 0 && player.theta > Math.PI/2) {
            player.theta -= 2*Math.PI
        } else if (move.target_theta > Math.PI/2 && player.theta < 0) {
            player.theta += 2*Math.PI
        }
        player.target_theta = move.target_theta
        if ((move_index == 0 && arena[player.r][player.c].cell_right !== null) ||
            (move_index == 1 && arena[player.r][player.c].cell_above !== null) ||
            (move_index == 2 && arena[player.r][player.c].cell_left !== null) ||
            (move_index == 3 && arena[player.r][player.c].cell_below !== null)) {
            player.target_r = player.r + move.delta_r
            player.target_c = player.c + move.delta_c
        }

        // Recalculate diffs
        theta_diff = player.target_theta - player.theta
        r_diff = player.target_r - player.r
        c_diff = player.target_c - player.c
    }


    if (theta_diff < -TURN_SPEED) {
        player.theta -= TURN_SPEED
    } else if (theta_diff > TURN_SPEED) {
        player.theta += TURN_SPEED
    } else {
        player.theta = player.target_theta
    }
    
    if (r_diff < -MOVE_SPEED) {
        player.r -= MOVE_SPEED
    } else if (r_diff > MOVE_SPEED) {
        player.r += MOVE_SPEED
    } else {
        player.r = player.target_r
    }

    if (c_diff < -MOVE_SPEED) {
        player.c -= MOVE_SPEED
    } else if (c_diff > MOVE_SPEED) {
        player.c += MOVE_SPEED
    } else {
        player.c = player.target_c
    }

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(-player.theta)
    s = CELL_SIZE * 0.9
    ctx.drawImage(player.sprite, -s/2, -s/2, s, s)
    ctx.restore()

}

function update() {
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    if (remaining_cheeses === 0) {
        // Draw ending screen
        ctx.fillStyle = "#FFFFFF"
        ctx.font = "20px Arial"
        ctx.fillText("Mmmm that's some good cheese", ARENA_WIDTH/2-150, ARENA_HEIGHT * 0.8)
        ctx.font = "12px Arial"
        ctx.fillText("Refresh to play again", ARENA_WIDTH/2-70, ARENA_HEIGHT * 0.95)

        ctx.drawImage(mouse_cheese_sprite, ARENA_WIDTH/2-mouse_cheese_sprite.width/2, 80)
    } else {
        for (var r = 0; r < ARENA_ROWS; r++) {
            for (var c = 0; c < ARENA_COLS; c++) {
                ctx.fillStyle = "#A0A0C0"
                ctx.fillRect(BORDER + c*CELL_SIZE, BORDER + r*CELL_SIZE, CELL_SIZE, CELL_SIZE)
            }
        }

        for (var r = 0; r < ARENA_ROWS; r++) {
            for (var c = 0; c < ARENA_COLS; c++) {
                ctx.fillStyle = "#503030"
                wall_thickness = 4
                overhang = 2
                wall_length = CELL_SIZE + 2*overhang
                if (c === 0 && arena[r][c].cell_left === null) {
                    ctx.fillRect(BORDER + c*CELL_SIZE - wall_thickness/2, BORDER + r*CELL_SIZE - overhang, wall_thickness, wall_length)
                }
                if (r === 0 && arena[r][c].cell_above === null) {
                    ctx.fillRect(BORDER + c*CELL_SIZE - overhang, BORDER + r*CELL_SIZE - wall_thickness/2, wall_length, wall_thickness)
                }
                if (arena[r][c].cell_right === null) {
                    ctx.fillRect(BORDER + (c+1)*CELL_SIZE - wall_thickness/2, BORDER + r*CELL_SIZE - overhang, wall_thickness, wall_length)
                }
                if (arena[r][c].cell_below === null) {
                    ctx.fillRect(BORDER + c*CELL_SIZE - overhang, BORDER + (r+1)*CELL_SIZE - wall_thickness/2, wall_length, wall_thickness)
                }
                if (arena[r][c].has_cheese) {
                    ctx.drawImage(cheese_sprite, BORDER + (c+0.5)*CELL_SIZE - cheese_sprite.width/2, BORDER + (r+0.5)*CELL_SIZE - cheese_sprite.height/2)
                }
            }
        }

        draw_player()

        if (player.r === player.target_r && player.c === player.target_c && arena[player.r][player.c].has_cheese) {
            arena[player.r][player.c].has_cheese = false
            nom_nom.play()
            remaining_cheeses--
            if (remaining_cheeses === 0) {
                won = true
            }
        }
    }
}

canvas.width = ARENA_WIDTH
canvas.height = ARENA_HEIGHT

init_arena()

document.addEventListener('keydown', function(event) {
    if (event.keyCode == 37) {  // left
        if (move_queue.length < 5) {
            move_queue.push(2)
        }
    } else if (event.keyCode == 39) {  // right
        if (move_queue.length < 5) {
            move_queue.push(0)
        }
    } else if (event.keyCode == 38) {  // up
        if (move_queue.length < 5) {
            move_queue.push(1)
        }
    } else if (event.keyCode == 40) {  // down
        if (move_queue.length < 5) {
            move_queue.push(3)
        }
    }
});

// Update every 15ms
setInterval(update, 15)
