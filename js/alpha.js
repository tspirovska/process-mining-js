requirejs.config({
	baseUrl : 'js',
	paths : {
		"jquery" : "../jquery/jquery",
		"jquery.bootstrap" : "../bootstrap/bootstrap.min"
	},
	shim : {
		"jquery.bootstrap" : {
			deps : [ "jquery" ]
		}
	}
});

define([ "jquery", "jquery.bootstrap", "utilities", "renderer" ], function($, bootstrap, util, renderer) {

	function Alpha(traces) {
		this.traces = traces;
		this.T = {
			tasks : [],
			input : [],
			output : []
		};
		this.fp = [];
		this.xSet = [];
		this.ySet = [];
		this.pSet = [];
		this.fSet = [];

		this.init = function() {
			var act = [];
			for (var i = 0; i < this.traces.length; i++) {
				var log = this.traces[i];
				this.T.input.push(log[0]);
				this.T.output.push(log[log.length - 1]);
				act = act.concat(log.split(''));

			}
			this.T.tasks = util.removeDuplicates(act).sort();
			this.T.input = util.removeDuplicates(this.T.input);
			this.T.output = util.removeDuplicates(this.T.output);

		};
		var initializeFootprint = function(that) {
			var alphabet = that.T.tasks;
			for (var i = 0; i < alphabet.length; i++) {
				var row = [];
				for (var j = 0; j < alphabet.length; j++) {
					row.push("#");
				}
				that.fp.push(row);
			}
		};
		this.createFootprint = function() {

			var alphabet = this.T.tasks;

			initializeFootprint(this);

			for (var i = 0; i < this.traces.length; i++) {
				var log = this.traces[i];
				for (var j = 0; j < log.length - 1; j++) {
					var a1 = log[j];
					var a2 = log[j + 1];

					var p1 = alphabet.indexOf(a1);
					var p2 = alphabet.indexOf(a2);

					if (this.fp[p1][p2] == '#') {
						this.fp[p1][p2] = '>';
						this.fp[p2][p1] = '<';
					} else if (this.fp[p1][p2] == '<') {
						this.fp[p1][p2] = '|';
						this.fp[p2][p1] = '|';
					}
				}
			}
		};
		this.printFootprint = function() {
			var fpstr = "";

			for (var i = 0; i < this.fp.length; i++) {
				fpstr += "\n";
				for (var j = 0; j < this.fp.length; j++) {
					fpstr += this.fp[i][j] + "\t";
				}
			}
			$('#output').val($('#output').val() + fpstr);

		};

		this.step4Part1 = function(list, pair, ind) {

			var contains = false;
			for (var j = 0; j < list.length; j++) {
				var elem = list[j];
				if (elem[ind] == pair[ind]) {
					var index = (ind + 1) % 2;
					list[j][index].push(pair[index]);
					contains = true;
				}
			}

			if (!contains) {
				if (ind == 0) {
					list.push([ pair[0], [ pair[1] ] ]);
				} else {
					list.push([ [ pair[0] ], pair[1] ]);
				}
			}
		};

		this.step4Part2 = function(pair, mode) {

			var val;
			var set;

			val = pair[(mode) % 2];
			set = pair[(mode + 1) % 2];

			var cond = true;
			for (var j = 0; j < set.length; j++) {
				var pos1 = this.T.tasks.indexOf(val);
				var pos2 = this.T.tasks.indexOf(set[j]);
				var mat;
				if (mode == 0) {
					mat = this.fp[pos1][pos2];
				} else {
					mat = this.fp[pos2][pos1];
				}
				if (mat != ">") {
					cond = false;
				}
				if (cond == false) {
					break;
				}
			}

			for (var j = 0; (j < set.length) && cond; j++) {
				for (var k = 0; k < set.length && cond; k++) {
					var pos1 = this.T.tasks.indexOf(set[j]);
					var pos2 = this.T.tasks.indexOf(set[k]);
					if (this.fp[pos1][pos2] != "#") {
						cond = false;
					}
				}
			}

			if (cond) {
				var newPair = null;
				var inComplex = true;
				if (mode == 0) {
					if (pair[1].length == 1) {
						newPair = [ pair[0], pair[1][0] ];
						if (util.findInArray(this.xSet, newPair) == -1) {
							this.xSet.push(newPair);
						}
						inComplex = false;
					}
				} else {
					newPair = [ pair[0][0], pair[1] ];
					if (pair[0].length == 1) {

						if (util.findInArray(this.xSet, newPair) == -1) {
							this.xSet.push(newPair);
						}
						inComplex = false;
					}
				}

				if (inComplex) {
					if (util.findInArray(this.xSet, newPair)) {
						this.xSet.push(pair);
					}
				}
			}

		};

		this.createYL = function() {

			this.ySet = util.cloneObject(this.xSet);
			var i = 0;
			var end = false;
			while (!end && i < this.ySet.length) {
				var pair = this.ySet[i];
				var j = i + 1;
				var erase = false;
				while (!erase && j < this.ySet.length) {
					if (util.checkSubset(pair, this.ySet[j])) {
						this.ySet.splice(i, 1);
						i--;
						erase = true;
					} else if (util.checkSubset(this.ySet[j], pair)) {
						this.ySet.splice(j, 1);
						j--;
					}
					j++;
				}
				i++;
			}
		};

		this.createXL = function() {
			var TL = this.T.tasks;
			var list = [];

			for (var i = 0; i < this.fp.length; i++) {
				for (var j = 0; j < this.fp.length; j++) {

					if (this.fp[i][j] == '>') {
						list.push([ TL[i], TL[j] ]);
					}
				}
			}
			var xl = [];

			var list1 = [];
			var list2 = [];

			for (var i = 0; i < list.length; i++) {
				var pair = list[i];
				this.step4Part1(list1, pair, 0);
				this.step4Part1(list2, pair, 1);
			}
			xl = xl.concat(list1);
			xl = xl.concat(list2);
			this.checkSet(xl);
		};

		this.textToOutput = function(text, val) {
			if (text == undefined) {
				text = "";
			}
			if (val == undefined) {
				val = "";
			}
			$('#output').val($('#output').val() + text + val + "\n");

		}
		this.printOutput = function() {
			this.textToOutput("Starting algorithm ... \n \nStep 1: Creating T set ...\n\n\tT = ", util
					.string(this.T.tasks));
			this.textToOutput();
			this.textToOutput("Step 2: Creating To set ...\n\n\tTi = ", util.string(this.T.output));
			this.textToOutput();
			this.textToOutput("Step 3: Creating Ti set ...\n\n\tTi = ", util.string(this.T.input));
			this.textToOutput();
			this.textToOutput("Step 4: Creating footprint and X set  ...\n\n\tFootprint : => ");
			this.printFootprint();
			this.textToOutput();
			this.textToOutput("\n\tX = " + util.string(this.xSet));
			this.textToOutput();
			this.textToOutput("Step 5: Creating Y set ...\n\n\tY = " + util.string(this.ySet));
			this.textToOutput();

			this.textToOutput("Step 6: Creating P set ...\n\n\tP = " + util.string(this.pSet));
			this.textToOutput();
			this.textToOutput("Step 7: Creating F set ...\n\n\tF = " + util.string(this.fSet));
			this.textToOutput();
			this.textToOutput("Step 8: Alpha(L)=(P,T,F)");
		};
		this.runAlgorithm = function() {

			this.init();
			this.createFootprint();

			this.createXL();
			this.createYL();
			this.createPlSet();
			this.createFSet();
			this.createProcessModel();
		};

		this.checkSet = function(set) {
			this.xSet = [];

			for (var i = 0; i < set.length; i++) {
				var pair = set[i];
				if (pair[1] instanceof Array) {
					this.step4Part2(pair, 0);

				} else {
					this.step4Part2(pair, 1);
				}
			}
		};

		this.createPlSet = function() {

			for (var i = 0; i < this.ySet.length; i++) {
				var elem = "P{" + this.ySet[i][0] + "},{" + this.ySet[i][1] + "}";
				this.pSet.push(elem);
			}
			this.pSet.push("I");
			this.pSet.push("O");
		};

		this.createFSet = function() {
			for (var i = 0; i < this.ySet.length; i++) {

				for (var j = 0; j < this.ySet[i][0].length; j++) {
					this.fSet.push([ this.ySet[i][0][j], this.pSet[i] ]);
				}

				for (var j = 0; j < this.ySet[i][1].length; j++) {
					this.fSet.push([ this.pSet[i], this.ySet[i][1][j] ]);
				}
			}

			for (var i = 0; i < this.T.input.length; i++) {
				this.fSet.push([ "I", this.T.input[i] ]);
			}

			for (var i = 0; i < this.T.output.length; i++) {
				this.fSet.push([ this.T.output[i], "O" ]);
			}

		};

		this.createProcessModel = function() {

			var sys = arbor.ParticleSystem(1000, 800, 0);
			sys.parameters({
				gravity : false
			});
			sys.renderer = renderer.Renderer("#viewport");

			this.graph = {
				nodes : {},
				edges : {}
			};
			for (var i = 0; i < this.T.tasks.length; i++) {
				var name = this.T.tasks[i];
				var data = {
					"color" : "#FFAD5C",
					"shape" : "square"
				};

				sys.addNode(name, data);
			}

			for (var i = 0; i < this.pSet.length; i++) {
				var name = this.pSet[i];
				var data = {
					"color" : "#BFD4FF",
					"shape" : "circle"
				};
				sys.addNode(name, data);
			}
			for (var i = 0; i < this.fSet.length; i++) {
				var data = {
					"color" : "#636354",
					"directed" : true
				};
				sys.addEdge(this.fSet[i][0], this.fSet[i][1], data);
			}
		};

		this.clearAll = function() {
			this.traces = traces;
			this.T = {
				tasks : [],
				input : [],
				output : []
			};
			this.fp = [];
			this.xSet = [];
			this.ySet = [];
			this.pSet = [];
			this.fSet = [];
		};
	}

	$(function() {

		$('#model-id').hide();

		$('#output-tab a').click(function(e) {
			e.preventDefault();
			$(this).tab('show');
			$('#output-form').show();
			$('#model-id').hide();
		});
		$('#model-tab a').click(function(e) {
			e.preventDefault();
			$(this).tab('show');
			$('#output-form').hide();
			$('#model-id').show();
		});

		$('#btn-logs').click(function() {

			var text = $('#input').val();
			var traces = text.split(' ');
			$('#output').val("");

			var alpha = new Alpha(traces);
			alpha.clearAll();
			alpha.runAlgorithm();
			alpha.printOutput();
		});

	});

	return {
		Alpha : Alpha
	};
});

// abef abecdbf abcedbf abcdebf aebcdbf
// acd bcd ace bce
// abcdefbdceg abdceg abcdefbcdefbdceg
// abcd acbd aed
