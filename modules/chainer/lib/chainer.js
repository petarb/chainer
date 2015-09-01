/* main.js */

var PARSER = require('./parser.js')

function Formula (input)
{
	this.input_raw = input
	this.input = input.replace(/\s+/g, "")
	if (!this.input) {
		this.empty = true
		return
	}
	try {
		this.tree_raw = PARSER.parse(this.input)
	}
	catch (e) {
		this.error_raw = e.message
		this.error = this.uunescape(e.message)
		this.broken = true
		return
	}
	this.tree = PARSER.parse(this.input).nnf()
	this.output_raw = this.tree_raw.walk()
	this.output_tex = this.tree.walk_tex()
	this.output = this.tree.walk()
}

Formula.prototype.uunescape = function (str)
{
	if (!str) {
		return undefined
	}
	str = str.replace(/\\[ux]([\d\w]{2,4})/gi,
		function (match, grp) {
			return String.fromCharCode(parseInt(grp, 16))
		})
	/* PEG is escaping too much.. */
	str = str.replace(/\\(\^|\\)/g, "$1")
	return unescape(str)
}

Formula.prototype.clone = function ()
{
	return new Formula(this.tree.walk())
}

function Sequence (fms)
{
	var fm
	this.fms = new Array()
	for (var i in fms) {
		fm = new Formula(fms[i])
		if (fm.empty) {
			continue
		}
		this.fms.push(fm)
		if (fm.broken) {
			this.broken = true
		}
	}
	if (!this.fms.length) {
		this.empty = true
	}
}

Sequence.prototype.toString = function ()
{
	var str = "["
	for (var i in this.fms) {
		str += "{"
		str += this.fms[i].output
		str += "}"
	}
	str += "]"
	return str
}

Sequence.prototype.get_successor = function ()
{
	var df
	var sp
	var seq_a = new Sequence()
	var seq_b = new Sequence()

	if (df = this.get_dist_form()) {
		this.fms[df].dist = true
		sp = this.fms[df].tree.split()
		sp.fm_left = new Formula(sp.left.walk())
		sp.fm_right = new Formula(sp.right.walk())
		for (var i in this.fms) {
			if (i !== df) {
				seq_a.fms.push(this.fms[i].clone())
				seq_b.fms.push(this.fms[i].clone())
				continue
			}
			seq_a.fms.push(sp.fm_left)
			if (sp.disj) {
				seq_a.fms.push(sp.fm_right)
				continue
			}
			seq_b.fms.push(sp.fm_right)
		}
		if (sp.disj) {
			return new Array(seq_a)
		}
		return new Array(seq_a, seq_b)
	}
	return undefined
}

Sequence.prototype.is_reducible = function ()
{
	if (this.get_dist_form()) {
		return true
	}
	return false
}

Sequence.prototype.get_dist_form = function ()
{
	var df

	for (var i in this.fms) {
		if (this.fms[i].tree.is_reducible()) {
			df = i
		}
	}
	return df
}

Sequence.prototype.is_axiom = function ()
{
	var tmp
	var props = new Object()
	var props_negt = new Object()

	for (var i in this.fms) {
		if (this.fms[i].tree.root_is_true()) {
			this.fms[i].taut = true
			return true
		}
		if (tmp = this.fms[i].tree.get_root_prop()) {
			if (props[tmp.prop_negt]) {
				this.fms[i].taut = true
				props[tmp.prop_negt].taut = true
				return true
			}
			if (props_negt[tmp.prop]) {
				this.fms[i].taut = true
				props_negt[tmp.prop].taut = true
				return true
			}
			if (tmp.prop_negt) {
				props_negt[tmp.prop_negt] = this.fms[i]
			}
			if (tmp.prop) {
				props[tmp.prop] = this.fms[i]
			}
		}
	}
	return false
}

Sequence.prototype.get_valuation = function ()
{
	var tmp
	var props = new Object()

	if (this.is_reducible()) {
		return undefined
	}
	for (var i in this.fms) {
		if (tmp = this.fms[i].tree.get_root_prop()) {
			if (tmp.prop_negt) {
				props[tmp.prop_negt] = true
			}
			if (tmp.prop) {
				props[tmp.prop] = false
			}
		}
	}
	return props
}

Sequence.prototype.get_valuation_tex = function ()
{
	var props = this.get_valuation()
	var output = ""
	var list = ""

	if (!props) {
		return undefined
	}
	for (var i in props) {
		list += i+"|"+"\\text{"
		list += props[i] ?"t" :"f"
		list += "},\\ "
	}
	output += "\\bar{V}"
	output += list ?"_{("+list.substr(0, list.length-3)+")}" :""
	output += "(\\Gamma_{1}) = \\text{f}"
	return output
}

function Chain (seq)
{
	var sseq
	if (!seq || seq.broken) {
		this.broken = true
		return
	}
	this.root = seq
	if (seq.is_axiom()) {
		this.axiom = true
		return
	}
	if (seq.is_reducible()) {
		sseq = seq.get_successor()
		this.left = new Chain(sseq[0])
		if (!sseq[1]) {
			return
		}
		this.right = new Chain(sseq[1])
	}
}

Chain.prototype.log = function (path)
{
	if (!path) {
		path = ""
	}
	path += this.root
	if (this.left) {
		this.left.log(path+"\n")
	}
	if (this.right) {
		this.right.log(path+"\n")
	}
	if (!this.left && !this.right) {
		if (this.axiom) {
			path += " (axiom)"
		}
		console.log(path)
		console.log()
	}
}

function test_parser ()
{
	var fm = new Formula("^^a + b -> ^(c * T)")
	//var fm = new Formula("a + b + c + d + e + f + g")
	//var fm = new Formula("^^a + b -> ^(c * T) -> (d * ^(c + h) -> (f * g)) * T -> i")

	console.log()

	console.log(fm.input_raw)
	console.log()

	console.log(fm.output)
	console.log()
}

function test_chains ()
{
	//var chain = new Chain(new Sequence(["a", "^b", "a*b", "^^a + b -> ^(c * T)"]))
	//var chain = new Chain(new Sequence(["a*b"]))
	//var chain = new Chain(new Sequence(["a*b", "^b*c"]))
	//var chain = new Chain(new Sequence(["F + T", "(b * F) * (^a + T)"]))
	var chain = new Chain(new Sequence(["(c*T)+F", "T*(b+F)"]))

	console.log()
	chain.log()
}
