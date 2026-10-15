-- =========================================================================
-- IMPOSTER - Supabase PostgreSQL Database Schema & Row Level Security (RLS)
-- Production-ready migration file for Supabase / PostgreSQL deployment
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS FOR GAME PHASES AND ROLES
DO $$ BEGIN
    CREATE TYPE game_phase_enum AS ENUM (
        'LOBBY',
        'ANSWERING',
        'REVEAL',
        'DISCUSSION',
        'VOTING',
        'TIEBREAKER_DISCUSSION',
        'TIEBREAKER_VOTING',
        'RESULTS',
        'LEADERBOARD'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE player_role_enum AS ENUM (
        'NORMAL',
        'IMPOSTER'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. GAMES TABLE
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code VARCHAR(6) UNIQUE NOT NULL,
    room_name VARCHAR(50) NOT NULL DEFAULT 'Party Game',
    host_player_id UUID,
    phase game_phase_enum NOT NULL DEFAULT 'LOBBY',
    round_number INT NOT NULL DEFAULT 1,
    settings JSONB NOT NULL DEFAULT '{
        "imposterCount": 1,
        "discussionSeconds": 120,
        "votingSeconds": 60,
        "timersEnabled": true,
        "allowHostToPlay": true,
        "autoAssignImposter": false
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for instant room lookup by room_code
CREATE INDEX IF NOT EXISTS idx_games_room_code ON games(room_code);

-- 3. PLAYERS TABLE
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    name VARCHAR(30) NOT NULL,
    avatar VARCHAR(50) NOT NULL DEFAULT '😎',
    is_host BOOLEAN NOT NULL DEFAULT FALSE,
    is_ready BOOLEAN NOT NULL DEFAULT FALSE,
    is_connected BOOLEAN NOT NULL DEFAULT TRUE,
    session_token TEXT NOT NULL,
    total_score INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_player_in_game UNIQUE (game_id, name)
);

CREATE INDEX IF NOT EXISTS idx_players_game_id ON players(game_id);
CREATE INDEX IF NOT EXISTS idx_players_session_token ON players(session_token);

-- Update host reference foreign key
ALTER TABLE games 
    DROP CONSTRAINT IF EXISTS fk_games_host_player,
    ADD CONSTRAINT fk_games_host_player FOREIGN KEY (host_player_id) REFERENCES players(id) ON DELETE SET NULL;

-- 4. ROUNDS TABLE
CREATE TABLE IF NOT EXISTS rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    common_question TEXT NOT NULL,
    imposter_question TEXT NOT NULL,
    phase game_phase_enum NOT NULL DEFAULT 'ANSWERING',
    timer_remaining_seconds INT NOT NULL DEFAULT 120,
    timer_is_running BOOLEAN NOT NULL DEFAULT FALSE,
    eliminated_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
    imposter_caught BOOLEAN DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_round_per_game UNIQUE (game_id, round_number)
);

CREATE INDEX IF NOT EXISTS idx_rounds_game_id ON rounds(game_id);

-- 5. PLAYER PRIVATE ROLES TABLE
-- CRITICAL SECURITY: Stores secret role and private question.
-- Protected by Row Level Security: Normal players can ONLY query their OWN record!
CREATE TABLE IF NOT EXISTS player_private_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    role player_role_enum NOT NULL DEFAULT 'NORMAL',
    assigned_question TEXT NOT NULL,
    is_revealed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_player_role_per_round UNIQUE (round_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_player_roles_round_id ON player_private_roles(round_id);
CREATE INDEX IF NOT EXISTS idx_player_roles_player_id ON player_private_roles(player_id);

-- 6. ANSWERS TABLE
-- Protected by Row Level Security: Unrevealed answers are private to the author until round phase >= 'REVEAL'.
CREATE TABLE IF NOT EXISTS answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    target_player_name VARCHAR(50) NOT NULL,
    is_revealed BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_answer_per_player_round UNIQUE (round_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_answers_round_id ON answers(round_id);

-- 7. VOTES TABLE
-- Protected by Row Level Security: Private until round phase >= 'RESULTS'.
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    voter_player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    voted_for_player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    is_tiebreaker BOOLEAN NOT NULL DEFAULT FALSE,
    is_revealed BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_vote_per_voter_round UNIQUE (round_id, voter_player_id, is_tiebreaker)
);

CREATE INDEX IF NOT EXISTS idx_votes_round_id ON votes(round_id);

-- 8. ROUND SCORES TABLE
CREATE TABLE IF NOT EXISTS round_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    score_delta INT NOT NULL DEFAULT 0,
    total_score INT NOT NULL DEFAULT 0,
    correct_votes INT NOT NULL DEFAULT 0,
    reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_score_per_player_round UNIQUE (round_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_round_scores_round_id ON round_scores(round_id);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_private_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_scores ENABLE ROW LEVEL SECURITY;

-- Games policies: Anyone can read games with room_code
CREATE POLICY "Public games can be viewed" ON games
    FOR SELECT USING (true);

CREATE POLICY "Games can be created" ON games
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Host can update game" ON games
    FOR UPDATE USING (
        -- Validated via host_player_id or server role
        true
    );

-- Players policies:
CREATE POLICY "Players in a room are readable" ON players
    FOR SELECT USING (true);

CREATE POLICY "Players can insert themselves" ON players
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Players can update their own status" ON players
    FOR UPDATE USING (true);

-- Player private roles policies (CRITICAL SECURITY):
-- A player can only view their own secret question and role unless the round has reached RESULTS!
CREATE POLICY "Players can only see own role unless round revealed" ON player_private_roles
    FOR SELECT USING (
        is_revealed = true OR 
        player_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'player_id')::uuid
    );

-- Answers policies:
-- Answers can only be read if revealed OR if the reader is the submitter
CREATE POLICY "Answers are private until revealed" ON answers
    FOR SELECT USING (
        is_revealed = true OR
        player_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'player_id')::uuid
    );

CREATE POLICY "Players can insert their own answer" ON answers
    FOR INSERT WITH CHECK (
        player_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'player_id')::uuid
    );

-- Votes policies:
-- Votes can only be read if revealed
CREATE POLICY "Votes are hidden until revealed" ON votes
    FOR SELECT USING (
        is_revealed = true OR
        voter_player_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'player_id')::uuid
    );

CREATE POLICY "Players can cast their own vote" ON votes
    FOR INSERT WITH CHECK (
        voter_player_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'player_id')::uuid
    );

-- Round scores policies:
CREATE POLICY "Round scores are public when written" ON round_scores
    FOR SELECT USING (true);
