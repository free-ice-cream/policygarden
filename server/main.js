import { Meteor } from 'meteor/meteor';

// code to run on server at startup
Meteor.startup(() => {  
  // initialize simulation state
  var state = SimulationState.findOne()
  if(state) {
    SimulationState.update(state._id, {$set: {running: false}}) 
  } else {
    SimulationState.insert({
      running: true,
      speed: 1000
    })
  }
})

var simulationInterval = null

// (re)start the simulation with specified speed
startSimulation = function() {
  simulationInterval = Meteor.setInterval(simulationStep, SimulationState.findOne().speed)  
}

// stop the simulation
stopSimulation = function() {
  Meteor.clearInterval(simulationInterval)
  simulationInterval = null
}

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
    if(node.level > node.overflow && node.overflow > 0) {
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
    if(state.running) {
      SimulationState.update(state._id, {$set: {running: false}})  
      stopSimulation()
    } else {
      SimulationState.update(state._id, {$set: {running: true}})  
      startSimulation()
    }
  },
  
  // do a manual simulation steop
  "simulation.step"() {
    simulationStep()
  },
  
  // create a new node
  "nodes.create"(type) {
    var title = type + " " + (Nodes.find({type: type}).count() + 1)
    var level = 0
    var decay = 0
    var threshold = 0
    var overflow = 0
    
    if(type == "player") {
      decay = -1
      overflow = 10
    }
    
    // create the node    
    var newNodeId = Nodes.insert({
      title: title,
      description: "",
      level: level,
      decay: decay,
      threshold: threshold,
      overflow: overflow,
      type: type
    })
    
    // add connections depending on type of created node
    Nodes.find().forEach(function(node) {
      if(node._id != newNodeId) { // no node connects to itself
        // players connect to policies
        if(type == "player") {
          if(node.type == "policy") {
            NodeConnections.insert({
              source: newNodeId,
              target: node._id,
              bandwidth: 0
            })            
          }
        }
        if(type == "policy") {
          // policies connect to other policies and goals and get connections from players and goals
          if(node.type == "policy" || node.type == "goal") {
            NodeConnections.insert({
              source: newNodeId,
              target: node._id,
              bandwidth: 0
            })            
          }
          if(node.type == "player" || node.type == "policy") {
            NodeConnections.insert({
              source: node._id,
              target: newNodeId,
              bandwidth: 0
            })  
          }
        }
        if(type == "goal") {
          // goals only get connections from policies
          if(node.type == "policy") {
            NodeConnections.insert({
              source: node._id,
              target: newNodeId,
              bandwidth: 0
            })              
          }
        }
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