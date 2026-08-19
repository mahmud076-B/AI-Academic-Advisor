import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
import { createClient } from '@supabase/supabase-js';
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const EMBEDDING_MODEL = 'text-embedding-3-small';

// UUID Mapping from seed.sql
const COURSE_MAP = {
  'CSE 3101': 'c0000000-0000-0000-0000-000000000101',
  'CSE 3102': 'c0000000-0000-0000-0000-000000000102',
  'CSE 3103': 'c0000000-0000-0000-0000-000000000103',
  'CSE 3104': 'c0000000-0000-0000-0000-000000000104',
  'CSE 3105': 'c0000000-0000-0000-0000-000000000105',
  'CSE 3106': 'c0000000-0000-0000-0000-000000000106',
  'CSE 3107': 'c0000000-0000-0000-0000-000000000107',
  'MAT 3141': 'c0000000-0000-0000-0000-000000003141'
};

const SYLLABUS_FILE = path.join(__dirname, '../5th_semester_syllabus_ocr.txt');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ingestSyllabus() {
  console.log('Starting syllabus ingestion...');

  if (!fs.existsSync(SYLLABUS_FILE)) {
    console.error(`Syllabus file not found at ${SYLLABUS_FILE}`);
    process.exit(1);
  }

  const fullText = fs.readFileSync(SYLLABUS_FILE, 'utf-8');
  console.log('Text length:', fullText ? fullText.length : 'undefined');
  console.log('Sample:', fullText ? fullText.substring(0, 500) : 'none');
  
  // Basic parsing logic to segment by course
  // In a real robust system, this would be more sophisticated based on exact PDF structure
  const coursesData = [];
  
  let currentCourse = null;
  let currentContent = [];

  const lines = fullText.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check if line starts a new course e.g., "CSE 3101: Computer Graphics"
    let match = null;
    for (const [code, id] of Object.entries(COURSE_MAP)) {
      if (line.startsWith(code)) {
        match = { code, id };
        break;
      }
    }

    if (match) {
      if (currentCourse) {
        coursesData.push({ ...currentCourse, text: currentContent.join('\n') });
      }
      currentCourse = match;
      currentContent = [line];
    } else if (currentCourse) {
      currentContent.push(line);
    }
  }
  
  if (currentCourse) {
    coursesData.push({ ...currentCourse, text: currentContent.join('\n') });
  }

  console.log(`Parsed ${coursesData.length} courses from PDF.`);

  let totalChunks = 0;
  let successfulEmbeddings = 0;
  let failedEmbeddings = 0;

  for (const course of coursesData) {
    console.log(`Processing ${course.code}...`);
    
    // 1. Create or retrieve course_syllabi row
    // First, deactivate any existing ones (for safety on reruns)
    await supabase.from('course_syllabi')
      .update({ is_active: false })
      .eq('course_id', course.id);

    const { data: syllabusEntry, error: insertError } = await supabase.from('course_syllabi')
      .insert({
        course_id: course.id,
        academic_year: '2026',
        semester_period: '5th',
        is_active: true
      })
      .select('id')
      .single();

    if (insertError) {
      console.error(`Failed to create course_syllabi for ${course.code}:`, insertError);
      continue;
    }

    // 2. Chunking strategy
    // Split by common syllabus headers like "Course Content:", "Recommended Books:", etc.
    const headers = [
      'Credit:', 
      'Pre-requisite:', 
      'Course Content:', 
      'Recommended Books:', 
      'Books Recommended:',
      'Basic Concept:',
      'Introduction:',
      'SQL:'
    ];

    const chunks = [];
    let currentHeader = 'General Information';
    let currentChunkLines = [];

    const courseLines = course.text.split('\n');
    for (const line of courseLines) {
      const isHeader = headers.some(h => line.startsWith(h));
      if (isHeader) {
        if (currentChunkLines.length > 0) {
          chunks.push({
            section_title: currentHeader,
            content: currentChunkLines.join('\n')
          });
        }
        currentHeader = line;
        currentChunkLines = [line];
      } else {
        currentChunkLines.push(line);
      }
    }
    if (currentChunkLines.length > 0) {
      chunks.push({
        section_title: currentHeader,
        content: currentChunkLines.join('\n')
      });
    }

    // Filter out meaningless tiny chunks
    const validChunks = chunks.filter(c => c.content.trim().length > 20);

    // 3. Generate embeddings and insert
    for (const chunk of validChunks) {
      totalChunks++;
      try {
        const textToEmbed = `Course: ${course.code}\nSection: ${chunk.section_title}\n\n${chunk.content}`;
        
        let success = false;
        let retries = 3;
        let delay = 1000;
        let embedding = null;

        while (retries > 0 && !success) {
          try {
            const result = await embed({
              model: openai.embedding(EMBEDDING_MODEL),
              value: textToEmbed,
            });
            embedding = result.embedding;
            success = true;
            successfulEmbeddings++;
          } catch (e) {
            if (e.message && e.message.includes('429')) {
              await sleep(delay);
              delay *= 2;
              retries--;
            } else {
              throw e;
            }
          }
        }

        if (!success) throw new Error('Max retries for embedding');

        const { error: chunkError } = await supabase.from('syllabus_chunks').insert({
          syllabus_id: syllabusEntry.id,
          course_id: course.id,
          section_title: chunk.section_title,
          content: chunk.content,
          embedding: embedding
        });

        if (chunkError) {
          console.error(`DB Insert failed for chunk in ${course.code}:`, chunkError);
          failedEmbeddings++;
        }

      } catch (err) {
        console.error(`Failed to process chunk for ${course.code}:`, err.message);
        failedEmbeddings++;
      }
    }
  }

  console.log('\n--- Ingestion Summary ---');
  console.log(`Courses processed: ${coursesData.length}`);
  console.log(`Total chunks generated: ${totalChunks}`);
  console.log(`Successful embeddings: ${successfulEmbeddings}`);
  console.log(`Failed embeddings: ${failedEmbeddings}`);
  console.log(`NULL embeddings: ${failedEmbeddings}`); 
}

ingestSyllabus().catch(console.error);
