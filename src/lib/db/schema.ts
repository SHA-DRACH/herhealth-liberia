/**
 * Database migrations. Each migration runs once, inside a transaction, in order.
 * Never edit a migration that has shipped — add a new one.
 *
 * Seeds here are limited to structure taken from the product specification (language codes,
 * category slugs) and the provisional safety lexicon. No health content, facilities,
 * users or statistics are seeded.
 */
export interface Migration {
  version: number;
  statements: string[];
}

const PENDING = "PENDING_REVIEW";

// Provisional safety lexicon. Derived only from the red-flag concepts named in the
// specification (§13) and their plain spelling variants. Every term starts as
// PENDING_REVIEW and must be validated by a qualified health professional in
// Admin → AI Safety Review. Pending terms are still enforced, because
// over-escalating is the safe failure direction.
// Syntax: words separated by spaces must appear as a phrase; "a + b" means both parts
// appear anywhere in the question. Each word matches as a prefix ("bleed" ≈ "bleeding").
const provisionalTerms: [string, string][] = [
  ["RED", "severe bleed"],
  ["RED", "heavy bleed"],
  ["RED", "bleeding heavily"],
  ["RED", "bleeding a lot"],
  ["RED", "pregnan + bleed"],
  ["RED", "unconscious"],
  ["RED", "passed out"],
  ["RED", "fainted"],
  ["RED", "not breathing"],
  ["RED", "difficulty breathing"],
  ["RED", "can't breathe"],
  ["RED", "cannot breathe"],
  ["RED", "seizure"],
  ["RED", "convuls"],
  ["RED", "pregnan + severe"],
  ["PROTECTION", "rape"],
  ["PROTECTION", "sexual abuse"],
  ["PROTECTION", "sexually abused"],
  ["PROTECTION", "abused me"],
  ["PROTECTION", "forced me"],
  ["PROTECTION", "forced sex"],
  ["PROTECTION", "violence"],
  ["PROTECTION", "beats me"],
  ["PROTECTION", "beat me"],
  ["PROTECTION", "hits me"],
  ["PROTECTION", "exploit"],
  ["PROTECTION", "traffick"],
  ["PROTECTION", "paying me + sex"],
  ["PROTECTION", "pays me + sex"],
  ["PROTECTION", "pay me + sex"],
  ["PROTECTION", "sex for money"],
  ["MENTAL_HEALTH_CRISIS", "suicid"],
  ["MENTAL_HEALTH_CRISIS", "kill myself"],
  ["MENTAL_HEALTH_CRISIS", "end my life"],
  ["MENTAL_HEALTH_CRISIS", "self harm"],
  ["MENTAL_HEALTH_CRISIS", "self-harm"],
  ["MENTAL_HEALTH_CRISIS", "hurt myself"],
  ["MENTAL_HEALTH_CRISIS", "want to die"],
  ["AMBER", "pain"],
  ["AMBER", "bleed"],
  ["AMBER", "discharge"],
  ["AMBER", "fever"],
  ["AMBER", "lump"],
  ["AMBER", "swollen"],
];

const sqlString = (s: string) => `'${s.replace(/'/g, "''")}'`;

export const migrations: Migration[] = [
  {
    version: 1,
    statements: [
      `CREATE EXTENSION IF NOT EXISTS vector`,

      `CREATE TABLE languages (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        native_name TEXT,
        status TEXT NOT NULL DEFAULT 'CANDIDATE' CHECK (status IN ('ACTIVE','CANDIDATE','INACTIVE')),
        sort_order INTEGER NOT NULL DEFAULT 100,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,

      `CREATE TABLE categories (
        id SERIAL PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        icon TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','HIDDEN'))
      )`,

      `CREATE TABLE admin_users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN','PRODUCT_ADMIN','HEALTH_REVIEWER','TRANSLATOR','LANGUAGE_REVIEWER','RESEARCH_MEAL')),
        status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DISABLED')),
        last_login TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,

      `CREATE TABLE admin_sessions (
        id SERIAL PRIMARY KEY,
        token_hash TEXT NOT NULL UNIQUE,
        admin_user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,

      `CREATE TABLE audit_log (
        id BIGSERIAL PRIMARY KEY,
        admin_user_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        entity TEXT NOT NULL,
        entity_id TEXT,
        details JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,

      `CREATE TABLE articles (
        id SERIAL PRIMARY KEY,
        category_id INTEGER NOT NULL REFERENCES categories(id),
        slug TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','MEDICAL_REVIEW','APPROVED','PUBLISHED','ARCHIVED')),
        medical_review_status TEXT NOT NULL DEFAULT 'NOT_REVIEWED' CHECK (medical_review_status IN ('NOT_REVIEWED','IN_REVIEW','CHANGES_REQUESTED','APPROVED')),
        medical_reviewer_id INTEGER REFERENCES admin_users(id),
        version INTEGER NOT NULL DEFAULT 1,
        created_by INTEGER REFERENCES admin_users(id),
        published_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,

      `CREATE TABLE article_translations (
        id SERIAL PRIMARY KEY,
        article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
        language_id INTEGER NOT NULL REFERENCES languages(id),
        title TEXT NOT NULL,
        summary TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL DEFAULT '',
        key_points TEXT NOT NULL DEFAULT '',
        warning_signs TEXT NOT NULL DEFAULT '',
        audio_url TEXT,
        audio_transcript TEXT,
        translation_status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (translation_status IN ('DRAFT','LANGUAGE_REVIEW','CHANGES_REQUESTED','PUBLISHED')),
        translator_id INTEGER REFERENCES admin_users(id),
        reviewer_id INTEGER REFERENCES admin_users(id),
        terminology_reviewed BOOLEAN NOT NULL DEFAULT false,
        comprehension_tested BOOLEAN NOT NULL DEFAULT false,
        version INTEGER NOT NULL DEFAULT 1,
        source_version INTEGER NOT NULL DEFAULT 1,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (article_id, language_id)
      )`,

      `CREATE TABLE knowledge_sources (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        organization TEXT NOT NULL,
        source_url TEXT,
        publication_date DATE,
        license TEXT NOT NULL,
        accessed_at DATE,
        status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','RETIRED')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,

      `CREATE TABLE article_sources (
        article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
        source_id INTEGER NOT NULL REFERENCES knowledge_sources(id),
        PRIMARY KEY (article_id, source_id)
      )`,

      `CREATE TABLE content_reviews (
        id SERIAL PRIMARY KEY,
        article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
        translation_id INTEGER REFERENCES article_translations(id) ON DELETE CASCADE,
        reviewer INTEGER REFERENCES admin_users(id),
        review_type TEXT NOT NULL CHECK (review_type IN ('MEDICAL','LANGUAGE')),
        status TEXT NOT NULL CHECK (status IN ('APPROVED','CHANGES_REQUESTED')),
        article_version INTEGER NOT NULL,
        comments TEXT,
        reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,

      // Retrieval index. Rows are only ever written by the indexer from PUBLISHED content,
      // and retrieval additionally re-checks status by join (defence in depth).
      `CREATE TABLE knowledge_chunks (
        id SERIAL PRIMARY KEY,
        article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
        translation_id INTEGER NOT NULL REFERENCES article_translations(id) ON DELETE CASCADE,
        language TEXT NOT NULL,
        title TEXT NOT NULL,
        chunk_type TEXT NOT NULL CHECK (chunk_type IN ('body','key_points','warning_signs')),
        content TEXT NOT NULL,
        medical_review_status TEXT NOT NULL,
        version INTEGER NOT NULL,
        source TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        tsv TSVECTOR NOT NULL,
        embedding VECTOR
      )`,
      `CREATE INDEX knowledge_chunks_tsv_idx ON knowledge_chunks USING GIN (tsv)`,

      `CREATE TABLE facilities (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        facility_type TEXT NOT NULL DEFAULT 'FACILITY' CHECK (facility_type IN ('FACILITY','HOTLINE')),
        county TEXT NOT NULL,
        district TEXT,
        address TEXT,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        phone TEXT,
        opening_hours TEXT,
        services TEXT[] NOT NULL DEFAULT '{}',
        verified BOOLEAN NOT NULL DEFAULT false,
        verified_at TIMESTAMPTZ,
        verified_by INTEGER REFERENCES admin_users(id),
        verification_source TEXT,
        status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PUBLISHED','ARCHIVED')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CHECK (status <> 'PUBLISHED' OR (verified AND verified_at IS NOT NULL AND verification_source IS NOT NULL))
      )`,

      // No IP address, user agent or other identifier is stored.
      `CREATE TABLE anonymous_sessions (
        id UUID PRIMARY KEY,
        language TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        last_active TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,

      // Raw question text is never stored; only a keyed hash (to count repeats).
      `CREATE TABLE ai_queries (
        id BIGSERIAL PRIMARY KEY,
        session_id UUID,
        language TEXT,
        intent TEXT,
        risk_level TEXT NOT NULL,
        question_hash TEXT NOT NULL,
        response_status TEXT NOT NULL,
        retrieval_score DOUBLE PRECISION,
        provider TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,

      `CREATE TABLE feedback (
        id BIGSERIAL PRIMARY KEY,
        session_id UUID,
        content_type TEXT NOT NULL CHECK (content_type IN ('article','answer','app')),
        content_id TEXT,
        rating SMALLINT CHECK (rating IN (-1, 1)),
        comment TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,

      `CREATE TABLE analytics_events (
        id BIGSERIAL PRIMARY KEY,
        anonymous_session_id UUID,
        event_name TEXT NOT NULL,
        category TEXT,
        language TEXT,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,
      `CREATE INDEX analytics_events_name_idx ON analytics_events (event_name, created_at)`,

      `CREATE TABLE ui_translations (
        id SERIAL PRIMARY KEY,
        language_code TEXT NOT NULL REFERENCES languages(code),
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PUBLISHED')),
        translator_id INTEGER REFERENCES admin_users(id),
        reviewer_id INTEGER REFERENCES admin_users(id),
        version INTEGER NOT NULL DEFAULT 1,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (language_code, key)
      )`,

      `CREATE TABLE safety_terms (
        id SERIAL PRIMARY KEY,
        term TEXT NOT NULL,
        risk_level TEXT NOT NULL CHECK (risk_level IN ('AMBER','RED','PROTECTION','MENTAL_HEALTH_CRISIS')),
        language TEXT NOT NULL DEFAULT 'en',
        status TEXT NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (status IN ('PENDING_REVIEW','APPROVED','RETIRED')),
        notes TEXT,
        created_by INTEGER REFERENCES admin_users(id),
        reviewed_by INTEGER REFERENCES admin_users(id),
        reviewed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (term, risk_level, language)
      )`,

      `CREATE TABLE safety_test_runs (
        id SERIAL PRIMARY KEY,
        run_by INTEGER REFERENCES admin_users(id),
        provider TEXT NOT NULL,
        total INTEGER NOT NULL,
        passed INTEGER NOT NULL,
        red_total INTEGER NOT NULL,
        red_passed INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,
      `CREATE TABLE safety_test_results (
        id SERIAL PRIMARY KEY,
        run_id INTEGER NOT NULL REFERENCES safety_test_runs(id) ON DELETE CASCADE,
        case_code TEXT NOT NULL,
        expected_risk TEXT NOT NULL,
        actual_risk TEXT NOT NULL,
        expected_pathway TEXT NOT NULL,
        actual_pathway TEXT NOT NULL,
        passed BOOLEAN NOT NULL,
        failure_reasons TEXT
      )`,

      `CREATE TABLE usability_tests (
        id SERIAL PRIMARY KEY,
        test_code TEXT NOT NULL UNIQUE,
        test_date DATE NOT NULL,
        participant_code TEXT NOT NULL,
        age_range TEXT NOT NULL CHECK (age_range IN ('15-17','18-24','25-34','35-44','45+','PREFER_NOT')),
        language TEXT NOT NULL,
        device TEXT,
        tasks_assigned INTEGER NOT NULL DEFAULT 5,
        tasks_completed INTEGER NOT NULL,
        task_results JSONB,
        completion_seconds INTEGER,
        errors INTEGER NOT NULL DEFAULT 0,
        ease_rating SMALLINT CHECK (ease_rating BETWEEN 1 AND 5),
        understandable_rating SMALLINT CHECK (understandable_rating BETWEEN 1 AND 5),
        would_be_useful TEXT CHECK (would_be_useful IN ('YES','NO','UNSURE')),
        difficulties TEXT,
        improvements TEXT,
        comments TEXT,
        consent_confirmed BOOLEAN NOT NULL CHECK (consent_confirmed),
        recorded_by INTEGER REFERENCES admin_users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,

      // Seeds: language candidates and categories named in the specification.
      `INSERT INTO languages (code, name, status, sort_order) VALUES
        ('en','English','ACTIVE',1),
        ('lir-en','Liberian English','CANDIDATE',2),
        ('kpe','Kpelle','CANDIDATE',10),
        ('bassa','Bassa','CANDIDATE',11),
        ('vai','Vai','CANDIDATE',12),
        ('dan','Dan','CANDIDATE',13),
        ('mano','Mano','CANDIDATE',14),
        ('loma','Loma','CANDIDATE',15),
        ('kissi','Kissi','CANDIDATE',16),
        ('grebo','Grebo','CANDIDATE',17),
        ('krahn','Krahn','CANDIDATE',18)`,
      `INSERT INTO categories (slug, icon, sort_order) VALUES
        ('menstrual-health','🌸',1),
        ('pregnancy','🤰',2),
        ('family-planning','💊',3),
        ('sexual-health','💜',4),
        ('sti-hiv','🎗️',5),
        ('hpv-cervical','🩺',6),
        ('maternal-health','👶',7),
        ('mental-wellbeing','🧠',8)`,
      `INSERT INTO safety_terms (term, risk_level, status, notes) VALUES ` +
        provisionalTerms
          .map(([level, term]) => `(${sqlString(term)}, '${level}', '${PENDING}', 'Provisional: derived from specification section 13; requires medical validation')`)
          .join(","),
    ],
  },
  {
    // Separates real participant activity from internal development so evidence is not contaminated.
    // Rows recorded before this migration were all internal development activity.
    version: 2,
    statements: [
      ...["anonymous_sessions", "analytics_events", "ai_queries", "feedback"].flatMap((t) => [
        `ALTER TABLE ${t} ADD COLUMN environment TEXT NOT NULL DEFAULT 'development'
           CHECK (environment IN ('development','testing','pilot','production'))`,
        `CREATE INDEX ${t}_environment_idx ON ${t} (environment)`,
      ]),
      // Controlled safety texts (emergency page and safety pathways). Shown to the public only
      // once a Health Reviewer who did not write them has approved the current version.
      `CREATE TABLE safety_messages (
        key TEXT PRIMARY KEY CHECK (key IN ('emergency_page','red','protection','crisis','medication')),
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','APPROVED')),
        version INTEGER NOT NULL DEFAULT 1,
        updated_by INTEGER REFERENCES admin_users(id),
        reviewed_by INTEGER REFERENCES admin_users(id),
        reviewed_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CHECK (status <> 'APPROVED' OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
      )`,
    ],
  },
];
