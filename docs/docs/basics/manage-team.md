# Manage Your Team

Touca is built around Teams, to help you and your colleagues share access to
submitted test results, and collaborate with each other to interpret them.

In this document, we review how you can add new members to your team, invite
colleagues to join your team and handle pending join requests initiated by them.

![You can manage your team members from the Members tab.](/img/assets/touca-team-members-page.png)

## Inviting Members to Your Team

You can invite your colleagues to your team via the "Invite Member" button in
the "Members" tab of your team. When you invite someone to your team, Touca
sends them an email and asks if they want to join your team. This is regardless
of whether they already have an account or not.

![Once you invite new members to your team, they will get notified via an email.](/img/assets/touca-team-invitation-form.png)

Because it may take some time for invited users to accept your invitations,
users that you invite show up in a special "Invited Members" section so you can
track which invitations are still pending. Team Admins and the Team Owner always
have the option to rescind an invitation while it is still pending.

![Invited members to your team show up in a separate section in the Members tab.](/img/assets/touca-team-pending-invitations.png)

Similarly, users who are invited to your team will see a separate "Your
Invitations" section in their "Teams" page that allows them to accept or decline
your invitation.

If your colleagues do not have an account yet, they can use their invitation
email to create an account first. Touca reminds these users of their open
invitations as soon as their account is created.

![You can respond to your team invitations from the Teams Page.](/img/assets/touca-team-my-invitations.png)

## Joining An Existing Team

As a separate workflow, you can choose to share your "Team Slug" with your
colleagues and ask that they initiate the process to join your team. They can do
so via the "New Team" button in the "Teams" page.

![Click on New Team button and select Join an Existing Team to get to this form.](/img/assets/touca-team-request-form.png)

When you requests to join a team, you need to wait until a Team Admin or the
Team Owner in that team accepts your request. Since this process can take some
time, Touca lists your pending join requests in a separate section in the
"Teams" page. You can use this section to cancel pending requests, if you
changed your mind.

![You can always cancel your pending Join requests if you changed your mind.](/img/assets/touca-team-my-requests.png)

Pending join requests show up in the "Pending Members" section in the "Members"
tab. As a Team Admin or Team Owner, you can use this section to accept or
decline these requests.

![Pending Join requests are listed in the Pending Members section of the Members tab.](/img/assets/touca-team-pending-requests.png)

## Membership Roles

Every touca account can have one of three different roles within a given team:

- **Team Member**: is the default role assigned to new members of a team. This
  role provides sufficient permissions to perform common tasks listed below.
  - Create a suite.
  - Submit test results for a new version of a suite
  - Change baseline version of a suite
  - Write comments on test results
- **Team Admin**: is a Team Member with extra permissions to perform the
  following actions:
  - Accept or decline user requests to join the team
  - Promote role of regular members to Team Admin
  - Remove a Team Member from the team
  - Change name or slug of a given suite
  - Remove a given suite
  - Remove test results for a given version
- **Team Owner**: is the user creating the team. In addition to permissions
  granted to Team Admins, a team owner can perform the following actions:
  - Remove the team and all its associated data
  - Remove or demote team admins
