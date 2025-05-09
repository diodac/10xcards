-- Migration: Initial Schema Setup
-- Description: Creates core tables for 10xCards application including user_profiles, decks, flashcards, and event_logs
-- Author: System
-- Date: 2024-03-20

-- Create user_profiles table
create table if not exists user_profiles (
    user_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Enable RLS for user_profiles
alter table user_profiles enable row level security;

-- RLS Policies for user_profiles
create policy "Users can view their own profile"
    on user_profiles for select
    using (auth.uid() = user_id);

create policy "Users can update their own profile"
    on user_profiles for update
    using (auth.uid() = user_id);

create policy "Users can insert their own profile"
    on user_profiles for insert
    with check (auth.uid() = user_id);

-- Create decks table
create table if not exists decks (
    id uuid primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    name varchar(128) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Create index for deck lookups by user
create index decks_user_id_idx on decks(user_id);

-- Enable RLS for decks
alter table decks enable row level security;

-- RLS Policies for decks
create policy "Users can view their own decks"
    on decks for select
    using (auth.uid() = user_id);

create policy "Users can insert their own decks"
    on decks for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own decks"
    on decks for update
    using (auth.uid() = user_id);

create policy "Users can delete their own decks"
    on decks for delete
    using (auth.uid() = user_id);

-- Create flashcards table
create table if not exists flashcards (
    id uuid primary key,
    deck_id uuid not null references decks(id) on delete cascade,
    front varchar(256) not null,
    back varchar(512) not null,
    source varchar not null check (source in ('ai-full', 'ai-edited', 'manual')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Create index for flashcard lookups by deck
create index flashcards_deck_id_idx on flashcards(deck_id);

-- Enable RLS for flashcards
alter table flashcards enable row level security;

-- RLS Policies for flashcards
create policy "Users can view flashcards in their decks"
    on flashcards for select
    using (exists (
        select 1 from decks
        where decks.id = flashcards.deck_id
        and decks.user_id = auth.uid()
    ));

create policy "Users can insert flashcards in their decks"
    on flashcards for insert
    with check (exists (
        select 1 from decks
        where decks.id = flashcards.deck_id
        and decks.user_id = auth.uid()
    ));

create policy "Users can update flashcards in their decks"
    on flashcards for update
    using (exists (
        select 1 from decks
        where decks.id = flashcards.deck_id
        and decks.user_id = auth.uid()
    ));

create policy "Users can delete flashcards in their decks"
    on flashcards for delete
    using (exists (
        select 1 from decks
        where decks.id = flashcards.deck_id
        and decks.user_id = auth.uid()
    ));

-- Create event_logs table
create table if not exists event_logs (
    id uuid primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    session_id uuid not null,
    event_type varchar(64) not null,
    payload jsonb not null,
    created_at timestamptz not null default now()
);

-- Create indexes for event_logs
create index event_logs_user_id_idx on event_logs(user_id);
create index event_logs_session_id_idx on event_logs(session_id);

-- Enable RLS for event_logs
alter table event_logs enable row level security;

-- RLS Policies for event_logs
create policy "Users can view their own event logs"
    on event_logs for select
    using (auth.uid() = user_id);

create policy "Users can insert their own event logs"
    on event_logs for insert
    with check (auth.uid() = user_id);

-- Note: Update and Delete policies are intentionally omitted for event_logs
-- as these records should be immutable 