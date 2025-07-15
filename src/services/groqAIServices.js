import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const groqAIServices = async (message) => {
    try {
        const systemPrompt = `
            Eres un asistente virtual de Medpet, una clínica veterinaria.
            Tu objetivo es ayudar a los usuarios con información sobre servicios veterinarios,
            cuidado de mascotas y responder preguntas generales sobre salud animal.
            Responde de manera amigable, profesional y concisa menor a 100 tokens en español de Colombia.
            Si no sabes algo específico, recomienda contactar a la clínica a su telefono 1234567890.
        `;
        const response = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
            ],
            max_tokens: 100
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error('Error in Groq AI Services:', error);
        return 'Lo siento, no puedo procesar tu consulta en este momento. Por favor, contacta a la clínica al 1234567890.';
    }
}

export default groqAIServices;