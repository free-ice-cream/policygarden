import { Meteor } from 'meteor/meteor';

// code to run on server at startup
Meteor.startup(() => {
  // run a simulation every second if simulation is on
  Meteor.setInterval(function() {
    var state = SimulationState.findOne()
    if(state.running) {
      simulationStep()
    }
  }, 1000)
})

// run a step in the simulation
simulationStep = function() {
  
  // calculate connections (this simply iterates over connections - todo: split available amount over existing connections)
  NodeConnections.find().forEach(function(connection) {
    if(connection.bandwidth > 0) {
      var source = Nodes.findOne(connection.source)
      var target = Nodes.findOne(connection.target)
      
      // determine amount to transfer
      var maxAmount = source.level - source.threshold
      if(maxAmount < 0) {
        maxAmount = 0
      }
      var amount = connection.bandwidth
      if(amount > maxAmount) {
        amount = maxAmount
      }
      
      //substract amount from source level
      source.level -= amount
      Nodes.update(source._id, source)

      //add amount to target level
      target.level += amount
      Nodes.update(target._id, target)        
    }
  })
  
  // calculate decay and overflow
  Nodes.find().forEach(function(node) {
    node.level -= node.decay
    if(node.level < 0) {
      node.level = 0 // make sure level doesn't drop below 0
    }
    if(node.level > node.overflow) {
      node.level = node.overflow
    }      
    Nodes.update(node._id, node)
  })
  
}

// methods called from the clients
Meteor.methods({  
  
  // turn simulation on/off
  "simulation.toggle"() {
    var state = SimulationState.findOne()
    if(!state) {
      SimulationState.insert({
        running: true
      })
    } else {
      SimulationState.update(state._id, {
        running: !state.running
      })
    }
  },
  
  // do a manual simulation steop
  "simulation.step"() {
    simulationStep()
  },
  
  // create a new node
  "nodes.create"() {
    // create the node    
    var newNodeId = Nodes.insert({
      title: "node " + (Nodes.find().count() + 1),
      description: "",
      level: 50,
      decay: 0,
      threshold: 0,
      overflow: 100
    })
    // add connections from this node to all other nodes and to this node from all other nodes
    Nodes.find().forEach(function(node) {
      if(node._id != newNodeId) {
        NodeConnections.insert({
          source: newNodeId,
          target: node._id,
          bandwidth: 0
        })
        NodeConnections.insert({
          source: node._id,
          target: newNodeId,
          bandwidth: 0
        })  
      }
    })    
  },
  
  // delete a node
  "nodes.delete"(id) {
    Nodes.remove(id)
    NodeConnections.remove({source:id})
    NodeConnections.remove({target:id})
  }
})