# common — Shared backend building blocks

Cross-cutting code that more than one app needs. Keep it dependency-free with
respect to the feature apps so you never create an import cycle.

**Belongs here:** base models (UUID/timestamp mixins), pagination, exception
handlers, permission mixins, validators, enums/choices, date-time helpers,
test factories.
