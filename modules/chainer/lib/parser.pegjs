/* parser.pegjs */

{
	/**
	 *	symbol types
	 */
	var TYPE_LCON = "connective"
	var TYPE_PROP = "proposition"
	var TYPE_ATOM = "atomic"
	var TYPE_CONS = "constant"

	/**
	 *	special symbols
	 */
	var SYMB_IMPL = "→"
	var SYMB_DISJ = "∨"
	var SYMB_CONJ = "∧"
	var SYMB_NEGT = "¬"
	var SYMB_TRUE = "⊤"
	var SYMB_FALS = "⊥"

	/**
	 *	special symbols: TeX translation
	 */
	var SYMB_TO_TEX = {
		"→": "\\rightarrow ",
		"∨": "\\vee ",
		"∧": "\\wedge ",
		"¬": "\\neg ",
		"⊤": "\\top ",
		"⊥": "\\bot "
	}

	function Tree (symb, type, subtype, left, right)
	{
		this.symb = symb
		this.type = type
		this.subtype = subtype
		if (left) {
			this.left = left
			left.parent = this
		}
		if (right) {
			this.right = right
			right.parent = this
		}
		return this
	}

	Tree.prototype.split = function ()
	{
		if (!this.is_reducible) {
			return undefined
		}
		return {
			left: this.left,
			right: this.right,
			disj: this.symb === SYMB_DISJ
		}
	}

	Tree.prototype.is_reducible = function ()
	{
		if (this.symb === SYMB_DISJ ||
		    this.symb === SYMB_CONJ) {
			return true
		}
		/**
		 *	No need to walk left/right, NNF trees are either
		 *	irreducible or have a conjunction or disjunction
		 *	right at the root.
		 */
		return false
	}

	Tree.prototype.get_root_prop = function ()
	{
		if (this.subtype === TYPE_ATOM) {
			return { prop: this.symb }
		}
		if (this.symb === SYMB_NEGT &&
		    this.right.subtype === TYPE_ATOM) {
			return { prop_negt: this.right.symb }
		}
		return undefined
	}

	Tree.prototype.root_is_true = function ()
	{
		return this.symb === SYMB_TRUE
	}

	Tree.prototype.walk = function ()
	{
		var llb = ""
		var lrb = ""
		var rlb = ""
		var rrb = ""

		if (this.type === TYPE_PROP) {
			return this.symb
		}
		if (this.symb === SYMB_NEGT) {
			if (this.right.type !== TYPE_PROP &&
			    this.right.symb !== SYMB_NEGT) {
				rlb = "("
				rrb = ")"
			}
			return	this.symb+
				rlb+this.right.walk()+rrb
		}
		if (this.type === TYPE_LCON) {
			if (this.left.type !== TYPE_PROP &&
			    this.left.symb !== SYMB_NEGT) {
				llb = "("
				lrb = ")"
			}
			if (this.right.type !== TYPE_PROP &&
			    this.right.symb !== SYMB_NEGT) {
				rlb = "("
				rrb = ")"
			}
			return	llb+this.left.walk()+lrb+
				" "+this.symb+" "+
				rlb+this.right.walk()+rrb
		}
	}

	Tree.prototype.walk_tex = function ()
	{
		var output = this.walk().split("")
		var output_tex = ""
		for (i=0; i<output.length; i++) {
			output_tex += SYMB_TO_TEX[output[i]]
				?SYMB_TO_TEX[output[i]] :output[i]
		}
		return output_tex
	}

	Tree.prototype.nnf_impl = function ()
	{
		if (this.symb === SYMB_IMPL) {
			this.symb = SYMB_DISJ
			this.left = new Tree (
				SYMB_NEGT, TYPE_LCON, undefined,
				undefined, this.left
			)
		}

		if (this.left) {
			this.left.nnf_impl()
		}
		if (this.right) {
			this.right.nnf_impl()
		}

		return this
	}

	Tree.prototype.nnf_negt = function ()
	{
		if (this.symb === SYMB_NEGT) {
			switch (this.right.symb) {
			case SYMB_NEGT:
				this.symb = this.right.right.symb
				this.type = this.right.right.type
				this.subtype = this.right.right.subtype
				this.left = this.right.right.left
				this.right = this.right.right.right
				return this.nnf_negt()
				break
			case SYMB_DISJ:
				this.symb = SYMB_CONJ
				this.right.symb = SYMB_NEGT
				this.left = new Tree (
					SYMB_NEGT, TYPE_LCON, undefined,
					undefined, this.right.left
				)
				this.right.left = undefined
				break
			case SYMB_CONJ:
				this.symb = SYMB_DISJ
				this.right.symb = SYMB_NEGT
				this.left = new Tree (
					SYMB_NEGT, TYPE_LCON, undefined,
					undefined, this.right.left
				)
				this.right.left = undefined
				break
			case SYMB_TRUE:
				this.symb = SYMB_FALS
				this.type = this.right.type
				this.subtype = this.right.subtype
				this.left = undefined
				this.right = undefined
				break
			case SYMB_FALS:
				this.symb = SYMB_TRUE
				this.type = this.right.type
				this.subtype = this.right.subtype
				this.left = undefined
				this.right = undefined
				break
			}
		}

		if (this.left) {
			this.left.nnf_negt()
		}
		if (this.right) {
			this.right.nnf_negt()
		}

		return this
	}

	Tree.prototype.nnf = function ()
	{
		return this.nnf_impl().nnf_negt()
	}
}

start
	= implication

implication
	= left:disjunction "->" right:implication
		{ return new Tree(SYMB_IMPL,
			TYPE_LCON, undefined, left, right) }
	/ left:disjunction "→" right:implication
		{ return new Tree(SYMB_IMPL,
			TYPE_LCON, undefined, left, right) }
	/ disjunction

disjunction
	= left:conjunction [+∨] right:disjunction
		{ return new Tree(SYMB_DISJ,
			TYPE_LCON, undefined, left, right) }
	/ conjunction

conjunction
	= left:negation [*∧] right:conjunction
		{ return new Tree(SYMB_CONJ,
			TYPE_LCON, undefined, left, right) }
	/ negation

negation
	= [¬^] right:primary
		{ return new Tree(SYMB_NEGT,
			TYPE_LCON, undefined, undefined, right) }
	/ [¬^] right:negation
		{ return new Tree(SYMB_NEGT,
			TYPE_LCON, undefined, undefined, right) }
	/ primary

primary
	= [T⊤]
		{ return new Tree(SYMB_TRUE,
			TYPE_PROP, TYPE_CONS, undefined, undefined) }
	/ [F⊥]
		{ return new Tree(SYMB_FALS,
			TYPE_PROP, TYPE_CONS, undefined, undefined) }
	/ symb:[a-z]
		{ return new Tree(symb,
			TYPE_PROP, TYPE_ATOM, undefined, undefined) }
	/ "(" symb:implication ")"
		{ return symb }
