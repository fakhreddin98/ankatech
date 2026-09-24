-- Run once in Supabase SQL Editor. No anonymous or ordinary authenticated access.
create table public.portal_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create table public.portal_jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null, title_en text not null default '',
  summary text not null default '', summary_en text not null default '',
  description text not null default '', description_en text not null default '',
  requirements text not null default '', requirements_en text not null default '',
  merits text not null default '', merits_en text not null default '',
  location text not null default '', category text not null default 'Engineering',
  work_mode text not null default 'Onsite' check (work_mode in ('Onsite','Hybrid','Remote')),
  scope text not null default '', start_text text not null default '',
  deadline date, status text not null default 'draft' check (status in ('draft','published','closed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.portal_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.portal_jobs(id),
  job_title text not null, name text not null, email text not null, phone text not null default '',
  location text not null default '', availability text not null default '',
  skills text not null default '', message text not null default '',
  cv_path text not null, cv_name text not null,
  status text not null default 'new' check (status in ('new','contacted','interview','presented','closed')),
  notes text not null default '', consent_at timestamptz not null default now(),
  consent_version text not null default '2026-09-24',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on public.portal_applications(job_id);
create index on public.portal_applications(created_at desc);
create table public.portal_limits (key text primary key, hits integer not null, expires_at timestamptz not null);
alter table public.portal_admins enable row level security;
alter table public.portal_jobs enable row level security;
alter table public.portal_applications enable row level security;
alter table public.portal_limits enable row level security;
revoke all on public.portal_admins, public.portal_jobs, public.portal_applications, public.portal_limits from anon, authenticated;
grant all on public.portal_admins, public.portal_jobs, public.portal_applications, public.portal_limits to service_role;
-- Atomic throttling across serverless instances. Keys are HMACs, never raw IPs.
create function public.portal_take_slot(p_key text, p_limit integer, p_seconds integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  delete from portal_limits where expires_at < now();
  insert into portal_limits(key,hits,expires_at) values(p_key,1,now()+make_interval(secs=>p_seconds))
  on conflict(key) do update set hits=portal_limits.hits+1 returning hits into n;
  return n <= p_limit;
end; $$;
revoke all on function public.portal_take_slot(text,integer,integer) from public, anon, authenticated;
grant execute on function public.portal_take_slot(text,integer,integer) to service_role;
-- Serialize submissions against job closing; prevent stale job IDs being accepted.
create function public.portal_validate_job() returns trigger language plpgsql set search_path = public as $$
declare j portal_jobs;
begin
  if new.job_id is null then new.job_title := 'Spontanansökan'; return new; end if;
  select * into j from portal_jobs where id = new.job_id for share;
  if not found or j.status <> 'published' or (j.deadline is not null and j.deadline < (now() at time zone 'Europe/Stockholm')::date) then
    raise exception 'Assignment is not open';
  end if;
  new.job_title := j.title;
  return new;
end; $$;
create trigger portal_application_job before insert on public.portal_applications
for each row execute function public.portal_validate_job();
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('portal-cvs','portal-cvs',false,2097152,array['application/pdf'])
on conflict(id) do update set public=false, file_size_limit=2097152, allowed_mime_types=array['application/pdf'];
-- No storage policies for anon/authenticated: files are accessed only via the protected API.
-- After creating your admin in Authentication > Users, run with its real UUID:
-- insert into public.portal_admins(user_id) values ('YOUR-ADMIN-USER-UUID');
