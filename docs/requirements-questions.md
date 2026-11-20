# Clarifying Questions (Phase A)

Source: Jira SUBT search `project = SUBT AND issuetype = Story AND status = "To Do"`
Stories found: SUBT-3

## SUBT-3: As a user, I want to track my recurring subscriptions so that I know how much I spend and what renews soon.

1. Which fields should each subscription have? (Proposed: name, cost, billing cycle monthly or yearly, next renewal date. Anything else, such as category or notes?)
2. How should the monthly total be calculated for yearly subscriptions? (Proposed: yearly cost divided by 12.)
3. What does "renewing soon" mean? (Proposed: renews within the next 7 days, configurable or fixed?)
4. When a renewal date passes, should the app roll it forward automatically to the next cycle, or does the user update it manually?
5. Should the user be able to edit and delete subscriptions, or is add and view enough for this story?
6. Is there a single user with no login, or do we need any form of authentication? (Assumed: single local user, no login.)
