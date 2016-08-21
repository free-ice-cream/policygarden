import { Meteor } from 'meteor/meteor';

// code to run on server at startup
Meteor.startup(() => {  
  // initialize simulation state
  var state = SimulationState.findOne()
  if(state) {
    SimulationState.update(state._id, {$set: {running: false}}) 
  } else {
    SimulationState.insert({
      running: false,
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
  
  // 1st iteration over all nodes: decay & inflow
  Nodes.find().fetch().forEach(function(node) {
  
    // apply decay (replenishment)
    node.level -= node.decay
    if(node.level < 0) {
      node.level = 0 // make sure level doesn't drop below 0
    }

    // apply inflow
    node.level += node.inflow
    node.inflow = 0
    
    // persist level and inflow
    Nodes.update(node._id, {$set: {level: node.level, inflow: node.inflow}})

  })
  
  // 2rd iteration over all nodes: overflow & outflow
  Nodes.find().fetch().forEach(function(node) {
    
    // determine available outflow to transfer
    var availableForOutflow = node.level - node.threshold
    if(availableForOutflow < 0) {
      availableForOutflow = 0
    }
    if(availableForOutflow > node.maxOutflow && node.maxOutflow > 0) {
      availableForOutflow = node.maxOutflow
    }
    
    // apply outflow
    var currentOutflow = 0
    if(availableForOutflow > 0) {
      NodeConnections.find({source: node._id}).fetch().forEach(function(connection) {
        if(connection.bandwidth > 0) {
          var amount = (connection.bandwidth / 100.0) * availableForOutflow // calculate part of outflow for this conection
          var target = Nodes.findOne(connection.target) 
          if(!target.inflow) {
            target.inflow = 0
          }
          target.inflow += amount // add amount to target inFlow                 
          Nodes.update(target._id, {$set: {inflow: target.inflow}}) // persist inflow on target
          
          //substract outflow from source level
          node.level -= amount
          currentOutflow += amount          
        }
      })
    }
    
    // apply overflow
    if(node.level > node.overflow && node.overflow > 0) {
      node.level = node.overflow
    }    
    
    // persist outflow and overflow
    Nodes.update(node._id, {$set: {level: node.level, currentOutflow: currentOutflow}})
  
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
  
  // do a manual simulation step
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
    }
    
    // create the node    
    var newNodeId = Nodes.insert({
      title: title,
      description: "",
      level: level,
      decay: decay,
      threshold: threshold,
      overflow: overflow,
      inflow: 0,
      type: type,
      maxOutflow: 0,
      currentOutflow: 0
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
          // goals connect to other goals and policies and get connections from policies and other goals
          if(node.type == "policy" || node.type == "goal") {
            NodeConnections.insert({
              source: newNodeId,
              target: node._id,
              bandwidth: 0
            })            
          }
          if(node.type == "policy" || node.type == "goal") {
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