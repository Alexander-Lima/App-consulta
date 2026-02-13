const fs = require("fs")

class Cache {
    path = `${__dirname}/../cache`;
    defaultExpiration = 3 * 60 * 60 * 1000

    async put(name, data, Msexpires = this.defaultExpiration) {
        await this.delete(name);
        await fs.promises.writeFile(`${this.path}/${name}.${Date.now() + Msexpires}`, JSON.stringify(data));
    }

    async get(name) {
        const file = await this.fileExists(name);

        if(!file) {
            return false;
        }
        const expirationTime = file.split(".")?.[1];
        const isExpired = Date.now() > expirationTime

        if(isExpired) {
            this.delete(name);
            return false;
        }

        if(file) {
            return JSON.parse(await fs.promises.readFile(`${this.path}/${file}`)); 
        }
    }

    async delete(name) {
        const files = await this.fileExists(name, false);

        for(const file of files) {
            await fs.promises.unlink(`${this.path}/${file}`)
        }
    }

    async fileExists(name, returnOnlyFirst = true) {
        const files = 
            Array.from(await fs.promises.readdir(this.path)).filter(file => file.includes(name));
        
        return returnOnlyFirst ? files[0] : files;
    }
}

module.exports = Cache;
