import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client server-side
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// API: Explain Semantic Error or Concept to a Dyslexic Child/Learner
app.post("/api/ai/explain", async (req, res) => {
  try {
    const { sentence, targetWord, selectedOption, correctOption, islandType, questionType } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        success: true,
        explanation: `الكلمة الصحيحة دلالياً هي "${correctOption}" لأنها تتناسب مع معنى الجملة ودورها في السياق. حاول قراءة الجملة كاملة للربط بين المعاني!`
      });
    }

    const prompt = `أنت أخصائي علاج نطق وتخاطب متخصص في علاج عسر القراءة (الدسلكسيا) على المستوى الدلالي للأطفال والناطقين بالعربية.
قدم شرحاً دلالياً مبسطاً ومشجعاً باللغة العربية (3-4 جمل قصيرة جداً بأسلوب محبب للأطفال).

الجملة: "${sentence}"
الكلمة الشاهدة/السياق: "${targetWord || 'الجملة كاملة'}"
نوع الجزيرة: "${islandType}"
نوع السؤال: "${questionType}"
إجابة الطفل: "${selectedOption}"
الإجابة الصحيحة دلالياً: "${correctOption}"

المطلوب:
1. تشجيع الطفل أولاً بألطف الكلمات.
2. توضيح السبب الدلالي الدقيق لماذا "${correctOption}" هي الأنسب في السياق، ولماذا كلمة "${selectedOption}" تحدث خللاً في المعنى.
3. إعطاء مثال محبب أو لمحة بصرية سهلة لتثبيت المعنى الدلالي.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    res.json({
      success: true,
      explanation: response.text || "الإجابة الصحيحة تكتمل بها فكرة الجملة الدلالية بشكل سليم!"
    });
  } catch (error: any) {
    console.error("Gemini Explain Error:", error);
    res.json({
      success: true,
      explanation: "الكلمة الصحيحة تعطي المعنى الأنسب للجملة حسب السياق اللغوي."
    });
  }
});

// API: AI Semantic Coach / Interactive Tutor Q&A
app.post("/api/ai/ask-coach", async (req, res) => {
  try {
    const { userQuestion, currentIsland } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        success: true,
        answer: "مرحباً بك! أنا مرشدك الدلالي الذكي. المعنى الدلالي هو مفتاح فهم القراءة، وعندما نفهم معاني الكلمات والجمل تصبح القراءة أسهل وأمتع بكثير!"
      });
    }

    const prompt = `أنت "بصير" المرشد الدلالي الذكي في تطبيق علاجي لعسر القراءة الدلالي.
الطفل/المتعلم يسألك سؤالاً: "${userQuestion}"
الجزيرة الحالية التي يتدرب فيها: "${currentIsland || 'عام'}"

أجب بأسلوب مبسط جداً، مشجع، ملهم، وواضح (لا يتجاوز 60 كلمة) مع أمثلة دلالية لطيفة من البيئة اليومية للأطفال.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    res.json({
      success: true,
      answer: response.text || "أنا هنا دائماً لمساعدتك على فهم معاني الكلمات والجمل بذكاء ومرح!"
    });
  } catch (error: any) {
    console.error("Gemini Coach Error:", error);
    res.json({
      success: true,
      answer: "أنا معك دائماً لتيسير القراءة وتوضيح المعاني الدلالية الشائقة!"
    });
  }
});

// API: Generate Custom Semantic Exercises
app.post("/api/ai/generate-exercises", async (req, res) => {
  try {
    const { islandName, count = 3 } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(400).json({ success: false, error: "API key not configured" });
    }

    const prompt = `أنت خبير في صعوبات التعلم وعسر القراءة الدلالي. قم بتوليد ${count} تمارين جديدة باللغة العربية مخصصة لجزيرة: "${islandName}".
يجب أن ترجع النتيجة كـ JSON كائن يحتوي على مصفوفة "exercises" بنفس التنسيق التالي تماماً:
[
  {
    "id": "gen_1",
    "sentence": "الجملة مع وجود فراغ أو كلمة مستهدفة",
    "targetWord": "الكلمة المستهدفة إن وجدت",
    "options": ["الخيار الأول", "الخيار الثاني", "الخيار الثالث", "الخيار الرابع"],
    "correctIndex": 0,
    "hint": "تلميح بصرى أو دلالي بسيط",
    "explanation": "الشرح الدلالي الميسر"
  }
]`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({
      success: true,
      exercises: parsed.exercises || parsed || []
    });
  } catch (error: any) {
    console.error("Gemini Exercise Gen Error:", error);
    res.status(500).json({ success: false, error: "Failed to generate exercises" });
  }
});

async function startServer() {
  // Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Semantic Dyslexia Therapy App running on http://localhost:${PORT}`);
  });
}

startServer();
