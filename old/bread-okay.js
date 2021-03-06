import React from 'react'
import ReactDOM from 'react-dom';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group' // ES6
import FlipMove from 'react-flip-move';

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

		var slices = rows[i].querySelectorAll('.col');
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


export default class BreadLoaf extends React.Component {
	constructor(){
		super()
		this.state = { dragObject: null, dockTarget: null, layout: [] }
		this.onDrag = this.onDrag.bind(this)
		this.endDrag = this.endDrag.bind(this)
	}

	beginDrag(thing, e){
		this.setState({ dragObject: thing })
		window.addEventListener('mousemove', this.onDrag)
		window.addEventListener('mouseup', this.endDrag)
	}

	onDrag(e){
		if(this.state.dragObject) e.preventDefault();

		var clientY = e.clientY;
		var el = ReactDOM.findDOMNode(this);
		var pos = this.state.dragObject.split('-');
		var thingRect = getRect(el, pos[0], pos[1]);
		var lines = computeLines(el)

		lines.forEach(k => 
			k.dist = distToSegment({ x: e.clientX, y: e.clientY }, 
				{ x: k.x0, y: k.y0 }, { x: k.x1, y: k.y1 }))

		var closestPos = lines.sort((a, b) => a.dist - b.dist)[0].pos
		

		if(e.clientX > thingRect.left && e.clientX < thingRect.right
			&& e.clientY > thingRect.top && e.clientY < thingRect.bottom){

			closestPos = (+pos[1] == 0) ? 
				('left-' + pos.join('-')) : 
				('right-' + [pos[0], pos[1] - 1].join('-'))
		}

		if(this.state.dockTarget !== closestPos)
			this.setState({ dockTarget: closestPos });
	}

	cloneLayout(){
		return this.getLayout().map(row => {
			return { rowId: row.rowId, items: row.items.slice(0) }
		})
	}

	updateLayout(data){
		if(this.props.layout){
			this.props.updateLayout(data)
		}else{
			this.setState({ layout: data })
		}
	}
	getLayout(){
		if(this.props.layout){
			return this.props.layout;
		}else{
			return this.state.layout;
		}
	}

	endDrag(e){
		if(this.state.dockTarget){
			var pos = this.state.dockTarget.split('-');
			var thing = this.state.dragObject.split('-');
			var nextRows = this.cloneLayout();
			var anchor = pos[0];
			var i = +thing[0], j = +thing[1];

			if(anchor === 'top' || anchor === 'bottom'){
				if((nextRows[i].items.length == 1) &&
					((anchor === 'top'  && i === +pos[1]) || 
					(anchor === 'bottom' && i === parseInt(pos[1])+1) ||
					(anchor === 'bottom' && i === +pos[1]) )
				){
				}else{
					if(e.altKey){
						// don't remove the old one, just make a copy
						var oldThing = Object.assign({}, nextRows[i].items[j], { id: uuid() })
					}else{
						var oldThing = nextRows[i].items.splice(j, 1)[0];	
					}
					
					var newRow = { rowId: uuid(), items: [ oldThing ] }
					if(anchor === 'top'){
						nextRows.splice(+pos[1], 0, newRow)
					}else{
						nextRows.splice(1 + parseInt(pos[1]), 0, newRow)
					}	
				}
			}else if(anchor === 'left' || anchor === 'right'){
				if(e.altKey){
					// don't remove the old one, just make a copy
					var oldThing = Object.assign({}, nextRows[i].items[j], { id: uuid() })
				}else{
					// swap it with null
					var oldThing = nextRows[i].items.splice(j, 1, null)[0];	
				}
				if(anchor === 'left'){
					nextRows[+pos[1]].items.splice(+pos[2], 0, oldThing)
				}else{
					nextRows[+pos[1]].items.splice(1 +parseInt(pos[2]), 0, oldThing)
				}
				// actually remove the thing
				nextRows[i].items = nextRows[i].items.filter(k => k !== null)
			}

			nextRows = nextRows.filter(k => k.items.length > 0)
			this.updateLayout(nextRows)
		}
		this.setState({ dragObject: null, dockTarget: null })
		window.removeEventListener('mousemove', this.onDrag)
		window.removeEventListener('mouseup', this.endDrag)
	}

	render(){
		return <div className="bread" style={{ cursor: this.state.dragObject ? 'move' : 'default' }}><FlipMove>
		{this.getLayout().map((row, rowi) => 
			<div className={"row " + (
				(this.state.dockTarget === ('top-' + rowi) ? 'insert-top ' : '') +
				(this.state.dockTarget === ('bottom-' + rowi) ? 'insert-bottom ' : '') +
				(row.items.length > 1 ? '' : 'row-1')
			)} key={row.rowId}>
				<ReactCSSTransitionGroup
		          transitionName="example"
		          transitionEnterTimeout={300}
		          transitionLeaveTimeout={300}>
					{row.items.map((data, coli) => 
						<div className={"col " + (
							(this.state.dockTarget === ('left-' + rowi + '-' + coli) ? 'insert-left ' : '') +
							(this.state.dockTarget === ('right-' + rowi + '-' + coli) ? 'insert-right ' : '')
						)} key={data.id}>{
							React.cloneElement(this.props.children, {
								isDragging: this.state.dragObject === rowi + '-' + coli,
								view: data,
								layout: this.getLayout(),
								pos: [rowi, coli],
								updateView: d => {
									var newRows = this.cloneLayout()
									newRows[rowi].items[coli] = Object.assign({}, data, d)
									this.updateLayout(newRows)
								},
								close: d => {
									var newRows = this.cloneLayout()
									newRows[rowi].items.splice(coli, 1)
									this.updateLayout(newRows)
								},
								fork: d => {
									var newRows = this.cloneLayout()
									newRows[rowi].items.splice(coli + 1, 0, Object.assign({}, data, { id: uuid() }) )
									this.updateLayout(newRows)
								},
								beginDrag: e => this.beginDrag(rowi + '-' + coli, e)
							})
						}</div>
					)}
				</ReactCSSTransitionGroup>
			</div>
		)}		
		</FlipMove></div>
	}
}
