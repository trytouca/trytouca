db = db.getSiblingDB('weasel')
db.createUser({
  user: 'weaseluser',
  pwd: 'weaselpass',
  roles: [
    {role: 'readWrite', db: 'weasel'}
  ]
});
