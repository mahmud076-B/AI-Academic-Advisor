-- ==============================================================================
-- AI ACADEMIC ADVISOR - INITIAL SCHEMA MIGRATION
-- Generated according to STEP 37 and STEP 38 Specifications
-- ==============================================================================

-- ==========================================
-- 1. EXTENSIONS
-- ==========================================
-- pgcrypto is required for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==========================================
-- 2. TABLE CREATION (Dependency Order)
-- ==========================================

-- 1. courses
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    credit_hours INTEGER,
    department TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    student_id TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    batch TEXT NOT NULL,
    section TEXT NOT NULL,
    current_semester TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. enrollments
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    academic_period TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (student_id, course_id, academic_period)
);

-- 4. class_routine_entries
CREATE TABLE IF NOT EXISTS class_routine_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department TEXT NOT NULL,
    batch TEXT NOT NULL,
    section TEXT NOT NULL,
    semester TEXT NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    course_name_override TEXT,
    day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL CHECK (end_time > start_time),
    room TEXT,
    instructor_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (course_id IS NOT NULL OR course_name_override IS NOT NULL)
);

-- 5. conversations
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. experiences
CREATE TABLE IF NOT EXISTS experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'shared')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. campus_memories
CREATE TABLE IF NOT EXISTS campus_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    tags TEXT[],
    source_experience_id UUID UNIQUE REFERENCES experiences(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ==========================================
-- 3. INDEX CREATION
-- ==========================================

-- profiles: Academic Group Lookup
CREATE INDEX IF NOT EXISTS idx_profiles_academic_group 
ON profiles (department, batch, section, current_semester);

-- courses: Department
CREATE INDEX IF NOT EXISTS idx_courses_department 
ON courses (department);

-- enrollments: Foreign Keys
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments (student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments (course_id);

-- class_routine_entries: Academic Group Lookup
CREATE INDEX IF NOT EXISTS idx_class_routine_academic_group 
ON class_routine_entries (department, batch, section, semester);
CREATE INDEX IF NOT EXISTS idx_class_routine_day_of_week ON class_routine_entries (day_of_week);
CREATE INDEX IF NOT EXISTS idx_class_routine_course_id ON class_routine_entries (course_id);

-- class_routine_entries: ** TWO PARTIAL UNIQUE INDEXES **
CREATE UNIQUE INDEX IF NOT EXISTS idx_class_routine_course_not_null 
ON class_routine_entries (department, batch, section, semester, course_id, day_of_week, start_time)
WHERE course_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_class_routine_course_null 
ON class_routine_entries (department, batch, section, semester, course_name_override, day_of_week, start_time)
WHERE course_id IS NULL;

-- conversations: Ownership & Ordering
CREATE INDEX IF NOT EXISTS idx_conversations_student_id ON conversations (student_id);
CREATE INDEX IF NOT EXISTS idx_conversations_recent ON conversations (student_id, updated_at DESC);

-- messages: Thread ordering
CREATE INDEX IF NOT EXISTS idx_messages_thread_order 
ON messages (conversation_id, created_at ASC);

-- experiences: Ownership
CREATE INDEX IF NOT EXISTS idx_experiences_student_id ON experiences (student_id);
CREATE INDEX IF NOT EXISTS idx_experiences_visibility ON experiences (visibility);

-- campus_memories: GIN & Category
CREATE INDEX IF NOT EXISTS idx_campus_memories_category ON campus_memories (category);
CREATE INDEX IF NOT EXISTS idx_campus_memories_tags ON campus_memories USING GIN (tags);

-- campus_memories: PostgreSQL FTS GIN Index
CREATE INDEX IF NOT EXISTS idx_campus_memories_fts 
ON campus_memories USING GIN (to_tsvector('english', content));


-- ==========================================
-- 4. RLS ENABLEMENT
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_routine_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus_memories ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- 5. RLS POLICIES
-- ==========================================

-- profiles
DROP POLICY IF EXISTS "Students can access own profile" ON profiles;
CREATE POLICY "Students can access own profile" 
ON profiles FOR ALL 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- courses
DROP POLICY IF EXISTS "Authenticated users can select courses" ON courses;
CREATE POLICY "Authenticated users can select courses" 
ON courses FOR SELECT 
USING (auth.role() = 'authenticated');
-- (Service role implicitly handles inserts/updates/deletes)

-- enrollments
DROP POLICY IF EXISTS "Students can access own enrollments" ON enrollments;
CREATE POLICY "Students can access own enrollments" 
ON enrollments FOR ALL 
USING (auth.uid() = student_id) 
WITH CHECK (auth.uid() = student_id);

-- class_routine_entries
DROP POLICY IF EXISTS "Students can view matching routine" ON class_routine_entries;
CREATE POLICY "Students can view matching routine" 
ON class_routine_entries FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.department = class_routine_entries.department
        AND profiles.batch = class_routine_entries.batch
        AND profiles.section = class_routine_entries.section
        AND profiles.current_semester = class_routine_entries.semester
    )
);

-- conversations
DROP POLICY IF EXISTS "Students can access own conversations" ON conversations;
CREATE POLICY "Students can access own conversations" 
ON conversations FOR ALL 
USING (auth.uid() = student_id) 
WITH CHECK (auth.uid() = student_id);

-- messages
DROP POLICY IF EXISTS "Students can view own conversation messages" ON messages;
CREATE POLICY "Students can view own conversation messages" 
ON messages FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM conversations
        WHERE conversations.id = messages.conversation_id
        AND conversations.student_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Students can insert user messages into own conversations" ON messages;
CREATE POLICY "Students can insert user messages into own conversations" 
ON messages FOR INSERT 
WITH CHECK (
    role = 'user' AND 
    EXISTS (
        SELECT 1 FROM conversations
        WHERE conversations.id = messages.conversation_id
        AND conversations.student_id = auth.uid()
    )
);

-- experiences
DROP POLICY IF EXISTS "Students can access own experiences" ON experiences;
CREATE POLICY "Students can access own experiences" 
ON experiences FOR ALL 
USING (auth.uid() = student_id) 
WITH CHECK (auth.uid() = student_id);

-- campus_memories
DROP POLICY IF EXISTS "Authenticated users can select campus memories" ON campus_memories;
CREATE POLICY "Authenticated users can select campus memories" 
ON campus_memories FOR SELECT 
USING (auth.role() = 'authenticated');
-- (Service role implicitly handles inserts/updates/deletes)
