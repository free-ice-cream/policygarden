Nodes = new Mongo.Collection('Nodes')
NodeConnections = new Mongo.Collection('NodeConnections')
SimulationState = new Mongo.Collection('SimulationState')
Snapshots = new Mongo.Collection('Snapshots')

importJson = function(raw) {
  var jsonObject;
  var err;

  try {
    jsonObject = $.parseJSON(raw) 
    console.log(jsonObject)
  } catch(err) {
    if(err) {
      console.log(err.message)
      return false
    }
  } 

  Meteor.call("json.import", jsonObject)
  return true
}

exportJson = function() {
  var output = {}  
  output.goals = []
  output.policies = []
  Nodes.find({type: "goal", state: "active"}).fetch().forEach(function(goal) {
    output.goals.push(nodeToJson(goal))
  })
  Nodes.find({type: "policy", state: "active"}).fetch().forEach(function(policy) {
    output.policies.push(nodeToJson(policy))  
  })
  return JSON.stringify(output)
}


nodeToJson = function(node) {
  var jsonNode = {}
  jsonNode.id = node._id
  jsonNode.name = node.title
  jsonNode.short_name = node.description
  jsonNode.activation_amount = node.threshold  
  jsonNode.leakage = node.decay
  jsonNode.max_amount = node.overflow

  jsonNode.balance = node.level
  jsonNode.active_level = 0.0 // calculated on server
  
  jsonNode.connections = []
  NodeConnections.find({source: node._id}).fetch().forEach(function(connection) {
    var node = Nodes.findOne(connection.source)
    if(node.type == "goal" || node.type == "policy") {
        if(connection.bandwidth != 0 && connection.state == "active") {
        jsonNode.connections.push({
          id: connection._id,
          weight: connection.bandwidth,
          from_id: connection.source,
          to_id: connection.target
        })
      }  
    }
  })
  
  return jsonNode  
}

/* example json format

{"goals": [

    {
      "activation_amount": 1000000.0, 
      "active_level": 0.0, 
      "balance": 0.0, 
      "connections": [], 
      "id": "9ed84ad4-86ca-4bc5-93a0-6fb8f6d5251e", 
      "leakage": 0.050000000000000003, 
      "max_amount": 2000000.0, 
      "name": "Goal 9 Build resilient infrastructure promote inclusive and sustainable industrialization and foster innovation", 
      "short_name": "Innovation & Infrastructure"
    }


],
"policies": [
{
      "activation_amount": 0.20000000000000001, 
      "active_level": 0.0, 
      "balance": 253949.03, 
      "connections": [
        {
          "from_id": "d7ea54ef-fe79-4262-8f6f-a661887a90b2", 
          "id": "25757ec2-e739-11e6-9d00-e5db5a6ac747", 
          "to_id": "9ed84ad4-86ca-4bc5-93a0-6fb8f6d5251e", 
          "weight": 50.0
        }, 
        {
          "from_id": "d7ea54ef-fe79-4262-8f6f-a661887a90b2", 
          "id": "25758d9c-e739-11e6-aa15-e5db5a6ac747", 
          "to_id": "94b3c078-0e2e-4405-9bff-ec582984eb1a", 
          "weight": 50.0
        }
      ], 
      "id": "d7ea54ef-fe79-4262-8f6f-a661887a90b2", 
      "leakage": 0.0, 
      "max_amount": 0.0, 
      "name": "Allocate appropriate level of funds for financing climate resilient infrastructure", 
      "short_name": null
    }
]}

*/





/* old version
exportJson = function() {
  var output = {}  
  output.Goals = []
  output.Policies = []
  Nodes.find({type: "goal", state: "active"}).fetch().forEach(function(goal) {
    output.Goals.push(nodeToJson(goal))
  })
  Nodes.find({type: "policy", state: "active"}).fetch().forEach(function(policy) {
    output.Policies.push(nodeToJson(policy))  
  })
  return JSON.stringify(output)
}


nodeToJson = function(node) {
  var jsonNode = {}
  jsonNode.Id = node._id
  jsonNode.Name = node.title
  jsonNode.ActivationAmount = node.threshold
  jsonNode.WaterAmount = node.level
  jsonNode.Leakage = node.decay
  jsonNode.Connections = []
  
  NodeConnections.find({target: node._id}).fetch().forEach(function(connection) {
    var node = Nodes.findOne(connection.source)
    if(node.type == "goal" || node.type == "policy") {
        if(connection.bandwidth > 0 && connection.state == "active") {
        jsonNode.Connections.push({
          Weight: connection.bandwidth / 100.0,
          FromId: connection.source,
          ToId: connection.target
        })
      }  
    }
  })
  
  return jsonNode  
}
*/
/*
old example JSON object
{
  "Goals":[
    {"Id":"0","Name":"Reduce Peak Congestion","Connections":[
      {"Weight":0.10000000149011612,"FromId":"7"},
      {"Weight":0.10000000149011612,"FromId":"8"},
      {"Weight":0.10000000149011612,"FromId":"9"},
      {"Weight":0.10000000149011612,"FromId":"10"},
      {"Weight":0.10000000149011612,"FromId":"11"}
    ],"ActivationAmount":0,"WaterAmount":18.86183706318653,"Leakage":1},
  ],
  "Policies":[
    {"Id":"7","Name":"Increase Cycle Provision","Connections":[
      {"Weight":0.10000000149011612,"FromId":"8"},
      {"Weight":0.10000000149011612,"FromId":"9"}
    ],"ActivationAmount":0,"WaterAmount":53.9244899282799,"Leakage":1,"AttachedPlayers":[
      {"PlayerId":"381CEAB1C2591860","Amount":46},
      {"PlayerId":"C30A84DEF9C7929D","Amount":0},
      {"PlayerId":"974CE00E52A3548D","Amount":0}
    ]},
  ]
}
*/