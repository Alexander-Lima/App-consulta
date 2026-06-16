import { compare } from 'bcrypt';
import getUserPasswordHash from './auth.respository.js'

export default async function (user, pass) {
    return new Promise(async (res) => {
        const resp  = await getUserPasswordHash(user);

        if(!resp) {
            return res(false);
        }

        const { hash } = resp;
        compare(pass, hash, (err, result) => {
            if(err) {
                rej(false);
            }
            
            res(result);
        })
    })
}