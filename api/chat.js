
export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "طريقة الطلب غير مسموحة"
    });
  }

  try {
    const message = req.body?.message;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "اكتب سؤالك أولاً"
      });
    }

    if (message.length > 4000) {
      return res.status(400).json({
        error: "السؤال طويل جدًا"
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "إعداد خدمة الذكاء الاصطناعي غير مكتمل"
      });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: "أنت Cloud Assistant، مساعد ذكي متخصص في الحوسبة السحابية. أجب باللغة العربية الواضحة والمبسطة، واشرح المفاهيم والأمثلة العملية، وقارن بين AWS وMicrosoft Azure وGoogle Cloud عند الطلب. اجعل إجاباتك مفيدة ومنظمة، وإذا كان السؤال خارج مجال الحوسبة السحابية فأجب باختصار ثم وجّه المستخدم إلى موضوع الموقع."
            }]
          },
          contents: [{
            role: "user",
            parts: [{ text: message.trim() }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1200
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return res.status(502).json({
        error: "تعذر الحصول على إجابة الآن، حاول مرة أخرى"
      });
    }

    const reply = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    if (!reply) {
      return res.status(502).json({
        error: "لم تصل إجابة من المساعد، حاول مرة أخرى"
      });
    }

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Chat API error:", error);

    return res.status(500).json({
      error: "حدث خطأ أثناء الاتصال بالمساعد"
    });
  }
}
