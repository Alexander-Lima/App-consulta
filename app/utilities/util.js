module.exports.util = {
    sanitizeCNPJ : function (cnpj) {
        const regex = /^[0-9]{11,14}$/
        
        if(!regex.test(cnpj)) return false
        return cnpj
    },
    
    normalizeName : function (name) {
        return name.replaceAll(";", "").substring(0,50).toUpperCase()
    },

    getPromisesArray: async function(itemsArray, functionToProcess, itemsToProcess) {
        let promisesArray = []

        for(let index = 0; index < itemsToProcess; index++) {
            if(itemsArray.length > 0) {
                const arrayItem = itemsArray.pop()
                promisesArray.push(functionToProcess(arrayItem))
                continue
            }
            break
        }
        return Promise.all(promisesArray)
    }
}