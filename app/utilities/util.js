module.exports.util = {
    sanitizeCNPJ : function (cnpj) {
        const regex = /^[0-9]{11,14}$/
        
        if(!regex.test(cnpj)) return false
        return cnpj
    },
    
    normalizeName : function (name) {
        return name.replaceAll(";", "").substring(0,50).toUpperCase()
    }
}