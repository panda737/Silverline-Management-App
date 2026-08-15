-- ---------------------------------------------------------------------------
-- An Atmospheric Emission Licence is its own instrument, so it gets its own
-- project type.
--
-- Verdex is being split into the three instruments it actually is: the NEMA
-- s24G rectification and waste management licence (GDARD), the NEM:AQA s22A
-- rectification and atmospheric emission licence (City of Tshwane), and the
-- Norms & Standards registration. Separate authorities, separate clocks,
-- separate fines.
--
-- Without this the air leg would be filed as project_type 'other' and render
-- to the client as "Other", which is exactly the vagueness the split exists to
-- remove. norms_and_standards already exists; only the AEL was missing.
-- ---------------------------------------------------------------------------

alter type public.project_type add value if not exists 'atmospheric_emission_licence';
