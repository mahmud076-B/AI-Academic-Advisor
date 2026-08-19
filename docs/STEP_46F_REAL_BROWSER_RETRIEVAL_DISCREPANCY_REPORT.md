# STEP 46F: Real Browser Retrieval Discrepancy Debugging Report

## A. Browser Test Reproduction
Using the browser subagent, we simulated the exact user journey.
**Input:** `"Data Structures-এর বই খুঁজতে কোথায় যাব?"`
**Actual AI Response:** The AI ignored Campus Memory entirely and provided generic advice: *"ডেটা স্ট্রাকচার সম্পর্কিত বই খুঁজতে বিশ্ববিদ্যালয়ের লাইব্রেরিতে যেতে পারেন..."*

## B. Script vs Browser Comparison
| Layer | E2E Script (Previous) | Real Browser |
|---|---|---|
| Request | "Where is the book?" | "Data Structures-এর বই খুঁজতে কোথায় যাব?" |
| Contextualization Prompt | Extracted hardcoded keywords | LLM echoed the full Bengali sentence. |
| Query Text | `"Data Structure book"` | `"Data Structures-এর বই খুঁজতে কোথায় যাব?"` |
| Embedding generated? | Yes | Yes |
| RPC execution? | Yes | Yes |
| Retrieved Memories | **2 results** (sim: ~0.59) | **0 results** |
| System Prompt Context | Injected | Missing |
| Final Output | Specific (Bookshelf 3) | Generic Library Advice |

## C. Actual OpenAI Input Analysis
Through detailed backend logging (`chat_debug.jsonl`), we confirmed that the `retrievedMemories` array was completely empty when hitting the browser route. Consequently, no campus memory was ever injected into the OpenAI system prompt. 

## F. First Divergence Point & Root Cause
The root cause was two-fold:
1. **Query Contextualization Bug**: GPT-4o-mini completely ignored the instruction to "Extract 2-5 core keywords" when faced with a Bengali string. It instead echoed the full Bengali sentence back. 
2. **Retrieval Bug**: The default `.env.local` `MATCH_THRESHOLD` of `0.75` was astronomically high. OpenAI's `text-embedding-3-small` routinely scores cross-lingual or semantically disjoint phrases between `0.40` and `0.65`. Because the query was fully Bengali and the memory had a mix of English/Bengali, the similarity scored at `0.465`, failing the 0.75 threshold.

**Root Causes Selected:**
- **B.** Browser reaches retrieval but query differs (contextualization bug)
- **C.** Browser retrieves no relevant memory (threshold mismatch)
- **E.** Grounding Instructions were extremely weak ("Do not invent university data" was the only constraint).

## H. The Fix
We implemented three surgical fixes in `src/app/api/chat/route.ts`:
1. **Prompt Engineering:** Rewrote the contextualization system prompt to enforce strict English keyword extraction (e.g., `data structure book location`).
2. **Threshold Calibration:** Lowered `MATCH_THRESHOLD` to `0.40` to properly capture `text-embedding-3-small` semantic bounds.
3. **Strict Grounding:** Replaced the weak system instructions with a massive priority block (`=== CRITICAL CAMPUS KNOWLEDGE ===`) forcing the AI to strictly rely on retrieved facts over its generic safety priors.

## I. Real Browser Retest
After deploying the fix, we retested the browser subagent:
**Input:** `"Data Structures-এর বই খুঁজতে কোথায় যাব?"`
**New AI Response:** *"Data Structure বইটি লাইব্রেরির উত্তর দিকে, 3 নম্বর বইশেলফে, 5ম রোতে আছে।..."*

## J. Regression Results
We ran a full regression suite directly through the modified LLM pipeline:
- `"Where is the Data Structure book?"` ➔ **PASS** (Generated query: `data structure book location` | Extracted: 2 memories)
- `"Data Structures-এর বইটা কোথায়?"` ➔ **PASS** (Generated query: `data structure book location` | Extracted: 2 memories)
- `"বইটা কোথায়?"` (after context) ➔ **PASS** (Generated query: `data structure book location` | Extracted: 2 memories)
- `"ক্যান্টিনে কখন কম ভিড় থাকে?"` ➔ **PASS** (Generated query: `canteen crowd timing` | Extracted: 1 memory)
- `"Canteen e rush kokhon kom thake?"` ➔ **PASS** (Generated query: `canteen rush timing` | Extracted: 1 memory)
- `"How do I bake a chocolate cake?"` ➔ **PASS** (Generated query: `chocolate cake, baking, recipe` | Extracted: 0 memories)

## L. Final Verdict
**C. REAL BROWSER CAMPUS MEMORY VERIFIED**
The exact browser questions now safely extract semantic keywords, bypass language barriers, retrieve the exact correct database rows, strictly ground the LLM, and produce answers perfectly tied to actual stored memories.
