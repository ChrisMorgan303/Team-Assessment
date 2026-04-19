export default async function handler(req, res) {
  try {
    const { input } = req.body;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: `Analyze this team situation and provide key issues and recommendations:\n\n${input}`
      })
    });

    const data = await response.json();

    res.status(200).json({
      result: data.output[0].content[0].text
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
