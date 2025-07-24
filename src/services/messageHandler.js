import whatsappService from './whatsappService.js';
import appendToSheet from './googleSheetsService.js';
import groqAIServices from './groqAIServices.js';

class MessageHandler {
    constructor() {
        this.appointmentState = {};
        this.assistedState = {};
    }
    
    async handleIncomingMessage(message, senderInfo) {
        if (message?.type === "text") {
            const incomingMessage = message.text.body.toLowerCase().trim();
            console.log("Incoming message:", incomingMessage);

            if(this.isGreeting(incomingMessage)) {
                await this.sendWelcomeMessage(message.from, message.id, senderInfo);
                await this.sendWelcomeMenu(message.from);
            } else if (incomingMessage === 'media') {
                await this.sendMedia(message.from);
            } else if (this.appointmentState[message.from]) {
                await this.handleAppointmentFlow(message.from, incomingMessage)
            } else if( this.assistedState[message.from]) {
                await this.handleAssistendFlow(message.from, incomingMessage);
            } else {
                await this.handleMenuOption(message.from, incomingMessage);
            }
            await whatsappService.markAsRead(message.id);
        } else if (message?.type === "interactive") {
            const option = message.interactive?.button_reply?.id;
            await this.handleMenuOption(message.from, option);
            await whatsappService.markAsRead(message.id);
        }
    }

    isGreeting(message) {
        const greetings = ["hi", "hello", "hey"];
        return greetings.includes(message);
    }

    getSenderInfo(senderInfo) {
        return {
            first_name: senderInfo?.first_name,
            last_name: senderInfo?.last_name,
            phone: senderInfo?.wa_id
        }
    }

    async sendWelcomeMessage(to, messageId, senderInfo) {
        const profile = this.getSenderInfo(senderInfo);
        const welcomeMessage = `Hola ${ profile.first_name || profile.last_name || "" }, bienvenido a Animavelsa! En que puedo ayudarte?`;
        await whatsappService.sendMessage(to, welcomeMessage, messageId);
    }
    
    async sendWelcomeMenu(to) {
        const menuMessage = "Por favor selecciona una opción:";
        const buttons = [
            { type: 'reply', reply: { id: 'option_1', title: 'Agendar' } },
            { type: 'reply', reply: { id: 'option_2', title: 'Consultar' } },
            { type: 'reply', reply: { id: 'option_3', title: 'Ubicación' } }
        ];
    
        try {
            await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
        } catch (error) {
            console.error("Error sending interactive buttons:", error);
        }
    }
   
    async handleMenuOption(to, option) {
        let response;
        switch (option) {
            case 'option_1':
                this.appointmentState[to] = { step: 'name' };
                response = "Por favor, ingresa tu nombre?";
                break;
            case 'option_2':
                this.assistedState[to] = { step: 'question' };
                response = "¿Qué pregunta tienes? Estoy aquí para ayudarte.";
                break;
            case 'option_3':
                response = "Estamos ubicados en la Calle 123, Ciudad.";
                await this.sendLocation(to);
                break;
            case 'option_4':
                response = "¡Gracias por contactarnos! Si necesitas más ayuda, no dudes en preguntar.";
                delete this.assistedState[to];
                break;
            case 'option_5':
                this.assistedState[to] = { step: 'question' };
                response = "Si necesitas más ayuda, no dudes en preguntar. ¿Cuá es tu nueva pregunta?";
                break;
            case 'option_6':
                response = "Por favor, llamanos para emergencias"
                await this.sendContact(to);
                break;
            default:
                response = "Invalid option selected.";
        }
        await whatsappService.sendMessage(to, response);
    }

    async sendMedia(to) {
        const mediaUrl = 'https://res.cloudinary.com/cristianyovanny/image/upload/v1739231382/images/5ea3bae9-6c97-4376-969c-fd982feda5aa_tv04k2.png';
        const caption = 'Welcome';
        const type = 'image';
        await whatsappService.sendMediaMessage(to, type, mediaUrl, caption);
    }

    completeAppointment(to) {
        const appointment = this.appointmentState[to];
        delete this.appointmentState[to];

        const userData = [
            to,
            appointment.name,
            appointment.petName,
            appointment.petType,
            appointment.reason,
            new Date().toLocaleString()
        ]

        appendToSheet(userData)
            .then(response => console.log("Data appended to Google Sheet:", response))
            .catch(error => console.error("Error appending data to Google Sheet:", error));

        return `Gracias por agendar tu cita, ${appointment.name}. Tu cita ha sido agendada:

        Nombre: ${appointment.name}
        Mascota: ${appointment.petName}
        Tipo de mascota: ${appointment.petType}
        Motivo: ${appointment.reason}

        Nos pondremos en contacto contigo pronto para confirmar la cita.`;
    }

    async handleAppointmentFlow(to, message) {
        const state = this.appointmentState[to];
        let response;
        switch (state.step) {
            case 'name':
                state.name = message;
                state.step = 'petName';
                response = `Gracias ahora, ¿cuál es el nombre de tu mascota?`;
                break;
            case 'petName':
                state.petName = message;
                state.step = 'petType';
                response = `¿Qué tipo de mascota es? (Por ejemplo: perro, gato, etc.)`;
                break;
            case 'petType':
                state.petType = message;
                state.step = 'reason';
                response = `Gracias por la información. ¿Cuál es el motivo de la cita?`;
                break;
            case 'reason':
                state.reason = message;
                response = this.completeAppointment(to);
                break;
        }
        await whatsappService.sendMessage(to, response);
    }

    async handleAssistendFlow(to, message) {
        const state = this.assistedState[to];
        let response;

        const menuMessage = "¿La respuesta fue útil? Por favor selecciona una opción:";
        const buttons = [
            { type: 'reply', reply: { id: 'option_4', title: 'Sí, gracias' } },
            { type: 'reply', reply: { id: 'option_5', title: 'Hacer otra pregunta' } },
            { type: 'reply', reply: { id: 'option_6', title: 'Emergencia' } }
        ];

        if (state.step === 'question') {
            response = await groqAIServices(message);
        }
        delete this.assistedState[to];
        await whatsappService.sendMessage(to, response);
        await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
    }

    async sendContact(to) {
        const contact = {
            addresses: [
                {
                street: "123 Calle de las Mascotas",
                city: "Ciudad",
                state: "Estado",
                zip: "12345",
                country: "País",
                country_code: "PA",
                type: "WORK"
                }
            ],
            emails: [
                {
                email: "contacto@medpet.com",
                type: "WORK"
                }
            ],
            name: {
                formatted_name: "MedPet Contacto",
                first_name: "MedPet",
                last_name: "Contacto",
                middle_name: "",
                suffix: "",
                prefix: ""
            },
            org: {
                company: "MedPet",
                department: "Atención al Cliente",
                title: "Representante"
            },
            phones: [
                {
                phone: "+1234567890",
                wa_id: "1234567890",
                type: "WORK"
                }
            ],
            urls: [
                {
                url: "https://www.medpet.com",
                type: "WORK"
                }
            ]
        };

        await whatsappService.sendContactMessage(to, contact);
    }

    async sendLocation(to) {
        const location = {
            latitude: 40.712776,
            longitude: -74.005974,
            name: "MedPet Clinic",
            address: "123 Calle de las Mascotas, Ciudad, Estado, 12345, País"
        };

        await whatsappService.sendLocationMessage(to, location);
    }
}

export default new MessageHandler();