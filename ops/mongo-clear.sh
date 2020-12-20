#!/bin/bash

mongo <<EOF
use weasel
db.comments.remove({})
db.comparisons.remove({})
db.suites.remove({})
db.batches.remove({})
db.elements.remove({})
db.messages.remove({})

db.mails.remove({})
db.reports.remove({})
db.notifications.remove({})
db.sessions.remove({})
db.teams.remove({})
db.users.deleteMany({ "platformRole": { "\$ne": "super" } })
EOF
