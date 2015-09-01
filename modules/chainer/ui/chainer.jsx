/* main.jsx */

var Formula = React.createClass ({
    render: function () {
        var cn = "fm-item"
        var output
        var items = new Array()
        if (!this.props.fm.broken) {
            cn += " fm-item-good"
            output = katex.renderToString(this.props.fm.output_tex)
            items = <span className={cn} dangerouslySetInnerHTML={{__html: output}} />
        }
        else {
            cn += " fm-item-bad"
            output = this.props.fm.input_raw
            if (output.length > 8) {
                output = output.substring(0, 7)
                output += "..."
            }
            output += ": "
            output += this.props.fm.error
            items = <span className={cn}>{output}</span>
        }
        return (
            <div className="Formula">
                {items}
            </div>
        )
    }
})

var Formulas = React.createClass ({
    render: function () {
        var items = new Array()
        this.props.seq.fms.forEach(function (fm) {
            items.push(<Formula fm={fm} />)
        })
        return (
            <div className="Formulas">
            {items}
            <Chains seq={this.props.seq} />
            </div>
        )
    }
})

Chainer.Chain.prototype.get_li = function (depth)
{
    var tmp = new Array()
    var items = new Array()
    var items_li = new Array()
    if (this.broken) {
        return items_li
    }
    items.push(
        <span className="fm-link fm-link-first"
            dangerouslySetInnerHTML={{__html:
                katex.renderToString("\\Gamma_{"+depth+"}")}} />
    )
    items.push(
        <span className="fm-link fm-link-second"
            dangerouslySetInnerHTML={{__html:
                katex.renderToString("=")}} />
    )
    this.root.fms.forEach(function (fm) {
        var tag = "fm-link"
        tag += fm.dist ?" fm-link-dist" :""
        tag += fm.taut ?" fm-link-taut" :""
        tag = tag ?tag :undefined
        items.push(
            <span className={tag}
                dangerouslySetInnerHTML={{__html:
                    katex.renderToString(fm.output_tex)}} />
        )
    })
    if (!this.left && !this.right) {
        if (this.axiom) {
            items.push(
                <span className="fm-link fm-link-axiom"
                    dangerouslySetInnerHTML={{__html:
                        katex.renderToString("\\text{axiom}")}} />
            )
        }
        else {
            items.push(
                <span className="fm-link fm-link-irred"
                    dangerouslySetInnerHTML={{__html:
                        katex.renderToString("\\text{irreducible}")}} />
            )
            items.push(
                <span className="fm-link fm-link-irred"
                    dangerouslySetInnerHTML={{__html:
                        katex.renderToString(this.root.get_valuation_tex())}} />
            )
        }
    }
    else {
        if (this.left) {
            tmp = tmp.concat(this.left.get_li(depth+1))
        }
        if (this.right) {
            tmp = tmp.concat(this.right.get_li(depth+1))
        }
        items.push(<ul>{tmp}</ul>)
    }
    items_li.push(<li className="fm-li">{items}</li>)
    return items_li
}

var ChainsTree = React.createClass ({
    shouldComponentUpdate: function (nprops, nstate) {
        return nprops.chs !== this.props.chs
    },
    render: function () {
        return (
            <div className="ChainsTree">
                <ul className="tree">
                    {this.props.chs.get_li(1)}
                </ul>
            </div>
        )
    }
})

var Chains = React.createClass ({
    getInitialState: function () {
        return ({ chs: new Chainer.Chain() })
    },
    handleClick: function () {
        this.setState({
            chs: new Chainer.Chain(this.props.seq)
        })
    },
    render: function () {
        var disabled =
            this.props.seq.broken ||
            this.props.seq.empty
        return (
            <div className="Chains">
            <button className="button-primary"
                onClick={this.handleClick} disabled={disabled}>
                Derive in PSC
            </button>
            <ChainsTree chs={this.state.chs} />
            </div>
        )
    }
})

var Editor = React.createClass ({
    getInitialState: function () {
        return ({ seq: new Chainer.Sequence() })
    },
    handleChange: function () {
        var input = React.findDOMNode(this.refs.textarea).value
        var list = input.replace(/\r/g, "").split(/\n/)
        var seq = new Chainer.Sequence(list)
        this.setState({
            seq: seq
        })
    },
    render: function () {
        return (
            <div className="Editor">
                <div className="row">
                    <textarea className="u-full-width"
                        ref="textarea" onChange={this.handleChange}
                        placeholder="One formula per line.." />
                </div>
                <div className="row">
                    <Formulas seq={this.state.seq} />
                </div>
            </div>
        )
    }
})

React.render(<Editor />, document.getElementById("Chainer"))

/* vim: set expandtab ts=4 sw=4 sts=4: */
