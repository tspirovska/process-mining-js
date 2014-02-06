requirejs.config({
	baseUrl : 'js',

});

define([], function() {

	var Renderer = function(canvas) {
		var canvas = $(canvas).get(0);
		var ctx = canvas.getContext("2d");
		var gfx = Graphics(canvas);
		var particleSystem = null;

		var that = {
			init : function(system) {
				particleSystem = system;
				particleSystem.screenSize(canvas.width, canvas.height);
				particleSystem.screenPadding(80);

				that.initMouseHandling();
			},

			redraw : function() {

				if (!particleSystem)
					return;
				gfx.clear();

				var nodeBoxes = {};

				particleSystem.eachNode(function(node, pt) {
					var label = node.name || "";
					var w = ctx.measureText("" + label).width + 10;
					w = 10;

					// draw a rectangle centered at pt
					if (node.data.color)
						ctx.fillStyle = node.data.color;
					else
						ctx.fillStyle = "rgba(0,0,0,.2)";
					if (node.data.color == 'none')
						ctx.fillStyle = "white";

					var s = 40;
					if (node.data.shape == 'circle') {

						gfx.oval(pt.x - w / 2, pt.y - w / 2, s, s, {
							stroke : "black",
							fill : ctx.fillStyle
						});

						nodeBoxes[node.name] = [ pt.x - w / 2, pt.y - w / 2, s, s ];

					} else if (node.data.shape == 'square') {
						gfx.rect(pt.x - w / 2, pt.y - 10, s, s, 4, {
							stroke : "black",
							fill : ctx.fillStyle
						});
						nodeBoxes[node.name] = [ pt.x - w / 2, pt.y - 11, s, s + 2 ];
					}

					// draw the text
					if (label) {
						ctx.font = "16px Helvetica";
						ctx.textAlign = "center";
						ctx.fillStyle = "black";
						if (node.data.color == 'none')
							ctx.fillStyle = '#333333';
						var off = 40;
						if (node.data.shape == "square") {
							ctx.font = "22px Helvetica";
							ctx.fillStyle = "white";
							off = 0;
						}
						ctx.fillText(label || "", pt.x + s / 3, pt.y + 4 + s / 4 + off);
						ctx.fillText(label || "", pt.x + s / 3, pt.y + 4 + s / 4 + off);
					}

				});
				particleSystem.eachEdge(function(edge, pt1, pt2) {

					// ctx.strokeStyle = "rgba(0,0,0, .333)";
					var color = edge.data.color;

					// ctx.strokeStyle = "green";
					// ctx.lineWidth = 2;
					// ctx.beginPath();
					// ctx.moveTo(pt1.x, pt1.y);
					// ctx.lineTo(pt2.x, pt2.y);
					// ctx.stroke();
					var tail = intersect_line_box(pt1, pt2, nodeBoxes[edge.source.name]);
					var head = intersect_line_box(tail, pt2, nodeBoxes[edge.target.name]);

					ctx.save();
					ctx.beginPath();
					ctx.lineWidth = 1;
					ctx.strokeStyle = (color) ? color : "#cccccc";
					ctx.fillStyle = null;

					ctx.moveTo(tail.x, tail.y);
					ctx.lineTo(head.x, head.y);
					ctx.stroke();
					ctx.restore();

					// draw an arrowhead if this is a -> style edge
					if (edge.data.directed) {
						ctx.save();
						// move to the head position of the edge we just drew
						var wt = 2;
						var arrowLength = 6 + wt;
						var arrowWidth = 2 + wt;
						ctx.fillStyle = (color) ? color : "#cccccc";
						ctx.translate(head.x, head.y);
						ctx.rotate(Math.atan2(head.y - tail.y, head.x - tail.x));

						// delete some of the edge that's already there (so the
						// point isn't hidden)
						ctx.clearRect(-arrowLength / 2, -wt / 2, arrowLength / 2, wt)

						// draw the chevron
						ctx.beginPath();
						ctx.moveTo(-arrowLength, arrowWidth);
						ctx.lineTo(0, 0);
						ctx.lineTo(-arrowLength, -arrowWidth);
						ctx.lineTo(-arrowLength * 0.8, -0);
						ctx.closePath();
						ctx.fill();
						ctx.restore();
					}
				});
			},

			initMouseHandling : function() {
				var dragged = null;

				var handler = {
					clicked : function(e) {
						var pos = $(canvas).offset();
						_mouseP = arbor.Point(e.pageX - pos.left, e.pageY - pos.top)
						dragged = particleSystem.nearest(_mouseP);

						if (dragged && dragged.node !== null) {
							dragged.node.fixed = true;
						}

						$(canvas).bind('mousemove', handler.dragged);
						$(window).bind('mouseup', handler.dropped);

						return false;
					},
					dragged : function(e) {
						var pos = $(canvas).offset();
						var s = arbor.Point(e.pageX - pos.left, e.pageY - pos.top);

						if (dragged && dragged.node !== null) {
							var p = particleSystem.fromScreen(s);
							dragged.node.p = p;
						}

						return false;
					},

					dropped : function(e) {
						if (dragged === null || dragged.node === undefined)
							return;

						if (dragged.node !== null)
							dragged.node.fixed = false;
						dragged.node.tempMass = 1000;
						dragged = null;
						$(canvas).unbind('mousemove', handler.dragged);
						$(window).unbind('mouseup', handler.dropped);
						_mouseP = null;
						return false;
					}
				};

				$(canvas).mousedown(handler.clicked);

			},

		}
		var intersect_line_line = function(p1, p2, p3, p4) {
			var denom = ((p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y));
			if (denom === 0)
				return false; // lines are parallel
			var ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
			var ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

			if (ua < 0 || ua > 1 || ub < 0 || ub > 1)
				return false
			return arbor.Point(p1.x + ua * (p2.x - p1.x), p1.y + ua * (p2.y - p1.y));
		};

		var intersect_line_box = function(p1, p2, boxTuple) {
			var p3 = {
				x : boxTuple[0],
				y : boxTuple[1]
			};
			var w = boxTuple[2];
			var h = boxTuple[3];

			var tl = {
				x : p3.x,
				y : p3.y
			};
			var tr = {
				x : p3.x + w,
				y : p3.y
			};
			var bl = {
				x : p3.x,
				y : p3.y + h
			};
			var br = {
				x : p3.x + w,
				y : p3.y + h
			};

			return intersect_line_line(p1, p2, tl, tr) || intersect_line_line(p1, p2, tr, br)
					|| intersect_line_line(p1, p2, br, bl) || intersect_line_line(p1, p2, bl, tl) || false
		}
		return that;
	}

	return {
		Renderer : Renderer,

	}
});