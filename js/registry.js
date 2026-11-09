// registry.js - every lesson file calls MK.register({...}).
window.MK = {
    lessons: [],
    register(lesson) {
        this.lessons.push(lesson);
    },
    find(id) {
        return this.lessons.find(l => l.id === id);
    }
};
