-- Fix: a client could not answer an outstanding item. Every attempt failed
-- with a row-level security violation.
--
-- WHAT WAS WRONG
--
-- Both client write paths — "Correct / Not right" on a fact, and "Reply or
-- attach" on an outstanding item — insert into project_fact_responses. The
-- insert policy required the target fact to have confirmable = true.
--
-- But `confirmable` means something narrower than the policy assumed. It
-- controls whether the Correct / Not right buttons appear on a stated fact.
-- An OUTSTANDING item is not a stated fact — it is a request to the client,
-- and it is always answerable. src/pages/portal/mission.tsx says so in terms:
--
--     /** An outstanding item. Always answerable — a comment, a document,
--         or both. */
--
-- Outstanding items are created with confirmable = false, correctly, because
-- there is nothing to confirm. So the UI offered a Reply button that the
-- database refused every time. On 19 August 2026 all 18 outstanding items
-- across the three Verdex projects were in this state.
--
-- THE FIX
--
-- Widen the policy to what the interface actually offers: a client may
-- respond to a fact on their own visible project that is client_safe AND is
-- either confirmable or an outstanding request.
--
-- Nothing else is loosened. The response must still be authored by the
-- signed-in user, on a project that client owns and that is client_visible,
-- and against a fact that is client_safe. internal_only and withheld rows
-- remain unreachable.

drop policy if exists "client responds to own visible facts" on public.project_fact_responses;

create policy "client responds to own visible facts"
  on public.project_fact_responses
  for insert
  to authenticated
  with check (
    responded_by = auth.uid()
    and public.client_owns_project(project_id)
    and exists (
      select 1
        from public.project_facts f
       where f.id = project_fact_responses.fact_id
         and f.project_id = project_fact_responses.project_id
         and f.sensitivity = 'client_safe'
         and (f.confirmable or f.section = 'outstanding')
    )
  );
