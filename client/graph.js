updatePolicyGraph = function() {
  
  var nodes = Nodes.find({state: "active"})
  var nodeConnections = NodeConnections.find({state: "active"})
  var elements = graphElements(nodes.fetch(), nodeConnections.fetch())
  console.log(elements)
  
  // assemble policy graph
  var cy = cytoscape({
    container: document.getElementById('cy'),
    zoomingEnabled: true,
    userZoomingEnabled: true,
    panningEnabled: true,
    userPanningEnabled: true,
    elements: elements,
    layout: {
      name: 'cose-bilkent',
      fit: true
    },
    ready: function(){
      window.cy = this;
    },
    style: cytoscape.stylesheet()
      .selector('node')
        .css({
          'shape': 'circle',
          'background-color': '#fff',
          'border-color': 'data(color)',
          'border-style': 'solid',
          'border-width': '1.0',
          'width': '25',
          'height': '25',
          'text-valign': "top",
          'color': '#444',
          'text-margin-y': "-5",
          'font-family': "times",
          'font-weight': "100",
          'font-size': "35",
          'content': 'data(short_title)'
        })
      .selector('edge')
        .css({
            'curve-style': 'bezier',
            'width': '0.6',
            'target-arrow-shape': 'triangle',
            'line-color': 'data(color)',
            'source-arrow-color': '#000',
            'target-arrow-color': '#000'
        })
  })  

}

graphElements = function(nodes, nodeConnections) {
  var elements = {nodes: [], edges: []}
  nodes.forEach(function(node) {
    if(node.type != "player") {
      elements.nodes.push({
        data: {
          id: node._id, 
          title: node.title,
          short_title: node.description ? node.description : node.title.substr(0, 20),
          type: node.type,
          color: node.type == "goal" ? "blue" : "green"
        }
      })
    }
  })  
  nodeConnections.forEach(function(connection) {
    if(connection.bandwidth > 0) {
      var source = Nodes.findOne(connection.source)
      if(source.type != "player") {
        var target = Nodes.findOne(connection.target)
        elements.edges.push({
          data: {
            source: source._id,
            target: target._id,
            color: "#000"
          }
        }) 
      }
    } 
  })
  return elements
}