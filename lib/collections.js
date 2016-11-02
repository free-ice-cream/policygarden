Nodes = new Mongo.Collection('Nodes')
NodeConnections = new Mongo.Collection('NodeConnections')
SimulationState = new Mongo.Collection('SimulationState')
Snapshots = new Mongo.Collection('Snapshots')

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

/*
example JSON object
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