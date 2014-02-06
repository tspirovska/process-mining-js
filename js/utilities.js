requirejs.config({
	baseUrl : 'js',
});

define([], function() {

	function cloneObject(obj) {
		if (obj === null || typeof obj !== 'object') {
			return obj;
		}

		var temp = obj.constructor();
		for ( var key in obj) {
			temp[key] = cloneObject(obj[key]);
		}

		return temp;
	}

	function removeDuplicates(array) {
		var result = [];

		for (var i = 0; i < array.length; i++) {
			var elem = array[i];
			if (result.indexOf(elem) == -1) {
				result.push(elem);
			}
		}
		return result;
	}
	function findInArray(array, elem) {
		var cond = false;
		var i = 0;
		var index = -1;
		while (!cond && i < array.length) {
			if (elem instanceof Array) {
				if (array[i] instanceof Array) {
					if (elem.length == array[i].length) {
						var equal = true;
						for (var j = 0; j < elem.length; j++) {
							if (elem[j] != array[i][j]) {
								equal = false;
							}
						}
						if (equal) {
							cond = true;
							index = i;
						}
					}
				}
			} else {
				if (!(array[i] instanceof Array)) {
					if (array[i] == elem) {
						cond = true;
						index = i;
					}
				}
			}

			i++;

		}
		return index;
	}

	function checkSubset(element, set) {

		if (subset(element[0], set[0]) && subset(element[1], set[1])) {
			return true;
		}

		return false;
	}
	function subset(element, set) {
		if (element.lenght > set.length) {
			return false;
		}
		if (element instanceof Array) {
			if (set instanceof Array) {
				var same = true;
				var i = 0;

				while (same && i < element.length) {
					if (set.indexOf(element[i++]) == -1) {
						same = false;
						return false;
					}
				}
			} else {
				return false;
			}
		} else {
			if (set instanceof Array) {
				if (set.indexOf(element) == -1) {
					return false;
				}
			} else {
				if (element != set) {
					return false;
				}
			}
		}

		return true;

	}

	function string(val) {
		return JSON.stringify(val);
	}

	function findAllInArray(array, elem) {
		var i = 0;
		var indices = [];

		while (i < array.length) {
			if (elem instanceof Array) {
				if (array[i] instanceof Array) {
					if (elem.length == array[i].length) {
						var equal = true;
						for (var j = 0; j < elem.length; j++) {
							if (elem[j] != array[i][j]) {
								equal = false;
							}
						}
						if (equal) {
							indices.push(i);
						}
					}
				}
			} else {
				if (!(array[i] instanceof Array)) {
					if (array[i] == elem) {
						indices.push(i);
					}
				}
			}
			i++;
		}
		return indices;
	}

	return {
		cloneObject : cloneObject,
		removeDuplicates : removeDuplicates,
		removeDuplicates : removeDuplicates,
		findInArray : findInArray,
		checkSubset : checkSubset,
		subset : subset,
		string : string,
		findAllInArray : findAllInArray
	};

});