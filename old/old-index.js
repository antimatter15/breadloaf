import React from 'react'
import ReactDOM from 'react-dom';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group' // ES6
import FlipMove from 'react-flip-move';


// export default class Breadloaf extends React.Component {
// 	render(){
// 		console.log(this.props.children)
// 		return <div>hello</div>
// 	}
// }



function square(x) { return x * x }
function distSquared(v, w) { return square(v.x - w.x) + square(v.y - w.y) }
function distToSegmentSquared(p, v, w) {
    var l2 = distSquared(v, w);
    if (l2 == 0) return distSquared(p, v);
    var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return distSquared(p, { x: v.x + t * (w.x - v.x),
                      y: v.y + t * (w.y - v.y) });
}
function distToSegment(p, v, w) {
	return Math.sqrt(distToSegmentSquared(p, v, w)); 
}

function uuid(){
	return Math.random().toString(36).slice(5, 10)
}




// export default class Breadloaf2 extends React.Component {
// 	constructor(){
// 		super()
// 		this.state = { dragTarget: null, dockTarget: null }
// 		this.onDrag = this.onDrag.bind(this)
// 		this.endDrag = this.endDrag.bind(this)
// 	}

// 	beginDrag(monitor){
// 		this.setState({ dragTarget: monitor })
// 		window.addEventListener('onDrag', this.onDrag)
// 		window.addEventListener('mousemove', this.endDrag)
// 	}

// 	onDrag(e){
// 		if(this.state.dragTarget) e.preventDefault();

// 	}
// }


function computeLines(el){
	var rows = el.querySelectorAll('.row');
	var lines = []
	for(var i = 0; i < rows.length; i++){
		var rect = rows[i].getBoundingClientRect()
		if(i === 0){
			lines.push({
				x0: rect.left, x1: rect.right,
				y0: rect.top, y1: rect.top,
				pos: 'top-' + i
			})
		}
		lines.push({
			x0: rect.left, x1: rect.right,
			y0: rect.bottom, y1: rect.bottom,
			pos: 'bottom-' + i
		})

		var slices = rows[i].querySelectorAll('.slice');
		for(var j = 0; j < slices.length; j++){
			var rect = slices[j].getBoundingClientRect()
			if(j === 0){
				lines.push({
					x0: rect.left, x1: rect.left,
					y0: rect.top, y1: rect.bottom,
					pos: 'left-' + i + '-' + j
				})	
			}
			lines.push({
				x0: rect.right, x1: rect.right,
				y0: rect.top, y1: rect.bottom,
				pos: 'right-' + i + '-' + j
			})
		}
	}		
	return lines;
}

function getRect(el, i, j){
	var rows = el.querySelectorAll('.row');
	var slices = rows[i].querySelectorAll('.slice');
	var rect = slices[j].getBoundingClientRect()
	return rect;
}


// class Bread extends React.Component {
export default class Breadloaf extends React.Component {
	constructor(){
		super()
		this.state = { dragTarget: null }
		this.onDrag = this.onDrag.bind(this)
		this.endDrag = this.endDrag.bind(this)
	}
	beginDrag(thing, e){
		this.setState({ dragTarget: thing })
		window.addEventListener('mousemove', this.onDrag)
		window.addEventListener('mouseup', this.endDrag)
	}

	onDrag(e){
		if(this.state.dragTarget) e.preventDefault();

		var clientY = e.clientY;
		var el = ReactDOM.findDOMNode(this);
		
		var thingRect = getRect(el, this.state.dragTarget.split('-')[0], this.state.dragTarget.split('-')[1]);
		var lines = computeLines(el)

		lines.forEach(k => {
			k.dist = distToSegment(
				{ x: e.clientX, y: e.clientY }, 
				{ x: k.x0, y: k.y0 }, 
				{ x: k.x1, y: k.y1 })
		})

		var closestPos = lines.sort((a, b) => a.dist - b.dist)[0].pos
		var thing = this.state.dragTarget.split('-');

		if(e.clientX > thingRect.left && e.clientX < thingRect.right
			&& e.clientY > thingRect.top && e.clientY < thingRect.bottom){

			closestPos = (+thing[1] == 0) ? 
				('left-' + thing.join('-')) : 
				('right-' + [thing[0], thing[1] - 1].join('-'))
		}

		if(this.state.dockTarget !== closestPos){
			this.setState({ dockTarget: closestPos })
		}
	}
	cloneLayout(){
		return this.props.layout.map(row => {
			return { id: row.id, elements: row.elements.slice(0) }
		})
	}
	endDrag(e){
		
		if(this.state.dockTarget){
			var pos = this.state.dockTarget.split('-');
			var thing = this.state.dragTarget.split('-');

			var nextRows = this.cloneLayout();
			

			if(pos[0] === 'top' || pos[0] === 'bottom'){
				if((nextRows[+thing[0]].elements.length == 1) &&
					((pos[0] === 'top'  && +thing[0] === +pos[1]) || 
					(pos[0] === 'bottom' && +thing[0] === parseInt(pos[1])+1) ||
					(pos[0] === 'bottom' && +thing[0] === +pos[1]) )
				){
				}else{
					var oldThing = nextRows[+thing[0]].elements.splice(+thing[1], 1)[0];
					var newRow = { id: uuid(), elements: [ oldThing ] }
					if(pos[0] === 'top'){
						nextRows.splice(+pos[1], 0, newRow)
					}else{
						nextRows.splice(1 + parseInt(pos[1]), 0, newRow)
					}	
				}
			}else if(pos[0] === 'left' || pos[0] === 'right'){
				// swap it with null
				var oldThing = nextRows[+thing[0]].elements.splice(+thing[1], 1, null)[0];

				if(pos[0] === 'left'){
					nextRows[+pos[1]].elements.splice(+pos[2], 0, oldThing)
				}else{
					nextRows[+pos[1]].elements.splice(1 +parseInt(pos[2]), 0, oldThing)
				}
				// actually remove the thing
				nextRows[+thing[0]].elements = nextRows[+thing[0]].elements.filter(k => k !== null)

			}

			nextRows = nextRows.filter(k => k.elements.length > 0)

			this.props.updateLayout(nextRows)
		}



		this.setState({
			dragTarget: null,
			dockTarget: null
		})

		window.removeEventListener('mousemove', this.onDrag)
		window.removeEventListener('mouseup', this.endDrag)
	}

	render(){
		var Slice = this.props.Slice;
		return <div className="bread" style={{ cursor: this.state.dragTarget ? 'move' : 'default' }}>
		<FlipMove>
		{this.props.layout.map((row, rowi) => 
			<div className={"row " + (
				(this.state.dockTarget === ('top-' + rowi) ? 'insert-top ' : '') +
				(this.state.dockTarget === ('bottom-' + rowi) ? 'insert-bottom ' : '') +
				('row-' + row.elements.length + ' ')
			)} key={row.id}>
			<ReactCSSTransitionGroup
	          transitionName="example"
	          transitionEnterTimeout={300}
	          transitionLeaveTimeout={300}>

			{row.elements.map((data, coli) => 
				<div className={"col " + (
					(this.state.dockTarget === ('left-' + rowi + '-' + coli) ? 'insert-left ' : '') +
					(this.state.dockTarget === ('right-' + rowi + '-' + coli) ? 'insert-right ' : '')
				)} key={data.id}>
					<Slice view={data} 
					isDragging={this.state.dragTarget === [rowi, coli].join('-')}
					getView={id => {
						var result;
						this.props.layout.forEach(row => row.elements.forEach(data => {
							if(data.id == id) result = data;
						}))
						return result;
					}}
					fork={e => {
						var newRows = this.cloneLayout().rows;
						newRows[rowi].elements.splice(coli + 1, 0, Object.assign({}, data, { id: uuid() }) )
						this.props.updateLayout(newRows)
					}}
					update={e => {
						var newRows = this.cloneLayout().rows;
						newRows[rowi].elements[coli] = Object.assign({}, data, e)
						this.props.updateLayout(newRows)
					}}
					close={e => {
						var newRows = this.cloneLayout().rows;
						newRows[rowi].elements.splice(coli, 1)
						this.props.updateLayout(newRows.filter(k => k.elements.length > 0))
					}}
					beginDrag={
						e => this.beginDrag([rowi, coli].join('-'), e)
					} 
					{...this.props} />
				</div>
			)}
			</ReactCSSTransitionGroup>
			</div>
		)}

		<div className="fake-row row-1" onClick={e => 
			this.props.updateLayout(this.props.layout.concat([{ id: uuid(), elements: [{ id: uuid() }] }]))}>
			<span>
				<div className="col">
					<div className="fake-slice">+</div>
				</div>
			</span>
		</div>

		</FlipMove>
		</div>
	}
}
