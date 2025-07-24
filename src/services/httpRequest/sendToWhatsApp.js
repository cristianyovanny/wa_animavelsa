import config from '../../config';

const sendToWhatsApp = async (data)=> {
    const url = `${config.BASE_URL}/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.WHATSAPP_API_TOKEN}`
    };
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        });
        return response.data.json();
    } catch (error) {
        console.error('Error sending message to WhatsApp:', error);
        throw error;
    }
}