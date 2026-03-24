-- FitVision Database Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  age integer,
  gender text,
  height_cm numeric,
  weight_kg numeric,
  bmi numeric,
  goal text check (goal in ('cut', 'bulk', 'recomp', 'maintain')),
  diet_type text,
  calorie_target integer,
  protein_g integer,
  carbs_g integer,
  fat_g integer,
  training_philosophy text,
  onboarded boolean default false,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Meals table
create table public.meals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  photo_url text,
  name text not null,
  description text,
  calories integer not null default 0,
  protein_g numeric not null default 0,
  carbs_g numeric not null default 0,
  fat_g numeric not null default 0,
  logged_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.meals enable row level security;
create policy "Users can manage own meals" on public.meals for all using (auth.uid() = user_id);

-- Workouts table
create table public.workouts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  notes text,
  started_at timestamptz default now(),
  completed_at timestamptz,
  created_at timestamptz default now()
);

alter table public.workouts enable row level security;
create policy "Users can manage own workouts" on public.workouts for all using (auth.uid() = user_id);

-- Exercises table
create table public.exercises (
  id uuid default uuid_generate_v4() primary key,
  workout_id uuid references public.workouts(id) on delete cascade not null,
  name text not null,
  order_index integer not null default 0
);

alter table public.exercises enable row level security;
create policy "Users can manage own exercises" on public.exercises for all
  using (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));

-- Exercise sets table
create table public.exercise_sets (
  id uuid default uuid_generate_v4() primary key,
  exercise_id uuid references public.exercises(id) on delete cascade not null,
  set_number integer not null,
  reps integer,
  weight_kg numeric,
  rpe numeric,
  completed boolean default false
);

alter table public.exercise_sets enable row level security;
create policy "Users can manage own sets" on public.exercise_sets for all
  using (exists (
    select 1 from public.exercises e
    join public.workouts w on w.id = e.workout_id
    where e.id = exercise_id and w.user_id = auth.uid()
  ));

-- Programs table
create table public.programs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  philosophy text not null,
  weeks integer not null default 4,
  days_per_week integer not null default 4,
  program_data jsonb not null default '[]'::jsonb,
  active boolean default true,
  created_at timestamptz default now()
);

alter table public.programs enable row level security;
create policy "Users can manage own programs" on public.programs for all using (auth.uid() = user_id);

-- Diet plans table
create table public.diet_plans (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  diet_type text not null,
  calorie_target integer not null,
  protein_g integer not null,
  carbs_g integer not null,
  fat_g integer not null,
  meals_per_day integer not null default 3,
  plan_data jsonb not null default '[]'::jsonb,
  active boolean default true,
  created_at timestamptz default now()
);

alter table public.diet_plans enable row level security;
create policy "Users can manage own diet plans" on public.diet_plans for all using (auth.uid() = user_id);

-- Progress entries table
create table public.progress_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  photo_url text,
  weight_kg numeric,
  body_fat_pct numeric,
  notes text,
  logged_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.progress_entries enable row level security;
create policy "Users can manage own progress" on public.progress_entries for all using (auth.uid() = user_id);

-- Storage buckets
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
insert into storage.buckets (id, name, public) values ('meals', 'meals', true);
insert into storage.buckets (id, name, public) values ('progress', 'progress', true);

-- Storage policies
create policy "Users can upload avatars" on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Anyone can view avatars" on storage.objects for select using (bucket_id = 'avatars');
create policy "Users can upload meal photos" on storage.objects for insert with check (bucket_id = 'meals' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Anyone can view meal photos" on storage.objects for select using (bucket_id = 'meals');
create policy "Users can upload progress photos" on storage.objects for insert with check (bucket_id = 'progress' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Anyone can view progress photos" on storage.objects for select using (bucket_id = 'progress');

-- Scheduled workouts table (auto-populated from program)
create table public.scheduled_workouts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  program_id uuid references public.programs(id) on delete set null,
  scheduled_date date not null,
  day_name text not null,
  exercises jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'completed', 'skipped', 'partial')),
  workout_id uuid references public.workouts(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.scheduled_workouts enable row level security;
create policy "Users can manage own scheduled workouts" on public.scheduled_workouts for all using (auth.uid() = user_id);

-- Streaks table
create table public.streaks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  streak_type text not null check (streak_type in ('workout', 'meal', 'login')),
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_activity_date date,
  updated_at timestamptz default now(),
  unique(user_id, streak_type)
);

alter table public.streaks enable row level security;
create policy "Users can manage own streaks" on public.streaks for all using (auth.uid() = user_id);

-- Achievements table
create table public.achievements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  achievement_type text not null,
  title text not null,
  description text not null,
  icon text not null default '🏆',
  earned_at timestamptz default now()
);

alter table public.achievements enable row level security;
create policy "Users can manage own achievements" on public.achievements for all using (auth.uid() = user_id);

-- Form analysis table (video-based)
create table public.form_analyses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  video_url text,
  exercise_name text not null,
  form_score numeric not null default 0,
  good_points jsonb not null default '[]'::jsonb,
  issues jsonb not null default '[]'::jsonb,
  cues jsonb not null default '[]'::jsonb,
  overall_assessment text,
  created_at timestamptz default now()
);

alter table public.form_analyses enable row level security;
create policy "Users can manage own form analyses" on public.form_analyses for all using (auth.uid() = user_id);

-- Add XP and level to profiles
alter table public.profiles add column if not exists estimated_weight_kg numeric;
alter table public.profiles add column if not exists age_range_low integer;
alter table public.profiles add column if not exists age_range_high integer;
alter table public.profiles add column if not exists xp integer not null default 0;
alter table public.profiles add column if not exists level integer not null default 1;

-- Videos storage bucket
insert into storage.buckets (id, name, public) values ('videos', 'videos', true);
create policy "Users can upload videos" on storage.objects for insert with check (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Anyone can view videos" on storage.objects for select using (bucket_id = 'videos');
