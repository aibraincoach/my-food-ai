-- A clarification question beside a posted meal (owner ruling, Nov 4, #615): the meal is ready
-- and counted like any other; the question shows in the Home strip and goes out as a push until
-- it is answered (a comment) or dismissed. Held questions (no food found) keep status/needs_input.
alter table public.posts add column question jsonb;
