function drawShape(shape, x, y, params) {
    var x0 = x*CELL_WIDTH
    var y0 = y*CELL_HEIGHT
    if (shape === PINE_TREE) {
        // Top
        ctx.fillStyle = params.top_color
        ctx.beginPath()
        ctx.moveTo(x0 + CELL_WIDTH*0.5, y0 + CELL_HEIGHT*0.1)
        ctx.lineTo(x0 + CELL_WIDTH*0.1, y0 + CELL_HEIGHT*0.8)
        ctx.lineTo(x0 + CELL_WIDTH*0.9, y0 + CELL_HEIGHT*0.8)
        ctx.fill()
        // Trunk
        ctx.fillStyle = params.trunk_color
        ctx.fillRect(x0 + CELL_WIDTH*0.45, y0 + CELL_HEIGHT*0.8, CELL_WIDTH*0.1, CELL_HEIGHT*0.18)
    } else if (shape === BLOCK) {
        ctx.fillStyle = params.shadow
        ctx.beginPath()
        ctx.moveTo(x0, y0 + CELL_HEIGHT-1)
        ctx.lineTo(x0 + CELL_WIDTH-1, y0 + CELL_HEIGHT-1)
        ctx.lineTo(x0 + CELL_WIDTH-1, y0)
        ctx.fill()

        ctx.fillStyle = params.highlight
        ctx.beginPath()
        ctx.moveTo(x0, y0 + CELL_HEIGHT-1)
        ctx.lineTo(x0, y0)
        ctx.lineTo(x0 + CELL_WIDTH-1, y0)
        ctx.fill()

        ctx.fillStyle = params.color
        ctx.fillRect(x*CELL_WIDTH+params.edge_width, y*CELL_HEIGHT+params.edge_width, CELL_WIDTH-1-(2*params.edge_width), CELL_HEIGHT-1-(2*params.edge_width));
    } else if (shape === PLAYER) {
        ctx.fillStyle = "#A0A0A0"
        ctx.strokeStyle = "#A0A0A0"
        var xc = x0 + CELL_WIDTH*0.5
        ctx.beginPath()
        ctx.arc(xc, y0 + CELL_HEIGHT*0.2, CELL_WIDTH*0.1, 0, 2*Math.PI)
        ctx.fill()

        ctx.beginPath()
        ctx.moveTo(xc, y0 + CELL_HEIGHT*0.2)
        ctx.lineTo(xc, y0 + CELL_HEIGHT*0.6)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(xc - CELL_WIDTH*0.2, y0 + CELL_HEIGHT*0.4)
        ctx.lineTo(xc + CELL_WIDTH*0.2, y0 + CELL_HEIGHT*0.4)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(xc - CELL_WIDTH*0.2, y0 + CELL_HEIGHT*0.8)
        ctx.lineTo(xc, y0 + CELL_HEIGHT*0.6)
        ctx.lineTo(xc + CELL_WIDTH*0.2, y0 + CELL_HEIGHT*0.8)
        ctx.stroke()
    }
}

function gen_gfx() {
    var canv = document.getElementById("scratch");
    var c = canv.getContext("2d");

}

function putBgColor(x, y, color) {
    if (typeof(color) !== "undefined") {
        ctx.fillStyle = color
        ctx.fillRect(x*CELL_WIDTH, y*CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
    }
}

function putChar(chr, x, y, color) {
    ctx.fillStyle = color
    ctx.font = "bold 30px courier"
    ctx.fillText(chr, (x + 0.1)*CELL_WIDTH, (y+0.8)*CELL_HEIGHT);
}
