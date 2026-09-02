# TO HEIMERDINKER - Internal Route Edge Protection

## Mission

Make internal route families unavailable to anonymous preview/production visitors while preserving local development access. Protect `/operator`, `/thinkit`, `/tinkerden`, `/soledash`, `/gd`, and `/nerdkle` before their page code executes.

## Boundary

This is concealment/deny-by-default, not operator authentication. Do not invent an admin cookie or trust a route name. A future authenticated operator session must be designed separately.

## Evidence

- Pure route-policy ghost tests
- Localhost access remains allowed in development
- Production and preview policy deny internal routes
- Public and member routes remain unaffected
