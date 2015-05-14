/*global ut */
var term, eng; // Can't be initialized yet because DOM is not ready
var updateFOV; // For some of the examples
var xmax = 100;
var ymax = 66;
var pl = { x: xmax/2, y: ymax/2 }; // Player position

// The tile palette is precomputed in order to not have to create
// thousands of Tiles on the fly.
var WATER = new ut.Tile('\u224B', 100, 100, 255);
var LAND0 = new ut.Tile('\u2592', 50, 50, 255);
var LAND1 = new ut.Tile('\u2592', 131, 68, 31);
var LAND2 = new ut.Tile('\u2592', 189, 86, 23);
var LAND3 = new ut.Tile('\u2592', 237, 211, 187);
var LAND4 = new ut.Tile('\u2593', 255, 255, 255);
var VEG1 = new ut.Tile('\uffcf', 29, 184, 2, 84, 32, 0);
var VEG2 = new ut.Tile('\uffce', 29, 184, 2, 70, 22, 0);
var VEG3 = new ut.Tile('\uffb3', 29, 184, 2, 60, 12, 0);
var VEG4 = new ut.Tile('\u2698', 29, 184, 2, 50, 10, 0);
var VEG5 = new ut.Tile('\u234b', 29, 184, 2, 40, 5, 0);
var POP1 = new ut.Tile('\uffb5', 255, 255, 255, 50, 50, 50);
var POP2 = new ut.Tile('\uffb6', 255, 255, 255, 60, 60, 60);
var POP3 = new ut.Tile('\uffb8', 255, 255, 255, 70, 70, 70);
var POP4 = new ut.Tile('\uffb9', 255, 255, 255, 80, 80, 80);
var POP5 = new ut.Tile('\u2656', 255, 255, 255, 94, 94, 94);
var VEG0 = new ut.Tile('\u2601', 180, 180, 180);
var POP0 = new ut.Tile('\uA764', 180, 180, 180);
// Returns a Tile based on the char array map
function getMapTile(x, y) {
	var m = pcapmap[y][x]; // dammit you crazy bastard
	// Vegetation, determined by number of outbound packets
	var num = Math.max(m.outbound, m.inbound);
	var dir;
	// inbound = true, outbound = false
	if (m.outbound != num) {
		dir = true;
	}
	// Rocks and Pirates first
	if (num >0 && m.altitude == 0) {
		if (dir) {
			return POP0;
		} else {
			return VEG0;
		}
	}
	if (num > 50000) {
                if (dir) { 
			return POP5;
		} else { 
			return VEG5; 
		}
        }
	if (num > 35000) {
        	if (dir) { 
                        return POP4;
                } else { 
                        return VEG4; 
                }
	}
	if (num > 20000) {
        	if (dir) { 
                        return POP3;
                } else { 
                        return VEG3; 
                }
	}
	if (num > 10000) {
        	if (dir) { 
                        return POP2;
                } else { 
                        return VEG2; 
                }
	}
	if (num > 0) {
		if (dir) { 
                        return POP1;
                } else { 
                        return VEG1; 
                }
	}
	if (m.altitude == 0) { 
		return LAND0;
	}
	if (m.altitude == 1) {
		return LAND1;
	}
	if (m.altitude == 2) {
		return LAND2;
	}
	if (m.altitude == 3) {
		return LAND3;
	}
	if (m.altitude == 4) {
		return LAND4;
	}
	return WATER;
}

// "Main loop"
function tick() {
	eng.update(pl.x, pl.y); // Update tiles
	term.render(); // Render
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: parseInt((evt.clientX - rect.left) / 12.05),
      y: parseInt((evt.clientY - rect.top) / 20.05)
    };
}

function postStatus(pos) {
	var json = JSON.stringify(pos, null, 2);
	document.getElementById("infotext").innerHTML = json;
}
	
// Initialize stuff
function initMap() {
	window.setInterval(tick, 50); // Animation
	// Initialize Viewport, i.e. the place where the characters are displayed
	term = new ut.Viewport(document.getElementById("game"), xmax, ymax);
	term.setRenderer("canvas"); // bugs in webgl and dom, using this
	// Initialize Engine, i.e. the Tile manager
	eng = new ut.Engine(term, getMapTile, xmax, ymax);
	// Add event listener to canvas
	term.renderer.view.elem.addEventListener('click', function(event) {
		var pos = getMousePos(term.renderer.canvas, event);
		postStatus(pcapmap[pos.y][pos.x]);
	});
	// Tiles are 12 px wide x 100, and 20px high x 66
}

