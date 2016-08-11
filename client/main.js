import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

Template.body.helpers({
  nodes() {
    return Nodes.find()
  },
  simulationRunning() {
    var state = SimulationState.findOne()
    if(state) {
      return state.running
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
  "click .create-node"(event) {    
    Meteor.call("nodes.create")
  }
})

Template.node.helpers({
  connections() {
    return NodeConnections.find({source: this._id})
  }
})

Template.node.events({
  "input input"(event) {
    if($(event.target).hasClass("number")) {
      this[event.target.name] = Number(event.target.value) // convert input to number
    } else {
      this[event.target.name] = event.target.value
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
  
  
  