-- ==============================================================================
-- CLINICPRO PHASE 1: CLINIC MODULE CONFIGURATION & NURSE ROLE SUPPORT
-- Target Database: Supabase PostgreSQL
-- Purpose:
--   1. Add 'modules' JSONB column to 'clinics' table with default { lab: true, ipd: false }
--   2. Backfill existing clinics to preserve existing behavior (Lab enabled, IPD disabled)
--   3. Ensure 'staff' table role constraint supports 'nurse'
--   4. Add performance index on clinics.modules and staff(clinic_id, role)
--   5. Reload PostgREST schema cache
-- ==============================================================================

-- 1. ADD 'modules' COLUMN TO 'clinics' TABLE
-- Default ensures backward-compatibility: Lab enabled (true), IPD disabled (false)
ALTER TABLE IF EXISTS public.clinics
ADD COLUMN IF NOT EXISTS modules JSONB DEFAULT '{"lab": true, "ipd": false}'::jsonb;

-- 2. VALIDATE JSON STRUCTURE (OBJECT CHECK CONSTRAINT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_clinic_modules_is_object'
  ) THEN
    ALTER TABLE public.clinics
    ADD CONSTRAINT check_clinic_modules_is_object
    CHECK (modules IS NULL OR jsonb_typeof(modules) = 'object');
  END IF;
END $$;

-- 3. BACKFILL EXISTING CLINICS
-- Existing clinics must preserve their historical behavior without changes
UPDATE public.clinics
SET modules = '{"lab": true, "ipd": false}'::jsonb
WHERE modules IS NULL;

-- 4. GIN INDEX ON clinics.modules FOR FAST TENANT MODULE LOOKUP
CREATE INDEX IF NOT EXISTS idx_clinics_modules
ON public.clinics USING gin (modules);

-- 5. ENSURE 'staff' TABLE SUPPORTS 'nurse' ROLE
-- If an existing check constraint restricts role values on public.staff, update it safely.
DO $$
DECLARE
  r_constraint RECORD;
BEGIN
  FOR r_constraint IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.staff'::regclass
      AND contype = 'c'
      AND (conname LIKE '%role%' OR pg_get_constraintdef(oid) LIKE '%role%')
  LOOP
    EXECUTE format('ALTER TABLE public.staff DROP CONSTRAINT IF EXISTS %I', r_constraint.conname);
  END LOOP;
END $$;

-- Re-add standard check constraint allowing nurse, receptionist, and other staff roles
ALTER TABLE IF EXISTS public.staff
ADD CONSTRAINT staff_role_check
CHECK (role IN ('receptionist', 'nurse', 'housekeeping', 'staff', 'admin'));

-- 6. INDEX ON staff(clinic_id, role) FOR TENANT & ROLE LOOKUPS
CREATE INDEX IF NOT EXISTS idx_staff_clinic_id_role
ON public.staff (clinic_id, role);

-- 7. REFRESH SUPABASE / POSTGREST SCHEMA CACHE
-- Resolves: "Could not find the 'modules' column of 'clinics' in the schema cache"
NOTIFY pgrst, 'reload schema';
