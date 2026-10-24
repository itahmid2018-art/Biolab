import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI client
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Resilient Gemini helper with model fallbacks to handle 503 high-demand spikes gracefully
async function generateGeminiWithFallback(params: {
  contents: string | any;
  systemInstruction?: string;
  responseMimeType?: string;
  temperature?: number;
}): Promise<string | null> {
  if (!ai) return null;
  // Use gemini-3.8-flash as primary model and gemini-3.1-flash-lite as high-throughput resilient fallback
  const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];

  for (const model of modelsToTry) {
    try {
      const generatePromise = ai.models.generateContent({
        model,
        contents: params.contents,
        config: {
          systemInstruction: params.systemInstruction,
          responseMimeType: params.responseMimeType,
          temperature: params.temperature ?? 0.7,
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Generation timeout')), 9000)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);
      if (response && response.text) {
        return response.text;
      }
    } catch {
      // Quietly wait briefly and test fallback model
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
  }
  return null;
}


// In-memory cache for scientific structures to minimize redundant upstream requests
const pdbCache = new Map<string, string>();
const alphafoldCache = new Map<string, string>();
const pubchemCache = new Map<string, any>();

// Exponential backoff helper complying with Science Skill
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
  baseDelayMs = 600
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      if (
        (response.status === 429 || response.status >= 500) &&
        attempt < maxRetries
      ) {
        const retryAfter = Number(response.headers.get('Retry-After'));
        const delay =
          !Number.isNaN(retryAfter) && retryAfter > 0
            ? retryAfter * 1000
            : baseDelayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      const errorBody = await response.text().catch(() => '');
      throw new Error(
        `HTTP ${response.status} (${response.statusText}) from ${url}: ${errorBody.slice(0, 300)}`
      );
    } catch (err: any) {
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error(`Exhausted retries for ${url}`);
}

// ==========================================
// 1. SCIENTIFIC DATA ENDPOINTS (Science Skill)
// ==========================================

// PDB mmCIF Coordinate Fetcher
app.get('/api/science/pdb/:pdbId', async (req, res) => {
  const pdbId = req.params.pdbId.trim().toUpperCase();
  if (!pdbId || pdbId.length !== 4) {
    return res.status(400).json({ error: 'Invalid 4-character PDB accession ID' });
  }

  if (pdbCache.has(pdbId)) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(pdbCache.get(pdbId));
  }

  try {
    const url = `https://files.rcsb.org/download/${pdbId}.cif`;
    const upstreamRes = await fetchWithRetry(url);
    const cifData = await upstreamRes.text();
    pdbCache.set(pdbId, cifData);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(cifData);
  } catch (err: any) {
    console.error(`Error fetching PDB ${pdbId}:`, err);
    return res.status(502).json({ error: `Could not retrieve PDB structure ${pdbId}: ${err.message}` });
  }
});

// AlphaFold DB Structure Coordinate Fetcher
app.get('/api/science/alphafold/:uniprotId', async (req, res) => {
  const uniprotId = req.params.uniprotId.trim().toUpperCase();
  if (!uniprotId) {
    return res.status(400).json({ error: 'UniProt accession ID required' });
  }

  if (alphafoldCache.has(uniprotId)) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(alphafoldCache.get(uniprotId));
  }

  try {
    const metaUrl = `https://alphafold.ebi.ac.uk/api/prediction/${uniprotId}`;
    const metaRes = await fetchWithRetry(metaUrl);
    const metaJson: any = await metaRes.json();
    const cifUrl = metaJson?.[0]?.cifUrl || `https://alphafold.ebi.ac.uk/files/AF-${uniprotId}-F1-model_v6.cif`;

    const cifRes = await fetchWithRetry(cifUrl);
    const cifData = await cifRes.text();
    alphafoldCache.set(uniprotId, cifData);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(cifData);
  } catch (err: any) {
    console.error(`Error fetching AlphaFold ${uniprotId}:`, err);
    return res.status(502).json({ error: `Could not retrieve AlphaFold structure ${uniprotId}: ${err.message}` });
  }
});

// PubChem Compound Property & 2D Layout Fetcher
app.get('/api/science/pubchem/:cid', async (req, res) => {
  const cid = req.params.cid.trim();
  if (!cid) {
    return res.status(400).json({ error: 'PubChem CID required' });
  }

  if (pubchemCache.has(cid)) {
    return res.json(pubchemCache.get(cid));
  }

  try {
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/Title,MolecularFormula,MolecularWeight,CanonicalSMILES,IUPACName/JSON`;
    const resp = await fetchWithRetry(url);
    const data: any = await resp.json();
    const props = data?.PropertyTable?.Properties?.[0] || {};
    pubchemCache.set(cid, props);
    return res.json(props);
  } catch (err: any) {
    console.error(`Error fetching PubChem CID ${cid}:`, err);
    return res.status(502).json({ error: `Could not retrieve PubChem compound ${cid}: ${err.message}` });
  }
});

// Universal Molecular Structure Coordinates Fetcher (supports PDB IDs, PubChem CIDs, and small molecules)
const STRUCTURE_FALLBACKS: Record<string, string> = {
  methane: `HETATM    1  C1  CH4 A   1       0.000   0.000   0.000  1.00 20.00           C  
HETATM    2  H1  CH4 A   1       0.629   0.629   0.629  1.00 20.00           H  
HETATM    3  H2  CH4 A   1      -0.629  -0.629   0.629  1.00 20.00           H  
HETATM    4  H3  CH4 A   1      -0.629   0.629  -0.629  1.00 20.00           H  
HETATM    5  H4  CH4 A   1       0.629  -0.629  -0.629  1.00 20.00           H  
CONECT    1    2    3    4    5
END`,
  '297': `HETATM    1  C1  CH4 A   1       0.000   0.000   0.000  1.00 20.00           C  
HETATM    2  H1  CH4 A   1       0.629   0.629   0.629  1.00 20.00           H  
HETATM    3  H2  CH4 A   1      -0.629  -0.629   0.629  1.00 20.00           H  
HETATM    4  H3  CH4 A   1      -0.629   0.629  -0.629  1.00 20.00           H  
HETATM    5  H4  CH4 A   1       0.629  -0.629  -0.629  1.00 20.00           H  
CONECT    1    2    3    4    5
END`,
  sugar: `HETATM    1  C1  GLC A   1       1.188  -0.370  -0.125  1.00 20.00           C  
HETATM    2  C2  GLC A   1       0.518   0.942  -0.540  1.00 20.00           C  
HETATM    3  C3  GLC A   1      -1.000   0.887  -0.347  1.00 20.00           C  
HETATM    4  C4  GLC A   1      -1.428  -0.380  -1.085  1.00 20.00           C  
HETATM    5  C5  GLC A   1      -0.704  -1.611  -0.537  1.00 20.00           C  
HETATM    6  C6  GLC A   1      -1.129  -2.915  -1.222  1.00 20.00           C  
HETATM    7  O1  GLC A   1       2.564  -0.320  -0.428  1.00 20.00           O  
HETATM    8  O2  GLC A   1       0.865   1.238  -1.890  1.00 20.00           O  
HETATM    9  O3  GLC A   1      -1.616   2.032  -0.906  1.00 20.00           O  
HETATM   10  O4  GLC A   1      -2.827  -0.505  -0.957  1.00 20.00           O  
HETATM   11  O5  GLC A   1       0.706  -1.478  -0.725  1.00 20.00           O  
HETATM   12  O6  GLC A   1      -0.515  -4.017  -0.573  1.00 20.00           O  
CONECT    1    2    7   11
CONECT    2    1    3    8
CONECT    3    2    4    9
CONECT    4    3    5   10
CONECT    5    4    6   11
CONECT    6    5   12
END`,
  glucose: `HETATM    1  C1  GLC A   1       1.188  -0.370  -0.125  1.00 20.00           C  
HETATM    2  C2  GLC A   1       0.518   0.942  -0.540  1.00 20.00           C  
HETATM    3  C3  GLC A   1      -1.000   0.887  -0.347  1.00 20.00           C  
HETATM    4  C4  GLC A   1      -1.428  -0.380  -1.085  1.00 20.00           C  
HETATM    5  C5  GLC A   1      -0.704  -1.611  -0.537  1.00 20.00           C  
HETATM    6  C6  GLC A   1      -1.129  -2.915  -1.222  1.00 20.00           C  
HETATM    7  O1  GLC A   1       2.564  -0.320  -0.428  1.00 20.00           O  
HETATM    8  O2  GLC A   1       0.865   1.238  -1.890  1.00 20.00           O  
HETATM    9  O3  GLC A   1      -1.616   2.032  -0.906  1.00 20.00           O  
HETATM   10  O4  GLC A   1      -2.827  -0.505  -0.957  1.00 20.00           O  
HETATM   11  O5  GLC A   1       0.706  -1.478  -0.725  1.00 20.00           O  
HETATM   12  O6  GLC A   1      -0.515  -4.017  -0.573  1.00 20.00           O  
CONECT    1    2    7   11
CONECT    2    1    3    8
CONECT    3    2    4    9
CONECT    4    3    5   10
CONECT    5    4    6   11
CONECT    6    5   12
END`,
  '5793': `HETATM    1  C1  GLC A   1       1.188  -0.370  -0.125  1.00 20.00           C  
HETATM    2  C2  GLC A   1       0.518   0.942  -0.540  1.00 20.00           C  
HETATM    3  C3  GLC A   1      -1.000   0.887  -0.347  1.00 20.00           C  
HETATM    4  C4  GLC A   1      -1.428  -0.380  -1.085  1.00 20.00           C  
HETATM    5  C5  GLC A   1      -0.704  -1.611  -0.537  1.00 20.00           C  
HETATM    6  C6  GLC A   1      -1.129  -2.915  -1.222  1.00 20.00           C  
HETATM    7  O1  GLC A   1       2.564  -0.320  -0.428  1.00 20.00           O  
HETATM    8  O2  GLC A   1       0.865   1.238  -1.890  1.00 20.00           O  
HETATM    9  O3  GLC A   1      -1.616   2.032  -0.906  1.00 20.00           O  
HETATM   10  O4  GLC A   1      -2.827  -0.505  -0.957  1.00 20.00           O  
HETATM   11  O5  GLC A   1       0.706  -1.478  -0.725  1.00 20.00           O  
HETATM   12  O6  GLC A   1      -0.515  -4.017  -0.573  1.00 20.00           O  
CONECT    1    2    7   11
CONECT    2    1    3    8
CONECT    3    2    4    9
CONECT    4    3    5   10
CONECT    5    4    6   11
CONECT    6    5   12
END`,
};

app.get('/api/science/structure/:identifier', async (req, res) => {
  const id = req.params.identifier.trim().toLowerCase();
  if (STRUCTURE_FALLBACKS[id]) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(STRUCTURE_FALLBACKS[id]);
  }
  // 4-char PDB ID
  if (id.length === 4) {
    try {
      const url = `https://files.rcsb.org/download/${id.toUpperCase()}.cif`;
      const upstream = await fetchWithRetry(url);
      const data = await upstream.text();
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.send(data);
    } catch {
      // fallback
    }
  }
  // PubChem numeric CID
  if (/^\d+$/.test(id)) {
    try {
      const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${id}/SDF?record_type=3d`;
      const upstream = await fetchWithRetry(url);
      const data = await upstream.text();
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.send(data);
    } catch {
      // fallback
    }
  }
  return res.status(404).json({ error: 'Structure not found' });
});

// ==========================================
// 2. VIRTUAL AI TUTOR CHARACTER CHAT (NotebookLM Q&A with Deep Persona)
// ==========================================

app.post('/api/tutor/chat', async (req, res) => {
  const { character, studentGrade, studentName, studentInterests, topic, sourceText, messages, question } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  const charName = character?.name || 'Professor Pip';
  const charBackstory = character?.backstory || 'A wise forest owl who loves natural history and patient teaching.';
  const charStyle = character?.conversationalStyle || 'Warm, Patient & Socratic';
  const charCatchphrase = character?.catchphrase || 'Take your time, young naturalist.';
  const charSpeech = character?.speechStyle || 'Gentle and encouraging, with thoughtful analogies.';
  const gradeLevel = studentGrade || 'Grade 4-6 (Ages 9-11)';
  const sName = studentName ? studentName.trim() : 'Explorer';
  const interestsList = Array.isArray(studentInterests) && studentInterests.length > 0 ? studentInterests.join(', ') : 'Life sciences & molecular biology';

  const fallbackTutorResponse = {
    reply: `Hello ${sName}! I'm ${charName}. You asked: "${question}". In biological science, living systems use specialized structures to survive and thrive. Let's look closely at our topic: "${topic || 'Life Sciences'}"! Notice how each part works like a team of tiny biological workers. As I always say: "${charCatchphrase}". What part would you like to explore next?`,
    citationQuotes: [sourceText ? sourceText.slice(0, 100) + '...' : 'Foundational biological principle'],
    followUpQuestions: [
      'How does this shape help it do its job?',
      'Can you show me the 3D molecular structure?',
    ],
    audioScript: `Hello ${sName}! I'm ${charName}. In biological science, living systems work like tiny teams of microscopic workers!`,
  };

  try {
    const systemInstruction = `You are ${charName}, an AI tutor with a rich, unique personality inside the BioFocus teaching app.
Backstory: ${charBackstory}
Conversational Style: ${charStyle}
Catchphrase / Motto: "${charCatchphrase}"
Speech Habits & Mannerisms: ${charSpeech}
Target Student Audience: ${gradeLevel}.
Student Name: ${sName}
Student Curricular Interests: ${interestsList}

Pedagogical & Character Rules:
1. Embody your distinct personality and conversational style deeply in every sentence! Use your signature mannerisms and analogies.
2. Address the student warmly by name (${sName}) naturally during the conversation.
3. Ground your explanations in the provided Notebook source text whenever relevant.
4. Keep answers clear, bite-sized (1-3 friendly paragraphs) to maintain high attention and avoid cognitive overload for children.
5. Use vivid, delightful sensory analogies. Never be cold, robotic, or overly technical.
6. Extract 1-2 exact or near-exact short quote snippets from the source text that support your answer, for grounded NotebookLM citations.
7. Provide 2 curious, engaging follow-up questions the child might want to ask next.
8. Provide a concise, clear "audioScript" version suitable for text-to-speech reading aloud (clean natural speech, no asterisks, no bullets, conversational).

Return strictly JSON in the following format:
{
  "reply": "string (the character's response, warm and in-character)",
  "citationQuotes": ["string (quote snippet 1 from source)", "string (quote snippet 2)"],
  "followUpQuestions": ["string", "string"],
  "audioScript": "string (clean spoken text for TTS)"
}`;

    const conversationHistory = (messages || [])
      .slice(-6)
      .map((m: any) => `${m.role === 'user' ? 'Student' : charName}: ${m.text}`)
      .join('\n');

    const prompt = `Topic: ${topic || 'General Science'}
Source Notes & Educational Content:
"""
${sourceText || 'General biology and life sciences curriculum.'}
"""

Recent Conversation:
${conversationHistory}

Student Question:
"${question}"

Respond strictly as JSON.`;

    const text = await generateGeminiWithFallback({
      contents: prompt,
      systemInstruction,
      responseMimeType: 'application/json',
      temperature: 0.7,
    });

    if (!text) {
      return res.json(fallbackTutorResponse);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {
        reply: text,
        citationQuotes: [],
        followUpQuestions: ['Why is this so important for life?'],
        audioScript: text.replace(/[#*`_]/g, ''),
      };
    }

    return res.json(parsed);
  } catch {
    return res.json(fallbackTutorResponse);
  }

});

// ==========================================
// 3. NOTEBOOKLM CONTENT SUMMARIZER & AUDIO PODCAST GENERATOR
// ==========================================

function getTopicFallbackSummary(topicTitle: string, sourceText: string) {
  const cleanTitle = topicTitle ? topicTitle.split(':')[0] : 'Biological Wonders';
  return {
    overview: `${cleanTitle} is a captivating cornerstone of biology. Living organisms rely on intricate molecular machines to process energy, defend against harm, and build cellular structures.\n\nInside microscopic cells, thousands of chemical operations proceed with flawless precision, enabling life to flourish in every corner of our planet.`,
    keyTakeaways: [
      'Biological structures have shapes specially engineered for their specific microscopic jobs.',
      'Molecules like proteins and DNA interact in high-precision nanoscale teamwork.',
      'Understanding these natural mechanisms helps scientists develop medicine and protect living ecosystems.',
    ],
    whyItMatters:
      'Every heartbeat, breath, and movement in your body depends on these microscopic wonders right now!',
    vocabulary: [
      { term: 'Molecule', definition: 'A group of atoms bonded together like tiny building blocks.' },
      { term: 'Protein', definition: 'A hardworking microscopic machine that carries out jobs inside living cells.' },
      { term: 'Structure', definition: 'The exact three-dimensional shape that enables a biological machine to work.' },
    ],
    mindMapNodes: [
      { id: 'core', label: cleanTitle },
      { id: 'func', label: 'Primary Function', parentId: 'core' },
      { id: 'struct', label: 'Molecular Structure', parentId: 'core' },
      { id: 'life', label: 'Real Life Impact', parentId: 'func' },
    ],
    audioDialogue: [
      {
        speaker: 'Alex (Curious Student)',
        text: `Welcome to our science audio briefing! Today we are zooming in on ${cleanTitle}. What makes it so extraordinary?`,
      },
      {
        speaker: 'Dr. Sam (Friendly Biologist)',
        text: 'Imagine a microscopic factory operating with atomic precision! Every piece fits together like a custom key.',
      },
      {
        speaker: 'Alex (Curious Student)',
        text: 'And our cells have billions of these running inside us right now?',
      },
      {
        speaker: 'Dr. Sam (Friendly Biologist)',
        text: 'Exactly! Nature is the ultimate nano-engineer. Let us explore the wonders of life together!',
      },
    ],
  };
}

app.post('/api/notebook/summarize', async (req, res) => {
  const { sourceText, topicTitle, readingLevel } = req.body;

  if (!sourceText && !topicTitle) {
    return res.status(400).json({ error: 'Source text or topic title is required' });
  }

  const fallback = getTopicFallbackSummary(topicTitle, sourceText);

  try {
    const level = readingLevel || 'Grade 4-6 (Ages 9-11)';
    const systemInstruction = `You are an expert curriculum designer and science communicator modeled after Google's NotebookLM, specifically tailoring bioscience and STEM knowledge for young learners.
Reading Level: ${level}.

Your goal: Take the provided source text and transform it into a multi-modal learning studio package:
1. "overview": 2 concise, vivid paragraphs highlighting the big picture idea.
2. "keyTakeaways": 3-4 bullet points highlighting surprising, sticky insights using relatable real-world analogies.
3. "whyItMatters": 1 short paragraph explaining why a child should care in their daily life.
4. "vocabulary": 3-4 essential scientific terms with super clear, friendly 1-sentence definitions.
5. "mindMapNodes": 4-6 interconnected nodes for an interactive concept graph. Include id, label, and parentId (optional, to form a tree/cluster).
6. "audioDialogue": A NotebookLM-style dynamic 2-host "Audio Overview" script (4-6 alternating speaker turns between 'Alex (Curious Student)' and 'Dr. Sam (Lead Scientist)') that sounds like an engaging, fun podcast episode breaking down the topic with enthusiasm.

Return strictly JSON matching this structure:
{
  "overview": "string",
  "keyTakeaways": ["string", "string", "string"],
  "whyItMatters": "string",
  "vocabulary": [
    { "term": "string", "definition": "string" }
  ],
  "mindMapNodes": [
    { "id": "string", "label": "string", "parentId": "string or null" }
  ],
  "audioDialogue": [
    { "speaker": "Alex", "text": "string" },
    { "speaker": "Dr. Sam", "text": "string" }
  ]
}`;

    const prompt = `Topic Title: ${topicTitle || 'Bioscience Exploration'}
Source Material:
"""
${sourceText}
"""

Generate the personalized study notebook artifacts in strict JSON.`;

    const text = await generateGeminiWithFallback({
      contents: prompt,
      systemInstruction,
      responseMimeType: 'application/json',
      temperature: 0.6,
    });

    if (!text) {
      return res.json(fallback);
    }

    try {
      const parsed = JSON.parse(text);
      if (parsed.overview && parsed.keyTakeaways) {
        return res.json(parsed);
      }
    } catch {
      // JSON parse error, use fallback
    }

    return res.json(fallback);
  } catch {
    return res.json(fallback);
  }

});

// ==========================================
// 4. NOTEBOOKLM DYNAMIC INTERACTIVE QUIZ GENERATOR (MCQ + Short Answer)
// ==========================================

function getTopicFallbackQuiz(topicTitle: string) {
  const cleanTitle = topicTitle ? topicTitle.split(':')[0] : 'this biological structure';
  return {
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: `What makes ${cleanTitle} so effective in living cells?`,
        options: [
          'Its exact 3D molecular fold and shape',
          'It is made entirely out of metal and glass',
          'It only exists in outer space',
          'It does not interact with any other molecules',
        ],
        correctIndex: 0,
        explanation: 'Exactly right! In biology, structure leads directly to function. The shape determines what it can grab and build!',
        tutorCheer: 'Phenomenal thinking! You have a true scientist\'s mind!',
      },
      {
        id: 'q2',
        type: 'multiple-choice',
        question: 'Why do biological scientists study 3D molecules with computers and X-rays?',
        options: [
          'Just for fun video games',
          'To understand how cells work and invent life-saving medicine',
          'Because cells are flat like sheets of paper',
          'To turn rocks into gold',
        ],
        correctIndex: 1,
        explanation: 'Spot on! Seeing molecules in 3D allows researchers to design medicines and discover how our bodies heal!',
        tutorCheer: 'Brilliant deduction!',
      },
      {
        id: 'q3',
        type: 'short-answer',
        question: `In your own words: How does ${cleanTitle} help living things survive?`,
        sampleAnswer: 'It carries out an essential cellular job like moving oxygen, producing energy, or protecting the cell with its special 3D shape.',
        keyConcepts: ['shape', 'energy', 'protect', 'function', 'oxygen', 'cell'],
        explanation: 'Great answer! Biological molecules act like tiny microscopic workers keeping the whole cell alive.',
        tutorCheer: 'Magnificent explanation! You expressed that like a real science communicator!',
      },
    ],
  };
}

app.post('/api/notebook/quiz', async (req, res) => {
  const { sourceText, topicTitle, readingLevel } = req.body;
  const fallbackQuiz = getTopicFallbackQuiz(topicTitle);

  try {
    const level = readingLevel || 'Grade 4-6 (Ages 9-11)';
    const systemInstruction = `You are an educational quiz creator for children, dynamically generating quizzes from NotebookLM summaries and science curricula.
Target Reading Level: ${level}.
Create an engaging 3-question retention challenge:
- Question 1: Multiple choice (conceptual and clear)
- Question 2: Multiple choice (application / real-world connection)
- Question 3: Short answer (asking the student to explain a core concept in their own words)

For multiple-choice questions:
- id: string
- type: "multiple-choice"
- question: clear, inviting question
- options: array of 4 distinct choices
- correctIndex: number (0-3)
- explanation: warm, encouraging explanation of why that answer is right
- tutorCheer: a short joyful exclamation celebrating their answer.

For short-answer questions:
- id: string
- type: "short-answer"
- question: an open-ended question inviting 1-2 sentences of student thought
- sampleAnswer: a clear model answer
- keyConcepts: array of 3-5 core words/terms to look for
- explanation: a clear explanation of the concept
- tutorCheer: an enthusiastic praise for effort and understanding.

Format strictly as JSON:
{
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctIndex": 0,
      "explanation": "string",
      "tutorCheer": "string"
    },
    {
      "id": "q2",
      "type": "multiple-choice",
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctIndex": 1,
      "explanation": "string",
      "tutorCheer": "string"
    },
    {
      "id": "q3",
      "type": "short-answer",
      "question": "string",
      "sampleAnswer": "string",
      "keyConcepts": ["concept1", "concept2"],
      "explanation": "string",
      "tutorCheer": "string"
    }
  ]
}`;

    const prompt = `Topic: ${topicTitle}
Notebook Content Summary:
"""
${sourceText}
"""`;

    const text = await generateGeminiWithFallback({
      contents: prompt,
      systemInstruction,
      responseMimeType: 'application/json',
      temperature: 0.5,
    });

    if (!text) {
      return res.json(fallbackQuiz);
    }

    try {
      const parsed = JSON.parse(text);
      if (parsed.questions && parsed.questions.length > 0) {
        return res.json(parsed);
      }
    } catch {
      // Fallback
    }

    return res.json(fallbackQuiz);
  } catch {
    return res.json(fallbackQuiz);
  }

});

// ==========================================
// 5. EVALUATE SHORT-ANSWER QUIZ QUESTIONS
// ==========================================

app.post('/api/quiz/evaluate-short-answer', async (req, res) => {
  const { question, studentAnswer, sampleAnswer, keyConcepts, character } = req.body;

  const charName = character?.name || 'Professor Pip';
  const charPersona = character?.personality || 'Gentle and encouraging';

  if (!studentAnswer || !studentAnswer.trim()) {
    return res.json({
      isCorrect: false,
      scoreAwarded: 0,
      feedback: 'Please share your thoughts or type an answer to this question!',
      tutorCheer: 'Give it your best try—every guess is a step toward understanding!',
    });
  }

  const fallbackEvaluation = () => {
    const lower = studentAnswer.toLowerCase();
    const matches = (keyConcepts || []).filter((k: string) => lower.includes(k.toLowerCase()));
    const isPassing = matches.length > 0 || studentAnswer.length > 15;
    return {
      isCorrect: isPassing,
      scoreAwarded: isPassing ? 15 : 8,
      feedback: isPassing
        ? `Wonderful answer! You captured the main idea: ${sampleAnswer || 'Living structures work together through precision 3D shapes.'}`
        : `Good try! Here is what scientists discovered: ${sampleAnswer || 'Biological structures have special shapes that make life possible.'}`,
      tutorCheer: isPassing
        ? `Splendid observation! ${charName} is very proud of your explanation!`
        : `Great effort! Science is all about exploring ideas together!`,
    };
  };

  try {
    const systemInstruction = `You are ${charName}, evaluating a young student's written answer to a science question.
Persona: ${charPersona}.
Be warm, generous, and encouraging! Do NOT penalize simple spelling or grammar mistakes if the core concept is understood.
Award:
- isCorrect: true if they show general conceptual grasp, false only if totally incorrect or off-topic.
- scoreAwarded: 15 for a solid answer, 10 for partial understanding, 5 for an earnest attempt.
- feedback: 1-2 friendly sentences explaining what they got right and adding a fun insight.
- tutorCheer: a short joyful cheer in character.

Return JSON:
{
  "isCorrect": boolean,
  "scoreAwarded": number,
  "feedback": "string",
  "tutorCheer": "string"
}`;

    const prompt = `Question: "${question}"
Model / Sample Answer: "${sampleAnswer}"
Key Concepts: ${JSON.stringify(keyConcepts || [])}
Student's Written Answer: "${studentAnswer}"

Evaluate generously for a young student.`;

    const text = await generateGeminiWithFallback({
      contents: prompt,
      systemInstruction,
      responseMimeType: 'application/json',
      temperature: 0.4,
    });

    if (!text) {
      return res.json(fallbackEvaluation());
    }

    try {
      const parsed = JSON.parse(text);
      return res.json(parsed);
    } catch {
      return res.json(fallbackEvaluation());
    }
  } catch {
    return res.json(fallbackEvaluation());
  }

});

// ==========================================
// 6. AI TOPIC EXPLORER & SEARCH MATCHING ENDPOINT
// ==========================================

const FALLBACK_TOPIC_TEMPLATES: Record<string, any> = {
  photosynthesis: {
    title: 'The Sunlight Chef: RuBisCO & Photosynthesis',
    subtitle: 'The molecular engine turning sunlight and thin air into food for Earth',
    category: 'Plant Biology & Energy',
    difficulty: 'Foundational',
    readTime: '4 min read',
    pdbId: '1RBO',
    provenance: {
      source: 'RCSB PDB (1RBO)',
      type: 'Experimentally determined',
      externalUrl: 'https://www.rcsb.org/structure/1RBO',
      experimentalMethod: 'X-ray Crystallography',
    },
    summary:
      'Inside every green leaf on our planet, microscopic chemical factories capture sunlight and carbon dioxide to make sugar and fresh oxygen. The chief molecular chef in this process is a huge protein called RuBisCO. It is the most abundant enzyme on Earth and literally powers life!',
    fullContent: `Have you ever wondered where plants get their weight? An oak tree does not eat soil; it grabs invisible carbon dioxide gas directly out of the atmosphere!

The molecular hero making this possible is called RuBisCO (Ribulose-1,5-bisphosphate carboxylase-oxygenase). Under a high-power microscope, RuBisCO looks like a stately octagon built from 8 large and 8 small protein subunits locking together.

When sunlight strikes a leaf, solar-powered pigments excite electrons. RuBisCO then grabs a molecule of carbon dioxide from the air and stitches it into a sugar skeleton. This sugar becomes sweet fruit, sturdy wood, and vital nutrients for every animal on Earth!

Without RuBisCO, Earth would be a dry, airless rock without leaves, forests, or breathable oxygen.`,
    funFact:
      'RuBisCO is so abundant that every human on Earth is supported by roughly 10 pounds of this single protein scattered across the planet’s leaves and plankton!',
    keyQuestions: [
      'How does sunlight provide the energy for plants to fix carbon?',
      'Why is RuBisCO shaped like a symmetrical octagon?',
      'How can studying RuBisCO help scientists grow more food in drought conditions?',
    ],
    vocabulary: [
      { term: 'Photosynthesis', definition: 'The process by which plants use sunlight, water, and carbon dioxide to make food and oxygen.' },
      { term: 'RuBisCO', definition: 'The primary enzyme responsible for fixing atmospheric carbon into organic sugars.' },
      { term: 'Chloroplast', definition: 'The solar-powered organelle inside plant cells where photosynthesis occurs.' },
    ],
    molecularHighlights: [
      { name: 'Active Binding Pockets', color: '#10b981', description: 'Catalytic centers where carbon dioxide binds and fixes into sugar.' },
      { name: 'Octameric Core Shell', color: '#6366f1', description: 'Sturdy structural scaffolding holding the reaction centers rigid.' },
    ],
  },
  crispr: {
    title: 'The Molecular Scissors: CRISPR-Cas9',
    subtitle: 'How bacteria developed a nanoscale defense system that revolutionized genetics',
    category: 'Genetics & Biotechnology',
    difficulty: 'Intermediate',
    readTime: '5 min read',
    pdbId: '4OO8',
    provenance: {
      source: 'RCSB PDB (4OO8)',
      type: 'Experimentally determined',
      externalUrl: 'https://www.rcsb.org/structure/4OO8',
      experimentalMethod: 'X-ray Crystallography (2.50 Å)',
    },
    summary:
      'Bacteria have been fighting off viruses for billions of years. To defend themselves, they invented CRISPR-Cas9: a precision molecular pair of scissors guided by an RNA address book. Scientists now use it to repair genetic mistakes and cure diseases!',
    fullContent: `Imagine having a pair of scissors so small they can edit a single letter out of billions in your genetic code! That is CRISPR-Cas9.

Bacteria are constantly invaded by tiny predatory viruses called bacteriophages. To remember and defeat repeat attackers, bacteria store snippets of viral DNA in a library. When a familiar virus strikes, Cas9 loads a guide RNA copy, tracks down the matching sequence, and snips it in two!

In 2012, scientists realized this bacterial shield could be programmed to target ANY gene. Today, doctors are using it to treat sickle cell anemia and genetic blindness.`,
    funFact:
      'CRISPR was first discovered when yogurt scientists were trying to protect friendly dairy cultures from viral contamination!',
    keyQuestions: [
      'How does the guide RNA navigate to the exact DNA sequence?',
      'What happens after Cas9 makes a double-stranded cut?',
      'How are scientists ensuring CRISPR edits only the intended targets?',
    ],
    vocabulary: [
      { term: 'Cas9', definition: 'An RNA-guided enzyme that unwinds and cuts specific DNA sequences.' },
      { term: 'Guide RNA', definition: 'A short RNA strand that acts like a GPS navigator directing Cas9 to its target.' },
      { term: 'Genome', definition: 'The complete set of genetic instructions stored in an organism’s DNA.' },
    ],
    molecularHighlights: [
      { name: 'Nuclease Domains (HNH & RuvC)', color: '#ef4444', description: 'The chemical blades that slice through the DNA double helix.' },
      { name: 'Guide RNA Recognition Lobe', color: '#3b82f6', description: 'The docking groove that verifies the target genetic match.' },
    ],
  },
  vaccine: {
    title: 'The Body’s Training Shield: Vaccine & Spike Protein',
    subtitle: 'How modern medicine teaches immune defenders without making us sick',
    category: 'Immunology & Health',
    difficulty: 'Foundational',
    readTime: '4 min read',
    pdbId: '6VXX',
    provenance: {
      source: 'RCSB PDB (6VXX)',
      type: 'Experimentally determined',
      externalUrl: 'https://www.rcsb.org/structure/6VXX',
      experimentalMethod: 'Cryo-EM (2.80 Å)',
    },
    summary:
      'A vaccine is like a wanted poster shown to your immune system before the bad guys even arrive. By showing your body a harmless piece of a viral surface—such as the Spike protein—your white blood cells create custom antibodies ready to fight in an instant!',
    fullContent: `When a new virus enters the body, your immune system normally takes a week or two to invent the right molecular key to defeat it. That delay is why people get sick!

Vaccines solve this problem by showing your immune system a "safe training dummy." For example, mRNA vaccines show cells how to make just the outer Spike protein—the harmless decorative coat of a virus.

Your friendly B-cells inspect this Spike, discover its exact shape, and manufacture millions of memory antibodies. When the real virus tries to attack later, your body neutralizes it immediately before you ever feel sick!`,
    funFact:
      'Your immune system retains memory cells from childhood vaccines for decades, acting like an internal biological library of past lessons!',
    keyQuestions: [
      'Why is showing just the Spike protein safer than a live virus?',
      'How do memory B-cells remember a pathogen for years?',
      'Why do some vaccines require booster doses?',
    ],
    vocabulary: [
      { term: 'Antigen', definition: 'A harmless target molecule that triggers your immune system to prepare.' },
      { term: 'Spike Glycoprotein', definition: 'The crown-like protein on viral envelopes used to latch onto host cells.' },
      { term: 'Memory Cell', definition: 'An immune cell that stores the recipe for making specific antibodies indefinitely.' },
    ],
    molecularHighlights: [
      { name: 'Receptor-Binding Domain (RBD)', color: '#f59e0b', description: 'The dynamic tip that flips up to touch host cell receptors.' },
      { name: 'Trimer Stalk Base', color: '#8b5cf6', description: 'The stable three-part anchor holding the viral crown together.' },
    ],
  },
  mitochondria: {
    title: 'The Cellular Power Dynamo: ATP Synthase',
    subtitle: 'The spinning nano-turbine that produces the energy for every single heartbeat',
    category: 'Cellular Energy & Metabolism',
    difficulty: 'Intermediate',
    readTime: '4 min read',
    pdbId: '1ATP',
    provenance: {
      source: 'RCSB PDB (1ATP)',
      type: 'Experimentally determined',
      externalUrl: 'https://www.rcsb.org/structure/1ATP',
      experimentalMethod: 'X-ray Crystallography',
    },
    summary:
      'Deep inside your cells, hundreds of tiny beans called mitochondria work day and night. Inside their inner membrane sits a microscopic rotating motor called ATP Synthase that spins up to 9,000 revolutions per minute to generate energy currency for your body!',
    fullContent: `Everything you do—from wiggling your toes to solving a math puzzle—requires molecular fuel. That fuel is a high-energy molecule called ATP (Adenosine Triphosphate).

The machine that makes ATP is ATP Synthase, and it is a literal rotary engine! Just like a hydroelectric dam uses rushing water to spin a giant turbine, your mitochondria pump hydrogen protons across a barrier. As the protons flow through ATP Synthase, the rotor spins at incredible speeds!

With every turn of its axle, the catalytic head compresses ADP and phosphate together, popping out freshly charged ATP molecules. Your body recycles its own weight in ATP every single day!`,
    funFact:
      'If ATP Synthase were scaled up to the size of a car engine, it would produce more horsepower per gram than a Formula 1 racing car!',
    keyQuestions: [
      'How does the flow of protons make the central shaft spin?',
      'What happens when our body uses up ATP during hard exercise?',
      'Why are mitochondria inherited almost entirely from our mothers?',
    ],
    vocabulary: [
      { term: 'ATP (Adenosine Triphosphate)', definition: 'The universal molecular battery used by all living cells.' },
      { term: 'Proton Gradient', definition: 'A buildup of hydrogen ions creating electrical and chemical pressure like water behind a dam.' },
      { term: 'Rotary Motor', definition: 'A protein complex with a rotating axle that converts physical spin into chemical energy.' },
    ],
    molecularHighlights: [
      { name: 'Fo Rotor Ring', color: '#06b6d4', description: 'The membrane turbine spun by the rush of hydrogen protons.' },
      { name: 'F1 Catalytic Head', color: '#ec4899', description: 'The stationary chamber where ATP molecules are pressed and released.' },
    ],
  },
  sugar: {
    title: 'The Sweet Ring of Life: Sugar (Glucose & Sucrose)',
    subtitle: 'The primary fuel molecule that powers thinking brains and growing muscles',
    category: 'Biochemistry & Energy',
    difficulty: 'Introductory',
    readTime: '4 min read',
    pubchemCid: '5793',
    chemicalFormula: 'C6H12O6',
    molecularWeight: '180.16 g/mol',
    iupacName: 'β-D-glucopyranose',
    hasMolecularStructure: true,
    structureType: 'small_molecule',
    sdfCoordinates: `HETATM    1  C1  GLC A   1       1.188  -0.370  -0.125  1.00 20.00           C  
HETATM    2  C2  GLC A   1       0.518   0.942  -0.540  1.00 20.00           C  
HETATM    3  C3  GLC A   1      -1.000   0.887  -0.347  1.00 20.00           C  
HETATM    4  C4  GLC A   1      -1.428  -0.380  -1.085  1.00 20.00           C  
HETATM    5  C5  GLC A   1      -0.704  -1.611  -0.537  1.00 20.00           C  
HETATM    6  C6  GLC A   1      -1.129  -2.915  -1.222  1.00 20.00           C  
HETATM    7  O1  GLC A   1       2.564  -0.320  -0.428  1.00 20.00           O  
HETATM    8  O2  GLC A   1       0.865   1.238  -1.890  1.00 20.00           O  
HETATM    9  O3  GLC A   1      -1.616   2.032  -0.906  1.00 20.00           O  
HETATM   10  O4  GLC A   1      -2.827  -0.505  -0.957  1.00 20.00           O  
HETATM   11  O5  GLC A   1       0.706  -1.478  -0.725  1.00 20.00           O  
HETATM   12  O6  GLC A   1      -0.515  -4.017  -0.573  1.00 20.00           O  
CONECT    1    2    7   11
CONECT    2    1    3    8
CONECT    3    2    4    9
CONECT    4    3    5   10
CONECT    5    4    6   11
CONECT    6    5   12
END`,
    provenance: {
      source: 'PubChem CID 5793 (D-Glucose)',
      type: 'Experimentally determined',
      externalUrl: 'https://pubchem.ncbi.nlm.nih.gov/compound/5793',
      experimentalMethod: 'Crystallography & Spectroscopy',
    },
    summary:
      'Sugar (D-Glucose, C6H12O6) is the universal biological fuel. Its hexagonal carbon ring contains five hydroxyl (-OH) groups that enable it to dissolve rapidly in blood and water. In cells, mitochondria break its carbon-carbon bonds down into ATP energy, water, and CO2!',
    fullContent: `Every sweet treat or energetic sprint is powered by miniature hexagonal rings called Sugar (D-Glucose, C6H12O6)!

In glucose, six carbon atoms form a stable cyclic ring called a pyranose ring. Branching off from the ring are five oxygen-hydrogen teams called Hydroxyl groups (-OH). These hydroxyl groups are polar magnets that love water—which is why sugar dissolves so quickly!

Your body burns glucose through cellular respiration to create ATP, the energy currency that powers every heartbeat and thought in your mind.`,
    funFact: 'Your brain burns about 120 grams of glucose every single day—over 20% of your daily energy!',
    keyQuestions: [
      'Why does sugar dissolve so quickly in warm water?',
      'How do cells extract ATP energy from glucose?',
      'What is the difference between simple glucose and table sugar?',
    ],
    vocabulary: [
      { term: 'Pyranose Ring', definition: 'A six-membered ring formed by 5 carbon atoms and 1 oxygen atom.' },
      { term: 'Hydroxyl Group (-OH)', definition: 'A chemical cluster of oxygen and hydrogen that confers solubility and sweetness.' },
      { term: 'Cellular Respiration', definition: 'The cellular pathway combining glucose and oxygen to produce ATP.' },
    ],
    chemicalCompounds: [
      { name: 'Hexagonal Pyranose Ring', formula: 'C5O', role: 'Structural Core', label: 'Carbon-Oxygen Backbone', atoms: '5 Carbons + 1 Ring Oxygen', color: '#3b82f6', description: 'The six-membered cyclic skeleton.' },
      { name: 'Hydroxyl Functional Groups', formula: '-OH', role: 'Solubility & Taste', label: '5 Hydroxyl Groups', atoms: 'Oxygen + Hydrogen pairs', color: '#ef4444', description: 'Polar groups enabling hydrogen bonding and sweetness.' },
      { name: 'Hydroxymethyl Branch', formula: '-CH2OH', role: 'Exocyclic Tail', label: 'C6 Branch', atoms: 'Carbon #6 with two Hydrogens and -OH', color: '#10b981', description: 'Projects above the ring plane.' },
      { name: 'Hemiacetal Ether Bridge', formula: 'C-O-C', role: 'Ring Closure', label: 'Oxygen Bridge (O5)', atoms: 'Bridging Oxygen linking C1 and C5', color: '#f59e0b', description: 'Formed when glucose cyclizes in water.' },
    ],
    molecularLabels: [
      { id: 'c-ring', name: 'Carbon Backbone (C1-C6)', label: 'Carbon Skeleton', description: 'Six carbon atoms storing chemical bond energy.', color: '#3b82f6', badge: 'Backbone' },
      { id: 'oh-groups', name: 'Hydroxyl Groups (-OH)', label: '-OH Groups', description: '5 polar sites triggering taste sweetness.', color: '#ef4444', badge: 'Functional' },
      { id: 'o-bridge', name: 'Ether Ring Oxygen (O5)', label: 'Ring Oxygen', description: 'Closing oxygen atom of the pyranose ring.', color: '#f59e0b', badge: 'Linkage' },
      { id: 'c6-tail', name: 'Exocyclic C6 Hydroxymethyl', label: '-CH2OH Arm', description: 'Carbon #6 branch targeted in cellular glycolysis.', color: '#10b981', badge: 'Branch' },
    ],
    molecularHighlights: [
      { name: 'Hydroxyl Polar Groups (-OH)', color: '#ef4444', description: 'Five polar groups responsible for water solubility and taste.' },
      { name: 'Pyranose Ring (C5O)', color: '#3b82f6', description: 'Stable six-membered ring skeleton in chair conformation.' },
    ],
  },
  methane: {
    title: 'The Clean Tetrahedral Core: Methane (CH4)',
    subtitle: 'The simplest hydrocarbon molecule with perfect geometric symmetry',
    category: 'Chemistry & Earth Science',
    difficulty: 'Introductory',
    readTime: '3 min read',
    pubchemCid: '297',
    chemicalFormula: 'CH4',
    molecularWeight: '16.04 g/mol',
    iupacName: 'methane',
    hasMolecularStructure: true,
    structureType: 'small_molecule',
    sdfCoordinates: `HETATM    1  C1  CH4 A   1       0.000   0.000   0.000  1.00 20.00           C  
HETATM    2  H1  CH4 A   1       0.629   0.629   0.629  1.00 20.00           H  
HETATM    3  H2  CH4 A   1      -0.629  -0.629   0.629  1.00 20.00           H  
HETATM    4  H3  CH4 A   1      -0.629   0.629  -0.629  1.00 20.00           H  
HETATM    5  H4  CH4 A   1       0.629  -0.629  -0.629  1.00 20.00           H  
CONECT    1    2    3    4    5
END`,
    provenance: {
      source: 'PubChem CID 297 (Methane)',
      type: 'Experimentally determined',
      externalUrl: 'https://pubchem.ncbi.nlm.nih.gov/compound/297',
      experimentalMethod: 'Gas-Phase Electron Diffraction',
    },
    summary:
      'Methane (CH4) is a single central carbon atom bonded to four hydrogen atoms in a magnificent 3D regular tetrahedron with bond angles of exactly 109.5°. Produced by methanogenic microbes and used as clean-burning natural gas fuel, it is also a powerful greenhouse gas!',
    fullContent: `Look closely at Methane (CH4). It forms a symmetrical four-sided pyramid in 3D space called a regular tetrahedron!

At the center sits a Carbon atom with four sp3 hybridized orbitals. Surrounding it are four Hydrogen atoms sharing electrons in strong covalent sigma bonds. Every bond angle is exactly 109.5 degrees to minimize repulsion between negative electrons.

Methane burns cleanly with oxygen to produce water, carbon dioxide, and intense heat energy.`,
    funFact: 'On Saturn’s moon Titan, temperatures are so freezing that methane forms liquid lakes and rains from skies!',
    keyQuestions: [
      'Why is methane shaped like a tetrahedron instead of a flat square?',
      'Why is methane non-polar while water is polar?',
      'What happens when methane burns in oxygen?',
    ],
    vocabulary: [
      { term: 'Tetrahedral Geometry', definition: 'A 3D molecular shape with 109.5° bond angles around a central atom.' },
      { term: 'sp3 Hybridization', definition: 'Four equivalent bonding orbitals created by combining one s and three p orbitals.' },
      { term: 'Covalent Sigma Bond', definition: 'A strong direct overlap bond formed between two atoms sharing electrons.' },
    ],
    chemicalCompounds: [
      { name: 'Central Carbon Atom (sp³)', formula: 'C', role: 'Central Nexus', label: 'Core Carbon', atoms: '1 Carbon with 4 shared valence pairs', color: '#64748b', description: 'Central carbon atom with sp3 hybrid orbitals.' },
      { name: 'Tetrahedral Hydrogen Atoms', formula: '4 × H', role: 'Peripheral Satellites', label: '4 Hydrogen Atoms', atoms: '4 Hydrogens sharing 1s electrons', color: '#38bdf8', description: 'Symmetrically distributed hydrogen vertices.' },
      { name: 'C-H Covalent Sigma Bonds', formula: '4 × σ(C-H)', role: 'Covalent Links', label: '4 C-H Sigma Bonds', atoms: 'Length: 1.087 Å, Angle: 109.5°', color: '#a855f7', description: 'Strong localized covalent single bonds.' },
    ],
    molecularLabels: [
      { id: 'carbon-core', name: 'Central Carbon Atom (C1)', label: 'Carbon Nucleus', description: 'sp3 hybridized carbon atom at tetrahedral center.', color: '#64748b', badge: 'Core' },
      { id: 'h1', name: 'Hydrogen #1 (Top Vertex)', label: 'Apical H1', description: 'Apex hydrogen atom.', color: '#38bdf8', badge: 'Vertex' },
      { id: 'h2-h4', name: 'Hydrogens #2, #3, #4 (Equatorial Base)', label: 'Basal H2-H4', description: 'Three symmetric basal hydrogen atoms.', color: '#06b6d4', badge: 'Base' },
      { id: 'tetra-angle', name: 'Tetrahedral Angle (109.5°)', label: '109.5° Angle', description: 'VSEPR geometry minimizing electron repulsion.', color: '#f59e0b', badge: 'Geometry' },
    ],
    molecularHighlights: [
      { name: 'Tetrahedral Geometry (109.5°)', color: '#38bdf8', description: 'Four C-H bonds radiating symmetrically.' },
      { name: 'sp³ Hybridized Carbon', color: '#64748b', description: 'Four equivalent bonding orbitals in tetrahedral layout.' },
    ],
  },
  dna: {
    title: 'The Spiral Recipe Book: Human DNA Molecule',
    subtitle: 'The two-meter blueprint curled inside every microscopic cell',
    category: 'Genetics & Molecular Biology',
    difficulty: 'Core Science',
    readTime: '5 min read',
    pdbId: '1BNA',
    chemicalFormula: '(C10H12N5O6P)n',
    molecularWeight: 'Variable (~660 Da per base pair)',
    iupacName: 'Deoxyribonucleic Acid B-Form Dodecamer',
    hasMolecularStructure: true,
    structureType: 'dna_helix',
    provenance: {
      source: 'RCSB PDB (1BNA)',
      type: 'Experimentally determined',
      externalUrl: 'https://www.rcsb.org/structure/1BNA',
      experimentalMethod: 'X-ray Crystallography (1.90 Å resolution)',
    },
    summary:
      'DNA is the great biological instruction manual. Shaped like a twisted rope ladder (the double helix), it uses complementary base pairs—Adenine-Thymine and Guanine-Cytosine—anchored to a sugar-phosphate backbone to encode life!',
    fullContent: `Inside nearly every cell in your body lies a microscopic library called the nucleus, housing two meters of DNA neatly curled around protein spools!

The double helix features outer handrails of alternating phosphate groups and 2-deoxyribose sugar rings. In between are the rungs of the ladder: Adenine pairs with Thymine via two hydrogen bonds, and Guanine pairs with Cytosine via three hydrogen bonds.

When cells divide, enzymes unzip the double helix and synthesize exact complementary strands, passing the code of life forward!`,
    funFact: 'If stretched out, the DNA in all your body cells would reach to Pluto and back multiple times!',
    keyQuestions: [
      'Why does Adenine only pair with Thymine and Guanine with Cytosine?',
      'How does DNA unzip without breaking its outer backbone?',
      'What are the major and minor grooves used for?',
    ],
    vocabulary: [
      { term: 'Double Helix', definition: 'The spiral geometry of two antiparallel intertwined strands.' },
      { term: 'Base Pair', definition: 'Two complementary chemical letters (A-T or G-C) held by hydrogen bonds.' },
      { term: 'Phosphate Backbone', definition: 'The negatively charged structural rails that frame DNA.' },
    ],
    chemicalCompounds: [
      { name: 'Sugar-Phosphate Handrail Backbone', formula: '(PO4-Deoxyribose)n', role: 'Structural Rail', label: 'Phosphate-Sugar Backbone', atoms: 'Phosphorus, Oxygen, Carbon', color: '#f59e0b', description: 'Alternating phosphodiester linkages and 2-deoxyribose rings.' },
      { name: 'Adenine-Thymine (A-T) Base Pairs', formula: 'A = T (2 H-Bonds)', role: 'Genetic Alphabet', label: 'A-T Base Pairs', atoms: 'Adenine (purine) + Thymine (pyrimidine)', color: '#3b82f6', description: 'Watson-Crick base pair joined by two hydrogen bonds.' },
      { name: 'Guanine-Cytosine (G-C) Base Pairs', formula: 'G ≡ C (3 H-Bonds)', role: 'Genetic Alphabet', label: 'G-C Base Pairs', atoms: 'Guanine (purine) + Cytosine (pyrimidine)', color: '#10b981', description: 'High-stability base pair joined by three hydrogen bonds.' },
      { name: 'Major & Minor Helical Grooves', formula: 'Spiral Indentations', role: 'Protein Binding Access', label: 'Major & Minor Grooves', atoms: 'Edges of stacked base pairs', color: '#8b5cf6', description: 'Grooves where reading enzymes access the code.' },
    ],
    molecularLabels: [
      { id: 'backbone', name: 'Phosphate Backbone (PO4³⁻)', label: 'Phosphate Rail', description: 'Negatively charged phosphodiester backbone.', color: '#f59e0b', badge: 'Backbone' },
      { id: 'deoxyribose', name: '2-Deoxyribose Sugar', label: 'Pentose Sugar', description: 'Five-carbon cyclic sugar lacking C2 oxygen.', color: '#06b6d4', badge: 'Sugar' },
      { id: 'at-pair', name: 'Adenine = Thymine Pair', label: 'A-T (2 H-Bonds)', description: 'Two hydrogen bonds connecting A and T.', color: '#3b82f6', badge: 'Base Pair' },
      { id: 'gc-pair', name: 'Guanine ≡ Cytosine Pair', label: 'G-C (3 H-Bonds)', description: 'Three hydrogen bonds providing high thermal stability.', color: '#10b981', badge: 'Base Pair' },
    ],
    molecularHighlights: [
      { name: 'Sugar-Phosphate Backbone', color: '#f59e0b', description: 'Antiparallel exterior rails providing chemical stability.' },
      { name: 'Stacked Base Pairs', color: '#10b981', description: 'Watson-Crick planar base pairs stacked in the core.' },
    ],
  },
};

app.post('/api/topics/ai-explore', async (req, res) => {
  const { query, userProfile, readingLevel } = req.body;

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const cleanQuery = query.trim().toLowerCase();
  const studentName = userProfile?.name || 'Curious Learner';
  const studentAge = userProfile?.age || 11;
  const gradeLevel = readingLevel || userProfile?.gradeLevel || 'grades-5-7';
  const userInterests = (userProfile?.interests || []).join(', ');

  // 1. Check quick keyword matches in fallback templates
  let matchedFallbackKey: string | null = null;
  if (cleanQuery.includes('sugar') || cleanQuery.includes('glucose') || cleanQuery.includes('sucrose')) {
    matchedFallbackKey = 'sugar';
  } else if (cleanQuery.includes('methane') || cleanQuery.includes('ch4') || cleanQuery.includes('tetrahedral')) {
    matchedFallbackKey = 'methane';
  } else if (cleanQuery.includes('dna') || cleanQuery.includes('helix') || cleanQuery.includes('genetic') || cleanQuery.includes('human dna')) {
    matchedFallbackKey = 'dna';
  } else if (cleanQuery.includes('photo') || cleanQuery.includes('plant') || cleanQuery.includes('leaf') || cleanQuery.includes('rubisco')) {
    matchedFallbackKey = 'photosynthesis';
  } else if (cleanQuery.includes('crispr') || cleanQuery.includes('cas9') || cleanQuery.includes('gene edit') || cleanQuery.includes('scissors')) {
    matchedFallbackKey = 'crispr';
  } else if (cleanQuery.includes('vaccin') || cleanQuery.includes('spike') || cleanQuery.includes('corona') || cleanQuery.includes('virus')) {
    matchedFallbackKey = 'vaccine';
  } else if (cleanQuery.includes('mito') || cleanQuery.includes('atp') || cleanQuery.includes('energy') || cleanQuery.includes('dynamo')) {
    matchedFallbackKey = 'mitochondria';
  }

  const makeCustomTopicId = (title: string) => {
    return `custom-ai-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 25)}-${Date.now().toString().slice(-4)}`;
  };

  const getGenericFallbackTopic = () => {
    if (matchedFallbackKey && FALLBACK_TOPIC_TEMPLATES[matchedFallbackKey]) {
      const tmpl = FALLBACK_TOPIC_TEMPLATES[matchedFallbackKey];
      return {
        ...tmpl,
        id: makeCustomTopicId(tmpl.title),
      };
    }

    const titleCased = query.charAt(0).toUpperCase() + query.slice(1);
    return {
      id: makeCustomTopicId(query),
      title: `${titleCased}: Exploring Nature’s Wonders`,
      subtitle: `A fascinating scientific journey tailored for ${studentName} (Age ${studentAge})`,
      category: 'Biological Exploration & Discovery',
      difficulty: 'Foundational',
      readTime: '4 min read',
      pdbId: '1EMA',
      provenance: {
        source: 'AI Studio Curated Bioscience',
        type: 'Literature curated',
        externalUrl: 'https://www.rcsb.org',
      },
      summary: `${titleCased} reveals the astonishing complexity of living systems. From nanoscale molecular assemblies to whole organisms, every element plays a purposeful role in sustaining life.`,
      fullContent: `Have you ever wondered how ${query} works inside living things? When we zoom into the nanoscale world, biological machinery behaves with unbelievable elegance!\n\nMolecules interact like intricate Lego blocks that self-assemble into working machines. By examining ${query}, scientists uncover how life adapts, protects itself, and flourishes across our planet.\n\nEvery day, researchers use advanced imaging tools to reveal these secrets, helping us create sustainable technologies and healthier communities.`,
      funFact: `Scientific studies into ${query} continue to inspire cutting-edge inventions in bio-engineering and robotics!`,
      keyQuestions: [
        `How does the shape of molecules in ${query} determine their function?`,
        `Why is understanding ${query} helpful for medicine and nature?`,
        `What questions are scientists currently trying to answer about ${query}?`,
      ],
      vocabulary: [
        { term: 'Nanoscale', definition: 'The realm of things measured in billionths of a meter, where molecules live.' },
        { term: 'Biomolecule', definition: 'A molecule produced by living organisms essential for biological processes.' },
        { term: 'Mechanism', definition: 'The step-by-step physical or chemical way that a natural process occurs.' },
      ],
      molecularHighlights: [
        { name: 'Core Architecture', color: '#6366f1', description: 'The primary structural framework that keeps the system stable.' },
        { name: 'Active Interaction Site', color: '#10b981', description: 'The region where dynamic molecular binding and action happens.' },
      ],
    };
  };

  const fallbackTopic = getGenericFallbackTopic();

  try {
    const systemInstruction = `You are a world-class science educator and curriculum designer in the persona of Sofia Carter, modeled after NotebookLM.
Your mission: Take a student's search query and profile to create the most valid, scientifically accurate, age-appropriate educational lesson topic.
Student Profile:
- Name: ${studentName}
- Age: ${studentAge}
- Grade Level: ${gradeLevel}
- Interests: ${userInterests || 'General Science & Living Systems'}

Requirements:
1. Provide a scientifically valid real protein/molecule or biological concept topic that closely matches the query.
2. If there is a well-known 4-character RCSB PDB ID for this protein or structure (e.g. 1RBO for RuBisCO, 4OO8 for Cas9, 6VXX for Spike, 1ATP for ATP Synthase, 1EMA for GFP, 1A3N for Hemoglobin, 1IGT for Antibody, 1BNA for DNA, 4INS for Insulin), include it!
3. Style the explanation with vivid storytelling, hands-on analogies, and clear step-by-step concepts (no boring jargon without immediate friendly definition).
4. Provide relevanceExplanation explaining why this topic matches the student's interests.
5. Provide 3 related follow-up search suggestions.

Return strictly JSON matching this structure:
{
  "topic": {
    "title": "string (Catchy Title: Subject)",
    "subtitle": "string (Engaging 1-sentence hook)",
    "category": "string (e.g. Genetics & Biotechnology, Human Physiology, Plant Biology & Energy, Immunology & Health, Marine Biology)",
    "difficulty": "Introductory" | "Foundational" | "Intermediate" | "Advanced",
    "readTime": "string (e.g. 4 min read)",
    "pdbId": "string (4-char PDB code or empty)",
    "provenance": {
      "source": "string",
      "type": "Literature curated" | "Experimentally determined",
      "externalUrl": "string"
    },
    "summary": "string (1 vivid, clear paragraph)",
    "fullContent": "string (3-4 paragraphs using storytelling, analogies, and structure-function relationships)",
    "funFact": "string (1 memorable, sticky fact)",
    "keyQuestions": ["string", "string", "string"],
    "vocabulary": [
      { "term": "string", "definition": "string" }
    ],
    "molecularHighlights": [
      { "name": "string", "color": "hex color string", "description": "string" }
    ]
  },
  "relevanceExplanation": "string (Friendly note from Sofia on why this is great for their profile)",
  "relatedTopicSuggestions": ["string", "string", "string"]
}`;

    const prompt = `Student search query: "${query}"
Please generate the comprehensive, engaging topic JSON tailored to this student.`;

    const text = await generateGeminiWithFallback({
      contents: prompt,
      systemInstruction,
      responseMimeType: 'application/json',
      temperature: 0.6,
    });

    if (!text) {
      return res.json({
        topic: fallbackTopic,
        relevanceExplanation: `Here is a custom lesson on ${fallbackTopic.title.split(':')[0]} specially prepared for ${studentName}!`,
        relatedTopicSuggestions: ['Photosynthesis', 'CRISPR Gene Editing', 'How Vaccines Work', 'Mitochondria Powerhouse'],
      });
    }

    try {
      const parsed = JSON.parse(text);
      if (parsed.topic && parsed.topic.title && parsed.topic.summary) {
        // Assign unique id
        parsed.topic.id = makeCustomTopicId(parsed.topic.title);
        if (!parsed.topic.pdbId || parsed.topic.pdbId.length !== 4) {
          parsed.topic.pdbId = fallbackTopic.pdbId || '1EMA';
        }
        return res.json({
          topic: parsed.topic,
          relevanceExplanation: parsed.relevanceExplanation || `Tailored to your curiosity about ${query}!`,
          relatedTopicSuggestions: parsed.relatedTopicSuggestions || ['Photosynthesis', 'CRISPR Gene Editing', 'Antibodies'],
        });
      }
    } catch {
      // Fall through to fallback
    }

    return res.json({
      topic: fallbackTopic,
      relevanceExplanation: `Specially prepared for ${studentName}!`,
      relatedTopicSuggestions: ['Photosynthesis', 'CRISPR Gene Editing', 'Antibodies'],
    });
  } catch {
    return res.json({
      topic: fallbackTopic,
      relevanceExplanation: `Specially matched to your search!`,
      relatedTopicSuggestions: ['Photosynthesis', 'CRISPR', 'Vaccines'],
    });
  }

});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: !!ai,
    environment: isProduction ? 'production' : 'development',
  });
});

// Setup Vite middlewares in development or static serving in production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 BioFocus server running on port ${PORT} [${isProduction ? 'PROD' : 'DEV'}]`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
