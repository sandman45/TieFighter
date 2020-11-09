const app = "TIE_FIGHTER";

const Api = {
    setItem: (key, value) => {
        localStorage.setItem(`${app}:${key}`, JSON.stringify(value));
    },
    getItem: key => {
        let item;

        item = localStorage.getItem(`${app}:${key}`);

        let results = null;
        try {
            results = JSON.parse(item);
        } catch (e) {
            console.log(e);
        }
        return results;
    },
    removeItem: key => {
        return localStorage.removeItem(`${app}:${key}`);
    },
};

export default Api;
