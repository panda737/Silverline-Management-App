/*
  # Create service_enquiries table

  Serves the public marketing site (panda737/slco repo — bolt.new build,
  now developed locally against this Supabase project). Stores email leads
  captured when a visitor clicks "Connect with an agent" on a service card.

  1. New Tables
    - `service_enquiries`
      - `id` (uuid, primary key)
      - `email` (text, not null)
      - `service` (text, not null) — name of the service they enquired about
      - `created_at` (timestamptz)

  2. Security
    - RLS enabled
    - Public INSERT allowed (visitor submitting their email — no auth required)
    - No SELECT/UPDATE/DELETE for anon (admins use service role key)
*/

CREATE TABLE IF NOT EXISTS service_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  service text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE service_enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit an enquiry"
  ON service_enquiries
  FOR INSERT
  TO anon
  WITH CHECK (true);
