
function makeChildMap(children){
	var childrenByKey = {}
	children.forEach((child, i) => 
		childrenByKey[child.key || ('$index-' + i)] = child);
	return childrenByKey
}

function fixLayout(layout, childrenByKey){
	var realLayout = [];
	var foundKeys = {};
	layout.forEach(row => {
		var keys = [];
		row.keys.forEach(key => {
			if(key in foundKeys){
				// ignore duplicate keys
			}else if(key in childrenByKey){
				// ok so lets add this
				keys.push(key)
				foundKeys[key] = true;
			}else{
				// looks like we don't see the key
			}
		})
		if(keys.length > 0){
			realLayout.push({
				id: row.id,
				keys: keys
			})	
		}
	})
	for(let key in childrenByKey){
		if(key in foundKeys) continue;
		realLayout.push({
			id: 'row-' + key,
			keys: [ key ]
		})
	}
	return realLayout;
}

function getRect(el, i, j){
	var rows = el.querySelectorAll('.bread-row');
	var slices = rows[i].querySelectorAll('.bread-col');
	var rect = slices[j].getBoundingClientRect()
	return rect;
}

function findKey(layout, key){

}


function computeLines(el){
	var rows = el.querySelectorAll('.bread-row');
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

		var slices = rows[i].querySelectorAll('.bread-col');
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

class BreadLoaf2 extends React.Component {
	// state = { layout: [ { id: 'test', keys: ['Going Commando', 'Up Your Arsenal'] } ] };
	

	constructor(){
		super()
		this.state = { 
			dragObject: null,
			dropTarget: null,
			layout: [ { id: 'test', keys: ['Going Commando', 'Up Your Arsenal'] } ]
		}
		this.onDrag = this.onDrag.bind(this)
		this.endDrag = this.endDrag.bind(this)
	}


	beginDrag(pos, e){
		this.setState({ dragObject: pos })
		window.addEventListener('mousemove', this.onDrag)
		window.addEventListener('mouseup', this.endDrag)
	}

	onDrag(e){
		if(this.state.dragObject) e.preventDefault();

		var childrenByKey = makeChildMap(this.props.children);
		var layout = fixLayout(this.state.layout, childrenByKey);
		var clientY = e.clientY;
		var el = ReactDOM.findDOMNode(this);
		
		var dragPos = this.state.dragObject.split('-');
		var thingRect = getRect(el, dragPos[0], dragPos[1]);
		var lines = computeLines(el)

		lines.forEach(k => {
			k.dist = distToSegment(
				{ x: e.clientX, y: e.clientY }, 
				{ x: k.x0, y: k.y0 },  { x: k.x1, y: k.y1 })
		})

		var closestPos = lines.sort((a, b) => a.dist - b.dist)[0].pos

		if(e.clientX > thingRect.left && e.clientX < thingRect.right
			&& e.clientY > thingRect.top && e.clientY < thingRect.bottom){

			closestPos = (+dragPos[1] == 0) ? 
				('left-' + dragPos.join('-')) : 
				('right-' + [dragPos[0], dragPos[1] - 1].join('-'))
		}

		if(this.state.dockTarget !== closestPos){
			this.setState({ dockTarget: closestPos })
		}

	}

	endDrag(e){
		if(this.state.dockTarget){
			var pos = this.state.dockTarget.split('-');
			var obj = this.state.dragObject.split('-');

			var childrenByKey = makeChildMap(this.props.children);
			var nextRows = fixLayout(this.state.layout, childrenByKey);
			
			var i = +obj[0], j = +obj[1];

			var anchor = pos[0];
			if(anchor === 'top' || anchor === 'bottom'){
				if((nextRows[i].keys.length == 1) &&
					((anchor === 'top'  && i === +pos[1]) || 
					(anchor === 'bottom' && i === parseInt(pos[1])+1) ||
					(anchor === 'bottom' && i === +pos[1]) )
				){
				}else{
					var oldThing = nextRows[i].keys.splice(j, 1)[0];
					var newRow = { id: uuid(), keys: [ oldThing ] }
					if(anchor === 'top'){
						nextRows.splice(+pos[1], 0, newRow)
					}else{
						nextRows.splice(1 + parseInt(pos[1]), 0, newRow)
					}	
				}
			}else if(anchor === 'left' || anchor === 'right'){
				// swap it with null
				var oldThing = nextRows[i].keys.splice(j, 1, null)[0];

				if(anchor === 'left'){
					nextRows[+pos[1]].keys.splice(+pos[2], 0, oldThing)
				}else{
					nextRows[+pos[1]].keys.splice(1 +parseInt(pos[2]), 0, oldThing)
				}
				// actually remove the thing
				nextRows[i].keys = nextRows[i].keys.filter(k => k !== null)
			}
			nextRows = nextRows.filter(k => k.keys.length > 0)

			this.setState({ layout: nextRows })
		}
		this.setState({ dragObject: null, dockTarget: null })
		window.removeEventListener('mousemove', this.onDrag)
		window.removeEventListener('mouseup', this.endDrag)
	}

	render(){
		var childrenByKey = makeChildMap(this.props.children);
		var layout = fixLayout(this.state.layout, childrenByKey);

		return <div className="breadloaf" style={{ cursor: this.state.dragTarget ? 'move' : 'default' }}><FlipMove>{
			layout.map((row, i) => <div key={row.id} className={"bread-row " + (
				(this.state.dockTarget === ('top-' + i) ? 'insert-top ' : '') +
				(this.state.dockTarget === ('bottom-' + i) ? 'insert-bottom ' : '') +
				('size-' + row.keys.length + ' ')
			)}><ReactCSSTransitionGroup
	          transitionName="example"
	          transitionEnterTimeout={300}
	          transitionLeaveTimeout={300}>{
				row.keys.map((key, j) => <div key={key} className={"bread-col " + (
					(this.state.dockTarget === ('left-' + i + '-' + j) ? 'insert-left ' : '') +
					(this.state.dockTarget === ('right-' + i + '-' + j) ? 'insert-right ' : '')
				)}>
					{React.cloneElement(childrenByKey[key], {
						beginDrag: this.beginDrag.bind(this, i + '-' + j)
					})}
				</div>)
			}</ReactCSSTransitionGroup></div>)
		}</FlipMove></div>
	}
}

// row.keys.map(key => 
// 					{React.cloneElement(childrenByKey[key], {

// 					})}
// 				</div>)

class BreadCol extends React.Component {
	static childContextTypes = {
		beginDrag: React.PropTypes.func
	};

	getChildContext(){
		return {
			beginDrag: this.props.beginDrag
		}
	}

	render(){
		return this.props.children;
	}
}

class Crust extends React.Component {
	static contextTypes = {
		beginDrag: React.PropTypes.func
	};
	render(){
		return <div className="header" onMouseDown={this.context.beginDrag}>
			{this.props.children}
		</div>
	}
}

class Wumbo extends React.Component {
	render(){

		<Wumbo>
      	<div>hello</div>
      	{[1,2,3,4,5].map(k => <span>{k}</span>)}
      	<div>...world</div>
      </Wumbo>

		console.log(this.props.children)
		return <div>{this.props.children}</div>
	}
}