
function rand_int(max) {
    return Math.floor(Math.random() * max)
}

function rand_int_in_range(min, max) {
    return rand_int(max - min) + min
}

function is_traversable(cell) {
    switch(cell.fg) {
        case EMPTY_SPACE:
            return true
            break
    }
    return false
}


function compute_dist_map(area, row, col) {
    var r, c
    // Initialize to 'unreachable'
    for (r = 0; r < MAP_ROWS; r++) {
        for (c = 0; c < MAP_COLS; c++) {
            area[r][c].dist = -1
        }
    }
    area[row][col].dist = 0
    cur_highest_dist = 0
    neighbors = [{r: row-1, c: col}, {r: row, c: col-1}, {r: row+1, c: col}, {r: row, c: col+1}]
    // For each cell we add with the current distance, add it's neighbors to the list of cells to be checked next.
    // Neighbors might not be in-bounds! We'll check that when we process them
    while (neighbors.length > 0) {
        new_neighbors = []
        for (var i = 0; i < neighbors.length; i++) {
            if (neighbors[i].r >= 0 && neighbors[i].r < MAP_ROWS && neighbors[i].c >= 0 && neighbors[i].c < MAP_COLS) {
                r = neighbors[i].r
                c = neighbors[i].c
                if (area[r][c].dist === -1 && is_traversable(area[r][c])) {
                    area[r][c].dist = cur_highest_dist + 1
                    new_neighbors.push({r: r-1, c: c}, {r: r, c: c-1}, {r: r+1, c: c}, {r: r, c: c+1})
                }
            }
        }
        neighbors = new_neighbors
        cur_highest_dist++
    }
}


function drill(area, r, c) {
    area[r][c].fg = EMPTY_SPACE
    if (r > 0) { area[r-1][c].fg = EMPTY_SPACE }
    if (c > 0) { area[r][c-1].fg = EMPTY_SPACE }
    if (r < MAP_ROWS-1) { area[r+1][c].fg = EMPTY_SPACE }
    if (c < MAP_COLS-1) { area[r][c+1].fg = EMPTY_SPACE }
}

function drill_tunnel_toward_map_center(area, r, c) {
    center_r = MAP_ROWS/2
    center_c = MAP_COLS/2

    var x = c
    var y = r
    var len = Math.sqrt((center_c-c)**2 + (center_r-r)**2)
    var dx = (center_c - c)/len
    var dy = (center_r - r)/len

    drill_path = []
    for (i = 0; i <= parseInt(len); i++) {
        cur_r = parseInt(y)
        cur_c = parseInt(x)
        if (area[cur_r][cur_c].fg === EMPTY_SPACE && i > 1) {
            break
        }
        drill_path.push({r: cur_r, c: cur_c})
        x += dx
        y += dy
    }

    for (i = 0; i < drill_path.length; i++) {
        drill(area, drill_path[i].r, drill_path[i].c)
    }
}

function connect_disconnected_regions(area) {
    // connect disconnected regions
    var disconnected_regions_exist = true
    var r1, r2, c1, c2
    connect_loop: while (disconnected_regions_exist) {
        disconnected_regions_exist = false
        // Start in the center of the map and work outward, looking for disconnected regions
        r1 = parseInt(MAP_ROWS/2)
        r2 = r1 + 1
        c1 = parseInt(MAP_COLS/2)
        c2 = c1 + 1
        compute_dist_map(area, r1, c1)

        while (r1 > 0 && c1 > 0) {
            for (r = r1; r <= r2; r++) {
                if (area[r][c1].fg === EMPTY_SPACE && area[r][c1].dist === -1) {
                    drill_tunnel_toward_map_center(area, r, c1)
                    disconnected_regions_exist = true
                    continue connect_loop
                }
                if (area[r][c2].fg === EMPTY_SPACE && area[r][c2].dist === -1) {
                    drill_tunnel_toward_map_center(area, r, c2)
                    disconnected_regions_exist = true
                    continue connect_loop
                }
            }
            for (c = c1; c <= c2; c++) {
                if (area[r1][c].fg === EMPTY_SPACE && area[r1][c].dist === -1) {
                    drill_tunnel_toward_map_center(area, r1, c)
                    disconnected_regions_exist = true
                    continue connect_loop
                }
                if (area[r2][c].fg === EMPTY_SPACE && area[r2][c].dist === -1) {
                    drill_tunnel_toward_map_center(area, r2, c)
                    disconnected_regions_exist = true
                    continue connect_loop
                }
            }
            r1 = Math.max(r1-1, 0)
            r2 = Math.min(r2+1, MAP_ROWS-1)
            c1 = Math.max(c1-1, 0)
            c2 = Math.min(c2+1, MAP_COLS-1)
        }
    }
}

// Given a set of options with probabilities like {"A": 0.4, "B": 0.1, "C": 0.5}, return a
// one of the given options. Assumes the total probability sums to 1.
function pick_weighted_option(weighted_options) {
    var remaining_p = 1.0
    for (var index in weighted_options) {
        option = weighted_options[index]
        if (remaining_p <= 0) {
            // Shouldn't get here with good weighted_options, but just in case, should premept and divide by 0 errors
            console.warn("Something is wonky with weighted_options: %o", weighted_options)
            return option.val
        }
        if (Math.random() <= option.p / remaining_p) {
            return option.val
        }
        remaining_p -= option.p
    }
    // Shouldn't get here
    console.error("pick_weighted_option failed to pick an option! %o", weighted_options)
    return null
}

function fill_rectangular_area(area, prop, top, left, height, width, value) {
    var raw_array = (prop === null)
    var value_is_weighted_map = (typeof(value) === "object")
    for (var r = 0; r < height; r++) {
        for (var c = 0; c < width; c++) {
            if (raw_array) {
                area[top + r][left + c] = value_is_weighted_map ? pick_weighted_option(value) : value
            } else {
                area[top + r][left + c][prop] = value_is_weighted_map ? pick_weighted_option(value) : value
            }
        }
    }
}

function add_random_in_rectangular_area(area, prop, top, left, height, width, value, cover_p) {
    var raw_array = (prop === null)
    var value_is_weighted_map = (typeof(value) === "object")
    for (var r = 0; r < height; r++) {
        for (var c = 0; c < width; c++) {
            if (Math.random() < cover_p) {
                if (raw_array) {
                    area[top + r][left + c] = value_is_weighted_map ? pick_weighted_option(value) : value
                } else {
                    area[top + r][left + c][prop] = value_is_weighted_map ? pick_weighted_option(value) : value
                }
            }
        }
    }
}

function add_rectangular_border(area, prop, top, left, height, width, value) {
    var raw_array = (prop === null)
    var value_is_weighted_map = (typeof(value) === "object")

    for (var r = 0; r < height; r++) {
        if (raw_array) {
            area[top + r][left] = value_is_weighted_map ? pick_weighted_option(value) : value
            area[top + r][left + width - 1] = value_is_weighted_map ? pick_weighted_option(value) : value
        } else {
            area[top + r][left][prop] = value_is_weighted_map ? pick_weighted_option(value) : value
            area[top + r][left + width - 1][prop] = value_is_weighted_map ? pick_weighted_option(value) : value
        }
    }
    for (var c = 0; c < width; c++) {
        if (raw_array) {
            area[top][left + c] = value_is_weighted_map ? pick_weighted_option(value) : value
            area[top + height - 1][left + c] = value_is_weighted_map ? pick_weighted_option(value) : value
        } else {
            area[top][left + c][prop] = value_is_weighted_map ? pick_weighted_option(value) : value
            area[top + height - 1][left + c][prop] = value_is_weighted_map ? pick_weighted_option(value) : value
        }
    }
}

function create_2d_array(num_rows, num_cols, fill) {
    if (typeof(fill) === "undefined") {
        fill = EMPTY_SPACE
    }
    var arr = new Array(num_rows)
    for (var r = 0; r < num_rows; r++) {
         arr[r] = new Array(num_cols).fill(fill)
    }
    return arr
}

function cellular_automata_erode(area, prop, fg_value, num_passes, density_threshold) {
    var tempMap = create_2d_array(MAP_ROWS, MAP_COLS, EMPTY_SPACE)
    add_rectangular_border(tempMap, null, 0, 0, MAP_ROWS, MAP_COLS, fg_value)

    var fg_is_weighted_map = typeof(fg_value) === "object"
    if (typeof(density_threshold) === "undefined") { density_threshold = 4 }

    // Cellular Automata Refinement
    var r, c, x, y, pass, num_neighbors
    for (pass = 0; pass < num_passes; pass++) {
        for (r = 1; r < MAP_ROWS-1; r++) {
            for (c = 1; c < MAP_COLS-1; c++) {
                num_neighbors = 0

                for (x = -1; x < 2; x++) {
                    for (y = -1; y < 2; y++) {
                        if (area[r+y][c+x][prop] !== EMPTY_SPACE) {
                            num_neighbors++
                        }
                    }
                }

                if (num_neighbors > density_threshold) {
                    tempMap[r][c] = fg_is_weighted_map ? pick_weighted_option(fg_value) : fg_value
                } else {
                    tempMap[r][c] = EMPTY_SPACE
                }
            }
        }

        // The above pass updated a temporary map so it didn't affect the actual map. Copy the results to the actual map.
        for (r = 0; r < MAP_ROWS; r++) {
            for (c = 0; c < MAP_COLS; c++) {
                area[r][c][prop] = tempMap[r][c]
            }
        }
    }
}

function calculate_opacity(area) {
    for (var r = 0; r < MAP_ROWS; r++) {
        for (var c = 0; c < MAP_COLS; c++) {
            if (area[r][c].fg === CAVE_WALL || area[r][c].fg == BLOCK || area[r][c].fg == GRAY_BLOCK) {
                area[r][c].opacity = 1.0
            }
            if (area[r][c].fg == PINE_TREE) {
                area[r][c].opacity = 0.0
            }
        }
    }
}

function init_cave(area) {

    fill_rectangular_area(area, "bg", 0, 0, MAP_ROWS, MAP_COLS, [{val: CAVE_FLOOR1, p: 0.7}, {val: CAVE_FLOOR2, p: 0.3}])
    fill_rectangular_area(area, "fg", 0, 0, MAP_ROWS, MAP_COLS, [{val: CAVE_WALL, p: 0.5}, {val: EMPTY_SPACE, p: 0.5}])
    add_rectangular_border(area, "fg", 0, 0, MAP_ROWS, MAP_COLS, CAVE_WALL)

    // Leave a hole in the middle where the player starts
    fill_rectangular_area(area, "fg", MAP_ROWS/2-4, MAP_COLS/2-4, 8, 8, EMPTY_SPACE)

    cellular_automata_erode(area, "fg", CAVE_WALL, 5)

    connect_disconnected_regions(area)

    calculate_opacity(area)
}


function init_castle(area) { }

function init_castle_walls(area, castle_area) { }

function init_forest(area) {
    fill_rectangular_area(area, "bg", 0, 0, MAP_ROWS, MAP_COLS, [{val: GRASS1, p: 0.5}, {val: GRASS2, p: 0.25}, {val: GRASS3, p: 0.25}])
    fill_rectangular_area(area, "fg", 0, 0, MAP_ROWS, MAP_COLS, [{val: PINE_TREE, p: 0.5}, {val: EMPTY_SPACE, p: 0.5}])
    add_rectangular_border(area, "fg", 0, 0, MAP_ROWS, MAP_COLS, PINE_TREE)

    // Leave a hole in the middle where the player starts
    fill_rectangular_area(area, "fg", MAP_ROWS/2-4, MAP_COLS/2-4, 8, 8, EMPTY_SPACE)

    cellular_automata_erode(area, "fg", PINE_TREE, 5)

    add_random_in_rectangular_area(area, "fg", 0, 0, MAP_ROWS, MAP_COLS, PINE_TREE, 0.2)

    connect_disconnected_regions(area)

    calculate_opacity(area)
}


    

function init_surreal(area) { }

function init_dungeon(area) { }
