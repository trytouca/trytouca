db.disableFreeMonitoring();

db = db.getSiblingDB("touca");
db.createUser({
  user: "toucauser",
  pwd: "toucapass",
  roles: [{ role: "readWrite", db: "touca" }],
});
