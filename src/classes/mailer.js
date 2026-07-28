import nodemailer from 'nodemailer'
import { logToFile } from '../utilities/util.js';

class Mailer {
    constructor(subject, message) {
        this.subject = subject;
        this.message = message;
    }

    async sendEmail() {
        if(!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD && process.env.EMAIL_HOST
            && process.env.EMAIL_PORT && process.env.EMAIL_RECIPIENTS)) {
            return logToFile("Não foi possível enviar o e-mail," + 
                "verifique o usuário, senha, host, porta e destinatários.");
        }

        const { error, success } = await (async () => {
            try {
                const transporter = nodemailer.createTransport({
                    host: process.env.EMAIL_HOST,
                    port: process.env.PORT,
                    secure: true,
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASSWORD,
                    }
                });
        
                const info = await transporter.sendMail({
                    from: `"SISTEMA" <${process.env.EMAIL_USER}>`,
                    to: JSON.parse(process.env.EMAIL_RECIPIENTS) || process.env.EMAIL_USER,
                    subject: this.subject,
                    text: this.message,
                    html: this.message
                });

                return { success: true }

            } catch (error) {
                return { error };
            }
        })();

        logToFile(
            success ?
            `E-mail enviado para ${process.env.EMAIL_RECIPIENTS}` :
            "Falha no envio do e-mail.");
    }
}

export { Mailer }