import React from 'react'
import ReactDOM from 'react-dom';
import {render} from 'react-dom'

import BreadLoaf from '../../src'
import '../../src/bread.css'
import './demo.css'



class Slice extends React.Component {
	componentDidMount(){
		// this.loop = requestAnimationFrame(this.frame.bind(this))
		this.componentDidUpdate()
	}
	componentWillUnmount(){
		cancelAnimationFrame(this.loop)
	}
	frame(){
		try {
			var c = this.canvas;
			c.width = c.width;
			this.fn((Date.now() - this.start)/1000)
		} catch (err) {
			this.setError(err)
		}
		this.loop = requestAnimationFrame(this.frame.bind(this))
	}
	setError(err){
		var c = this.canvas,
			x = c.getContext('2d');
		c.width = c.width;
		x.font = '20px sans-serif'
		x.textBaseline = 'top'
		x.fillStyle = 'red'
		x.fillText(err, 50, 50)
		console.error(err)
	}
	componentDidUpdate(prevProps){
		if(prevProps && prevProps.view.text === this.props.view.text) return;

		var c = this.canvas,
			x = c.getContext('2d');
		var C = Math.cos,
			S = Math.sin,
			T = Math.tan;
		function R(r,g,b,a){
			return 'rgba(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ',' + a + ')'
		}
		this.start = Date.now()
		// this.fn = new Function('t', this.props.view.text)
		try {
			this.fn = eval('(function(t){' + this.props.view.text + '})')
		} catch (err) {
			this.fn = function(){}
			this.setError(err)
		}
		
	}
	render(){
		return <div className="slice">
			<div className="slice-header" onMouseDown={this.props.beginDrag}>
				<div style={{flexGrow: 1}}>drag to move this</div>

				<button onClick={this.props.fork}>fork</button>
				<button onClick={this.props.close}>&times;</button>
			</div>
			<div style={{ display: 'flex', overflow: 'hidden' }}>
				<textarea 
					style={{ width: '50%', minWidth: '50%', border: 0, padding: 10, fontFamily: 'Menlo, monospace', outline: 0 }}
					value={this.props.view.text || ''} 
					onInput={e => this.props.updateView({ text: e.target.value}) } />
				<canvas 
					width={400}
					height={225}
					style={{ width: 400, height: 225, borderLeft: '1px solid #ddd' }}
					ref={c => this.canvas = c} />
			</div>
		</div>
	}
}




class Demo extends React.Component {
	// state = { layout: [] };


	state = {
		// data: ["Ratchet & Clank", "Going Commando", "Up Your Arsenal", "Ratchet: Deadlocked", "Tools of Destruction", "Quest for Booty", "A Crack in Time", "Into the Nexus"],
		layout: [{ rowId: 1, items: [{ id: 42, text: `

c.width^=0;
var s, j;
for(var i=9;i<2e3;i+=2){
s=3/(9.1-(t+i/99)%9);
x.beginPath();
j=i*7+S(i*4+t+S(t));
x.lineWidth=s*s;
x.arc(960/6,540/6,s*49,j,j+.6);
x.stroke()
}

			` }]}]
	}

	render() {

	
    return <div>
    	<div className="header">
      		<h1>BreadLoaf Demo</h1>
      	</div>
    
    	<BreadLoaf 
    		ref={e => this.loaf = e} 
    		layout={this.state.layout}
    		updateLayout={e => this.setState({ layout: e })}
    		element={
    			<Slice />
    		}
    		 />

    </div>

    // footer={
				// <div className="fake-row row-1" onClick={e => this.loaf.append({})}>
				// 	<span>
				// 		<div className="bread-col">
				// 			<div className="fake-slice">+</div>
				// 		</div>
				// 	</span>
				// </div>
    // 		}
   
  }
}




render(<Demo/>, document.querySelector('#demo'))
