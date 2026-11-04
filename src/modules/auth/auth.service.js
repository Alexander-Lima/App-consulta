import { compare } from 'bcrypt';
import { promisify } from "node:util";
import getUserPasswordHash from './auth.respository.js'

const compareAsync = promisify(compare);

export default async function (user, pass) {
    const resp = await getUserPasswordHash(user);

    if (!resp) {
        return false;
    }

    return compareAsync(pass, resp.hash || "");
}