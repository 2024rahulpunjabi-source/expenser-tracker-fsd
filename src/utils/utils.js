export const setCookie = (name, value, days) => {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000))
    document.cookie = `${name} = ${value};expires=${date.toUTCString()}`
}

export const getCookie = (name) => {
    const cookies = document.cookie.split(";")
    for (let cookie of cookies ) {
        cookie = cookie.trim()
        const [key, value] = cookie.split("=");
        if (key === name) {
            return value
        }
    }
    return null;
}