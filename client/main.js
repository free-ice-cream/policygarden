import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

Template.body.helpers({
  goals() {
    return Nodes.find({type: "goal"})
  },
  policies() {
    return Nodes.find({type: "policy"})
  },
  players() {
    return Nodes.find({type: "player"})
  },
  simulationRunning() {
    var state = SimulationState.findOne()
    if(state) {
      return state.running
    } else {
      return false
    }
  },
  simulationSpeed() {
    var state = SimulationState.findOne()
    if(state) {
      return state.speed
    } else {
      return false
    }
  }
})

Template.body.events({
  "click .simulation-toggle"(event) {
    Meteor.call("simulation.toggle")
  },
  "click .simulation-step"(event) {
    Meteor.call("simulation.step")
  },
  "input .simulation-speed"(event) {
    var state = SimulationState.findOne()
    if(state) {
      SimulationState.update(state._id, {$set: {speed:Number(event.target.value)}})
    } 
  },
  "click .create-goal"(event) {    
    Meteor.call("nodes.create", "goal")
  },
  "click .create-policy"(event) {    
    Meteor.call("nodes.create", "policy")
  },
  "click .create-player"(event) {    
    Meteor.call("nodes.create", "player")
  }
})

Template.node.helpers({
  goal() {
    return this.type == "goal"
  },
  policy() {
    return this.type == "policy"
  },
  player() {
    return this.type == "player"
  },
  replenish() {
    return -this.decay
  },
  connections() {
    return NodeConnections.find({source: this._id})
  },
  showConnections() {
    return NodeConnections.find({source: this._id}).count() > 0
  }
})

Template.node.events({
  "input input"(event) {
    if(event.target.name == "replenish") {
      this[decay] = -event.target.value // call negative decay "replenish" for player nodes
    } else {
      if($(event.target).hasClass("number")) {
        this[event.target.name] = Number(event.target.value) // convert input to number
      } else {
        this[event.target.name] = event.target.value
      }      
    }
    Nodes.update(this._id, this)
  },
  "click .delete-node"(event) {
    if(confirm("permanently delete node?")) {
      Meteor.call("nodes.delete", this._id)
    }
  }
})

Template.connection.helpers({
  targetTitle() {
    return Nodes.findOne(this.target).title
  }
})

Template.connection.events({
  "input input"(event) {
    this[event.target.name] = Number(event.target.value)
    NodeConnections.update(this._id, this)
  },
})
  
  
  