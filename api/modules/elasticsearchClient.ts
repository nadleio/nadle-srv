var bonsaiUrl = process.env.BONSAI_URL;
var elasticsearch = require("elasticsearch");
var elasticClient = new elasticsearch.Client({
  host: bonsaiUrl,
  log: "trace"
});

elasticClient.ping(
  {
    requestTimeout: 30000
  },
  function(error) {
    if (error) {
      console.error("elasticsearch cluster is down!");
    } else {
      console.log("All is well");
    }
  }
);

export default elasticClient;
