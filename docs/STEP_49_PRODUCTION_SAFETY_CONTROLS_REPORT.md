# STEP 49: Production Safety Controls

## A. Rate-limit design
Implemented a lightweight, in-memory `Map`-based rate limiter within the Next.js API route (`src/app/api/chat/route.ts`). It employs a sliding window (array of timestamps) approach, allowing a maximum of 10 messages per minute per authenticated user ID. 

**Vercel Limitations:** In a serverless environment (like Vercel), in-memory state resets upon cold starts and isn't shared across edge nodes. However, for MVP protection against naive spam scripts and runaway loops, this is a perfectly acceptable local limiter that avoids the cost and complexity of spinning up a Redis cluster.

## B. Input limits
Added hard bounds to critical user inputs to prevent database bloat and UI breakage:
- **Chat Message Length:** Capped at 1,000 characters.
- **Experience Title:** Restricted to 5-150 characters.
- **Experience Content:** Restricted to 15-3000 characters.
All text inputs are `.trim()`ed to reject whitespace-only spam.

## C. Campus Memory abuse protection
Added a specific rate limiter to the Experience Creation and Visibility Update actions (`src/app/experiences/actions.ts`). A user can only share or create a maximum of 5 shared experiences per 5-minute window. This prevents rapid duplication and spamming of the global Campus Memory space, preserving the quality of vector search without needing a manual human moderation queue.

## D. Embedding cost protection
By implementing the "5 shares per 5 minutes" rate limit, we naturally throttle the calls to the OpenAI embedding API. Repeated toggling of the visibility switch is now rate-limited, preventing users from burning through embedding credits by toggling a memory between 'private' and 'shared' multiple times in rapid succession.

## E. Security verification
- The rate limiter is strictly server-side; it cannot be bypassed by modifying client state or disabling JavaScript.
- RLS policies remain untouched and actively enforce privacy.
- `createAdminClient()` and `SUPABASE_SERVICE_ROLE_KEY` continue to be isolated strictly within server actions.

## F. Error handling
When a limit is exceeded, a graceful, non-technical error is returned:
- Chat: `429 Too Many Requests` with a clear message: "Rate limit exceeded. Please wait a minute before sending more messages."
- Experiences: Redirects safely to the form with `?error=Rate_Limit_Exceeded` or length-specific errors (`?error=Invalid_Title_Length`), preventing internal DB stack traces from leaking to the UI.

## G. Test results
- Verified that sending 11 rapid chat requests returns the 429 error text.
- Verified that attempting to submit an empty or whitespace-only experience title gets rejected.
- Verified that submitting a 4000-character experience content is blocked.
- Evaluated the in-memory maps behavior and verified that expired timestamps are successfully garbage-collected from the array.

## H. Limitations
Because the rate limit is in-memory:
1. It will reset if the Next.js Node.js process restarts.
2. If deployed to a multi-node or serverless edge environment, the limit applies per-node. A highly sophisticated distributed attack could bypass it. For an MVP, this is an acceptable tradeoff against the architectural overhead of Redis.

## I. Production deployment considerations
The application is now safe from the most common forms of accidental and naive malicious abuse (spamming the submit button, stuck loops). It is ready for Vercel/Supabase deployment.

## J. Final verdict

**B. PRODUCTION SAFETY CONTROLS COMPLETE**
